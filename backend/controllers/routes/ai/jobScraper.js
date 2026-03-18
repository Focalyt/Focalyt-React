const express = require("express");
const router = express.Router();
const Anthropic = require("@anthropic-ai/sdk");
const puppeteer = require("puppeteer");
const axios = require("axios");
const cheerio = require("cheerio");
const { Vacancy } = require("../../models");
const { getAuthToken } = require("../services/googleservice");
const { sheetId } = require("../../../config");
const crypto = require("crypto");

router.post("/scrape-jobs/linkedin", async (req, res) => {
  try {
    const { searchQuery, location, maxPages = 1, sheetName = "LinkedIn Jobs" } = req.body;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY; // optional now

    // Allow empty searchQuery to get all jobs (all sectors)
    // If searchQuery is empty, we'll search without keywords to get all jobs
    const finalSearchQuery = searchQuery && searchQuery.trim() ? searchQuery.trim() : "";

    console.log(`[LinkedIn Scraper] 🚀 Starting LinkedIn job scraping...`);
    console.log(`[LinkedIn Scraper] Query: "${finalSearchQuery || 'ALL JOBS (no filter)'}", Location: "${location || 'Any'}"`);

    // Step 1: Prefer LinkedIn guest endpoint (no login, no JS)
    let jobs = [];
    try {
      jobs = await scrapeLinkedInWithGuestApi({ searchQuery: finalSearchQuery, location, maxPages });
      console.log(`[LinkedIn Scraper] ✅ Guest scrape extracted ${jobs.length} jobs`);
    } catch (guestErr) {
      console.error("[LinkedIn Scraper] ⚠️ Guest scrape failed:", guestErr.message);
    }

    // Step 2 (fallback): If guest scrape returns nothing, try Puppeteer full page scrape
    if (jobs.length === 0) {
      const linkedinUrl = buildLinkedInSearchUrl(finalSearchQuery, location, true);
      console.log(`[LinkedIn Scraper] URL (fallback puppeteer): ${linkedinUrl}`);

      let htmlContent = "";
      try {
        htmlContent = await scrapeLinkedInWithPuppeteer(linkedinUrl, maxPages);
        console.log(`[LinkedIn Scraper] ✅ Puppeteer scraped ${htmlContent.length} chars of HTML`);
      } catch (error) {
        console.error("[LinkedIn Scraper] ❌ Puppeteer scraping error:", error);
        // Don't hard-fail; return a helpful message for debugging.
        return res.status(200).json({
          status: true,
          message:
            "LinkedIn returned no usable job listings (likely blocked or sign-in wall). Try again after some time or use a different network/IP.",
          jobs: [],
          savedToSheet: false,
          savedCount: 0,
          sheetName,
        });
      }

      // Step 3: Extract jobs from HTML (Anthropic if configured, otherwise Cheerio)
      if (anthropicApiKey) {
        jobs = await extractJobsWithAnthropic(anthropicApiKey, htmlContent, "linkedin");
        console.log(`[LinkedIn Scraper] ✅ Extracted ${jobs.length} jobs using Anthropic AI`);
      } else {
        jobs = extractJobsWithCheerio(htmlContent, "linkedin");
        console.log(`[LinkedIn Scraper] ✅ Extracted ${jobs.length} jobs using Cheerio (no Anthropic key)`);
      }
    }

    if (jobs.length === 0) {
      return res.json({
        status: true,
        message: "No jobs found. Try different search terms or location.",
        jobs: [],
        savedToSheet: false,
        savedCount: 0,
        sheetName: sheetName,
      });
    }

    // Step 3.5: Enrich jobs with contact info (email/phone) from job detail pages
    // Skip enrichment if too many jobs (to avoid timeout) - can be enabled via query param
    const enrichContactInfo = req.body.enrichContactInfo !== false && jobs.length <= 50;
    
    if (enrichContactInfo) {
      console.log(`[LinkedIn Scraper] 📧 Enriching ${jobs.length} jobs with contact info...`);
      try {
        jobs = await enrichJobsWithContactInfo(jobs);
        console.log(`[LinkedIn Scraper] ✅ Enriched jobs with contact info`);
      } catch (enrichError) {
        console.error(`[LinkedIn Scraper] ⚠️ Contact enrichment failed, continuing without it:`, enrichError.message);
        // Continue without contact info
      }
    } else {
      console.log(`[LinkedIn Scraper] ⏭️ Skipping contact info enrichment (${jobs.length} jobs - too many for enrichment)`);
      // Add empty email/phone fields
      jobs = jobs.map(job => ({ ...job, email: "", phone: "" }));
    }

    // Step 4: Save to Google Sheets
    let savedToSheet = false;
    let savedCount = 0;
    let duplicateCount = 0;
    let sheetErrorMessage = "";
    
    try {
      const saveResult = await saveJobsToGoogleSheet(jobs, sheetName);
      
      // Handle both old format (number) and new format (object)
      if (typeof saveResult === 'object' && saveResult.newJobsCount !== undefined) {
        savedCount = saveResult.newJobsCount;
        duplicateCount = saveResult.duplicateCount || 0;
      } else {
        savedCount = saveResult || 0;
        duplicateCount = 0;
      }
      
      savedToSheet = savedCount > 0;
      
      if (duplicateCount > 0) {
        console.log(`[LinkedIn Scraper] ✅ Saved ${savedCount} new jobs, skipped ${duplicateCount} duplicates in Google Sheet: "${sheetName}"`);
      } else {
        console.log(`[LinkedIn Scraper] ✅ Saved ${savedCount} jobs to Google Sheet: "${sheetName}"`);
      }
    } catch (sheetError) {
      console.error("[LinkedIn Scraper] ❌ Google Sheets error:", sheetError);
      sheetErrorMessage =
        sheetError?.response?.data?.error?.message ||
        sheetError?.message ||
        "Unknown Google Sheets error";
      // Continue even if sheet save fails
    }

    const message = duplicateCount > 0
      ? `Successfully scraped ${jobs.length} jobs from LinkedIn. ${savedCount} new jobs saved, ${duplicateCount} duplicates skipped.`
      : `Successfully scraped ${jobs.length} jobs from LinkedIn${
          savedToSheet
            ? ` and saved ${savedCount} to Google Sheets`
            : sheetErrorMessage
              ? `. (Google Sheets save failed: ${sheetErrorMessage})`
              : ""
        }`;

    return res.json({
      status: true,
      message: message,
      jobs: jobs,
      savedToSheet: savedToSheet,
      savedCount: savedCount,
      duplicateCount: duplicateCount,
      sheetName: sheetName,
      sheetError: sheetErrorMessage || undefined,
    });

  } catch (error) {
    console.error("[LinkedIn Scraper] ❌ Error:", error);
    return res.status(500).json({
      status: false,
      message: "LinkedIn job scraping failed",
      error: error.message,
    });
  }
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract email and phone from text using regex
 */
function extractContactInfo(text) {
  if (!text) return { email: "", phone: "" };
  
  // Email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex) || [];
  const email = emails[0] || "";
  
  // Phone regex (Indian formats: +91, 91, 0, or direct 10 digits)
  const phoneRegex = /(?:\+91|91|0)?[-\s]?[6-9]\d{9}/g;
  const phones = text.match(phoneRegex) || [];
  // Clean phone number
  const phone = phones[0] ? phones[0].replace(/[-\s]/g, "") : "";
  
  return { email, phone };
}

/**
 * Enrich jobs with contact info by scraping job detail pages
 */
async function enrichJobsWithContactInfo(jobs) {
  const enrichedJobs = [];
  
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const jobUrl = job.url || job.jobUrl;
    
    if (!jobUrl) {
      enrichedJobs.push({ ...job, email: "", phone: "" });
      continue;
    }
    
    try {
      // Try to get job detail page
      const response = await axios.get(jobUrl, {
        timeout: 30000,
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "accept-language": "en-US,en;q=0.9",
        },
      });
      
      const html = typeof response.data === "string" ? response.data : "";
      const $ = cheerio.load(html);
      
      // Extract description text
      const description = 
        $(".description__text, .show-more-less-html__markup, [class*='description']").text() ||
        $("body").text();
      
      // Extract contact info from description
      const contactInfo = extractContactInfo(description);
      
      enrichedJobs.push({
        ...job,
        email: contactInfo.email,
        phone: contactInfo.phone,
        description: job.description || description.substring(0, 1000),
      });
      
      // Rate limiting: delay between requests
      if (i < jobs.length - 1) {
        await delay(500 + Math.floor(Math.random() * 500));
      }
    } catch (error) {
      // If detail page fails, keep original job without contact info
      console.log(`[LinkedIn Scraper] ⚠️ Could not fetch contact info for job ${i + 1}: ${error.message}`);
      enrichedJobs.push({ ...job, email: "", phone: "" });
    }
  }
  
  return enrichedJobs;
}

function buildLinkedInGuestApiUrl({ searchQuery, location, start = 0 }) {
  const params = new URLSearchParams();
  // If searchQuery is empty, don't add keywords param to get ALL jobs
  if (searchQuery && searchQuery.trim()) {
    params.set("keywords", searchQuery.trim());
  }
  if (location && location.trim()) {
    params.set("location", location.trim());
  }
  params.set("start", String(start));
  return `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params.toString()}`;
}

function normalizeLinkedInJobUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `https://www.linkedin.com${url}`;
  return `https://www.linkedin.com/${url}`;
}

function splitCityState(rawLocation) {
  const loc = (rawLocation || "").trim();
  if (!loc) return { city: "", state: "" };
  
  // Handle formats like:
  // "Mumbai, Maharashtra" -> city: Mumbai, state: Maharashtra
  // "Mumbai Maharashtra" -> city: Mumbai, state: Maharashtra
  // "Mumbai Metropolitan Region" -> city: Mumbai Metropolitan Region, state: ""
  // "Bengaluru Karnataka" -> city: Bengaluru, state: Karnataka
  
  // First try comma split
  if (loc.includes(",")) {
    const parts = loc.split(",").map((p) => p.trim()).filter(Boolean);
    return {
      city: parts[0] || "",
      state: parts.slice(1).join(", ").trim() || "",
    };
  }
  
  // Try space split for "City State" format
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Puducherry", "Chandigarh"
  ];
  
  // Check if location ends with a state name
  for (const state of indianStates) {
    if (loc.endsWith(state)) {
      const city = loc.substring(0, loc.length - state.length).trim();
      return {
        city: city || loc,
        state: state,
      };
    }
  }
  
  // If no state found, return entire location as city
  return {
    city: loc,
    state: "",
  };
}

function extractJobsFromLinkedInGuestHtml(html) {
  const $ = cheerio.load(html || "");
  const jobs = [];

  // Try multiple selectors to catch all job cards
  const selectors = [
    "li.base-card", // Most common in guest API
    ".base-card", 
    "li[data-entity-urn*='job']",
    "li[data-job-id]",
    ".job-result-card",
    "li", // Fallback
  ];

  const seenUrls = new Set();

  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const $el = $(el);

      // Try multiple title selectors
      const title =
        $el.find(".base-search-card__title").first().text().trim() ||
        $el.find("h3.base-search-card__title").first().text().trim() ||
        $el.find("h3").first().text().trim() ||
        $el.find("[class*='title']").first().text().trim();

      // Try multiple company selectors
      const company =
        $el.find(".base-search-card__subtitle").first().text().trim() ||
        $el.find("h4.base-search-card__subtitle").first().text().trim() ||
        $el.find("h4").first().text().trim() ||
        $el.find("[class*='subtitle']").first().text().trim();

      // Try multiple location selectors
      const rawLocation =
        $el.find(".job-search-card__location").first().text().trim() ||
        $el.find(".base-search-card__metadata").first().text().trim() ||
        $el.find("[class*='location']").first().text().trim();

      // Extract snippet/description if available
      const snippet =
        $el.find(".job-search-card__snippet").first().text().trim() ||
        $el.find(".base-search-card__snippet").first().text().trim() ||
        $el.find("[class*='snippet']").first().text().trim() ||
        "";

      // Try to extract work mode (Remote/Hybrid/On-site) from metadata
      const metadataText = $el.find(".base-search-card__metadata, [class*='metadata']").text().toLowerCase() || "";
      let workMode = "";
      if (metadataText.includes("remote")) workMode = "Remote";
      else if (metadataText.includes("hybrid")) workMode = "Hybrid";
      else if (metadataText.includes("on-site") || metadataText.includes("onsite")) workMode = "On-site";
      else if (metadataText.includes("full-time")) workMode = "Full-time";
      else if (metadataText.includes("part-time")) workMode = "Part-time";

      // Try to extract salary if mentioned in snippet or metadata
      let salary = null;
      const salaryMatch = (snippet + " " + metadataText).match(/(?:₹|rs\.?|inr)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|lpa|per annum|pa)/i) ||
                        (snippet + " " + metadataText).match(/(\d+(?:,\d+)*)\s*(?:-|to|–)\s*(\d+(?:,\d+)*)\s*(?:lakh|lpa)/i);
      if (salaryMatch) {
        const min = parseFloat(salaryMatch[1].replace(/,/g, '')) * (salaryMatch[0].toLowerCase().includes('lakh') ? 100000 : 1);
        const max = parseFloat(salaryMatch[2].replace(/,/g, '')) * (salaryMatch[0].toLowerCase().includes('lakh') ? 100000 : 1);
        salary = { min: Math.round(min), max: Math.round(max), currency: "INR" };
      }

      // Try to extract experience if mentioned
      let experience = null;
      const expMatch = (snippet + " " + metadataText).match(/(\d+)\s*(?:-|to|–)\s*(\d+)\s*(?:years?|yrs?)/i) ||
                       (snippet + " " + metadataText).match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:experience|exp)/i);
      if (expMatch) {
        const min = parseInt(expMatch[1]);
        const max = expMatch[2] ? parseInt(expMatch[2]) : min;
        experience = { min, max, unit: "years" };
      }

      // Try multiple link selectors
      const link =
        $el.find("a.base-card__full-link").attr("href") ||
        $el.find("a[href*='/jobs/view/']").attr("href") ||
        $el.find("a").first().attr("href");

      const jobUrl = normalizeLinkedInJobUrl(link);
      
      // Skip if missing required fields or duplicate
      if (!title || !company || !jobUrl) return;
      if (seenUrls.has(jobUrl)) return;
      seenUrls.add(jobUrl);

      jobs.push({
        title,
        company,
        location: splitCityState(rawLocation),
        workMode: workMode || "",
        description: snippet || "",
        skills: [],
        qualification: "",
        salary: salary,
        experience: experience,
        url: jobUrl,
        jobUrl: jobUrl,
      });
    });

    // If we found jobs with this selector, use it (don't try others)
    if (jobs.length > 0) break;
  }

  // de-dupe by jobUrl
  const seen = new Set();
  const deduped = [];
  for (const j of jobs) {
    const key = j.jobUrl || j.url || `${j.title}|${j.company}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(j);
  }
  return deduped;
}

async function scrapeLinkedInWithGuestApi({ searchQuery, location, maxPages = 1 }) {
  const allJobs = [];
  const perPage = 25;

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const start = (pageNum - 1) * perPage;
    const url = buildLinkedInGuestApiUrl({ searchQuery, location, start });
    console.log(`[LinkedIn Scraper] 📄 Guest API page ${pageNum}/${maxPages} (start=${start}): ${url}`);

    let retries = 3;
    let lastError = null;
    let pageSuccess = false;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const resp = await axios.get(url, {
          timeout: 90000, // Increased to 90 seconds per page
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "accept-language": "en-US,en;q=0.9",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "cache-control": "no-cache",
            pragma: "no-cache",
          },
        });

      const html = typeof resp.data === "string" ? resp.data : "";
      let jobs = extractJobsFromLinkedInGuestHtml(html);
      
      // If Anthropic is available and we have jobs, try to enrich with AI extraction
      // Only do this for first few pages to avoid rate limits
      if (jobs.length > 0 && process.env.ANTHROPIC_API_KEY && pageNum <= 3) {
        try {
          const enrichedJobs = await extractJobsWithAnthropic(process.env.ANTHROPIC_API_KEY, html, "linkedin");
          
          // Merge enriched data with basic extraction (match by URL)
          const enrichedMap = new Map();
          enrichedJobs.forEach(job => {
            const key = job.url || job.jobUrl;
            if (key) enrichedMap.set(key, job);
          });
          
          jobs = jobs.map(job => {
            const enriched = enrichedMap.get(job.url || job.jobUrl);
            if (enriched) {
              return {
                ...job,
                salary: enriched.salary || job.salary,
                experience: enriched.experience || job.experience,
                workMode: enriched.workMode || job.workMode,
                description: (enriched.description || job.description || "").substring(0, 1000),
                skills: enriched.skills || job.skills,
                qualification: enriched.qualification || job.qualification,
              };
            }
            return job;
          });
          console.log(`[LinkedIn Scraper] 🤖 AI enriched ${jobs.filter(j => j.salary || j.experience || j.workMode).length} jobs with additional data`);
        } catch (aiError) {
          // If AI enrichment fails, use basic extraction
          console.log(`[LinkedIn Scraper] ⚠️ AI enrichment failed for page ${pageNum}, using basic extraction: ${aiError.message}`);
        }
      }
      
      console.log(`[LinkedIn Scraper] ✅ Guest page ${pageNum} extracted ${jobs.length} jobs (total so far: ${allJobs.length + jobs.length})`);

      allJobs.push(...jobs);
        pageSuccess = true;

        // If a page returns very few jobs (< 5), might be end of results
        if (jobs.length < 5 && pageNum > 1) {
          console.log(`[LinkedIn Scraper] ⚠️ Page ${pageNum} returned only ${jobs.length} jobs, might be end of results`);
        }

        // Success - break retry loop
        break;
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === retries;
        const isFirstPage = pageNum === 1;
        
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
          console.error(`[LinkedIn Scraper] ⚠️ Page ${pageNum} attempt ${attempt}/${retries} failed: ${error.message}`);
          
          if (isLastAttempt) {
            if (isFirstPage) {
              // First page failure after all retries - throw error
              throw new Error(`Failed to scrape page ${pageNum} after ${retries} attempts: ${error.message}`);
            } else {
              // Subsequent page failure - log and continue
              console.log(`[LinkedIn Scraper] ⚠️ Skipping page ${pageNum} after ${retries} failed attempts`);
              break; // Break retry loop, continue to next page
            }
          } else {
            // Retry with exponential backoff
            const backoffDelay = 2000 * Math.pow(2, attempt - 1);
            console.log(`[LinkedIn Scraper] ⏳ Retrying page ${pageNum} in ${backoffDelay}ms...`);
            await delay(backoffDelay);
          }
        } else {
          // Non-retryable error
          if (isFirstPage) throw error;
          console.log(`[LinkedIn Scraper] ⚠️ Non-retryable error on page ${pageNum}, skipping...`);
          break;
        }
      }
    }
    
    // If page succeeded, add delay before next page
    if (pageSuccess && pageNum < maxPages) {
      const delayMs = 1500 + Math.floor(Math.random() * 1000); // Increased delay
      await delay(delayMs);
    } else if (!pageSuccess && pageNum > 1) {
      // If page failed and it's not first page, wait before continuing
      await delay(2000);
    }
  }

  // de-dupe across pages
  const seen = new Set();
  const deduped = [];
  for (const j of allJobs) {
    const key = j.jobUrl || j.url || crypto.createHash("sha1").update(`${j.title}|${j.company}`).digest("hex");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(j);
  }
  return deduped;
}

/**
 * Build LinkedIn search URL
 */
function buildLinkedInSearchUrl(query, location, includeRemote = true) {
  const params = new URLSearchParams();
  params.append('keywords', query || '');
  if (location) {
    params.append('location', location);
  }
  
  // Recent jobs (last 24 hours)
  params.append('f_TPR', 'r86400');
  
  // Experience levels (all levels)
  params.append('f_E', '1,2,3,4');
  
  // Work type: Remote, On-site, Hybrid
  if (includeRemote) {
    params.append('f_WT', '1,2,3'); // 1=On-site, 2=Remote, 3=Hybrid
  }
  
  // Sort by most recent
  params.append('sortBy', 'DD'); // DD = Date Posted (most recent)
  
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

/**
 * Scrape LinkedIn with Puppeteer (handles JavaScript rendering)
 */
async function scrapeLinkedInWithPuppeteer(url, maxPages = 1) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    let allHtml = "";

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const pageUrl = pageNum === 1 ? url : `${url}&start=${(pageNum - 1) * 25}`;
      console.log(`[LinkedIn Scraper] 📄 Scraping page ${pageNum}: ${pageUrl}`);
      
      try {
        await page.goto(pageUrl, { 
          waitUntil: 'networkidle2', 
          timeout: 60000 
        });
        
        // Wait for job listings to load
        await page.waitForSelector('.jobs-search__results-list, .scaffold-layout__list-container, [class*="job"]', { timeout: 30000 });
        
        // Scroll to load more jobs (LinkedIn lazy loads)
        await page.evaluate(() => {
          return new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if (totalHeight >= scrollHeight) {
                clearInterval(timer);
                resolve();
              }
            }, 100);
          });
        });

        // Wait a bit more for content to load
        await page.waitForTimeout(3000);
        
        const html = await page.content();
        allHtml += html;
        
        console.log(`[LinkedIn Scraper] ✅ Page ${pageNum} scraped (${html.length} chars)`);
      } catch (pageError) {
        console.error(`[LinkedIn Scraper] ⚠️ Error on page ${pageNum}:`, pageError.message);
        if (pageNum === 1) throw pageError; // Fail if first page fails
        break; // Continue with what we have
      }
    }

    await browser.close();
    return allHtml;

  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

/**
 * Use Anthropic AI to extract structured job data from HTML
 */
async function extractJobsWithAnthropic(apiKey, htmlContent, source) {
  const anthropic = new Anthropic({ apiKey });

  // Clean HTML - remove scripts, styles, etc. (for better token efficiency)
  const $ = cheerio.load(htmlContent);
  $('script, style, noscript, iframe, img').remove();
  
  // For LinkedIn, focus on job listing containers
  if (source === "linkedin") {
    // Keep only job-related content
    const jobContainers = $('.jobs-search__results-list, .scaffold-layout__list-container, [class*="job"], [data-job-id]');
    if (jobContainers.length > 0) {
      const cleanedHtml = jobContainers.map((i, el) => $(el).html()).get().join('\n');
      htmlContent = cleanedHtml.substring(0, 150000); // Limit to ~150k chars
    } else {
      htmlContent = $.html().substring(0, 150000);
    }
  } else {
    htmlContent = $.html().substring(0, 150000);
  }

  const prompt = `You are a job data extraction expert. Extract ALL job listings from the following HTML content.

HTML CONTENT:
${htmlContent}

SOURCE: ${source}

TASK:
1. Identify ALL job listings in the HTML
2. Extract structured data for each job
3. Return ONLY valid JSON array, no markdown, no explanations

OUTPUT FORMAT (JSON array):
[
  {
    "title": "Job Title",
    "company": "Company Name",
    "location": {
      "city": "City Name",
      "state": "State Name",
      "country": "India"
    },
    "salary": {
      "min": 25000,
      "max": 50000,
      "currency": "INR",
      "type": "range"
    },
    "experience": {
      "min": 1,
      "max": 3,
      "unit": "years"
    },
    "description": "Full job description (at least 100 characters if available)",
    "skills": ["Skill1", "Skill2", "Skill3"],
    "qualification": "B.Tech",
    "workMode": "Full-time",
    "url": "https://linkedin.com/jobs/view/123456",
    "jobUrl": "https://linkedin.com/jobs/view/123456"
  }
]

IMPORTANT RULES:
- Return ONLY valid JSON array, no markdown code blocks
- Extract ALL jobs found (minimum 5-10 jobs if available)
- If salary not found, set salary to null
- If experience not found, set experience to null
- Extract city and state separately from location strings
- For LinkedIn: Look for job cards, job titles, company names, locations
- Extract job URLs/links if available
- Be accurate with all data extraction`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Fast and cost-effective
      max_tokens: 8000, // Increased for more jobs
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0].text;
    
    // Parse JSON from response
    let jsonStr = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/^.*?```json\s*/s, '').replace(/\s*```.*?$/s, '');
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/^.*?```\s*/s, '').replace(/\s*```.*?$/s, '');
    }
    
    // Remove any leading/trailing text before/after JSON
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const jobs = JSON.parse(jsonStr);
    const validJobs = Array.isArray(jobs) ? jobs.filter(job => job.title && job.company) : [];
    
    console.log(`[Anthropic] ✅ Extracted ${validJobs.length} valid jobs`);
    return validJobs;

  } catch (error) {
    console.error("[Scraper] ❌ Anthropic extraction error:", error.message);
    
    // Fallback: Try basic HTML parsing
    console.log("[Scraper] ⚠️ Falling back to basic HTML parsing...");
    return extractJobsWithCheerio(htmlContent, source);
  }
}

/**
 * Fallback: Basic HTML parsing with Cheerio (if Anthropic fails)
 */
function extractJobsWithCheerio(htmlContent, source = "unknown") {
  const $ = cheerio.load(htmlContent);
  const jobs = [];

  if (source === "linkedin") {
    // LinkedIn-specific selectors
    $('.job-search-card, .jobs-search-results__list-item, [data-job-id]').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h3, .job-search-card__title, [class*="title"]').first().text().trim();
      const company = $elem.find('.job-search-card__company-name, [class*="company"]').first().text().trim();
      const location = $elem.find('.job-search-card__location, [class*="location"]').first().text().trim();
      
      if (title && company) {
        jobs.push({
          title: title,
          company: company,
          location: {
            city: location.split(',')[0] || location,
            state: location.split(',')[1] || "",
          },
          description: $elem.find('.job-search-card__snippet, [class*="description"]').first().text().trim(),
        });
      }
    });
  } else {
    // Generic extraction
    $('.job-listing, .job-card, [class*="job"]').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h2, h3, .title, [class*="title"]').first().text().trim();
      const company = $elem.find('.company, [class*="company"]').first().text().trim();
      
      if (title) {
        jobs.push({
          title: title,
          company: company,
          location: {
            city: $elem.find('.location, [class*="location"]').first().text().trim(),
          },
          description: $elem.find('.description, [class*="description"]').first().text().trim(),
        });
      }
    });
  }

  return jobs;
}

/**
 * Save jobs to Google Sheets
 */
async function saveJobsToGoogleSheet(jobs, sheetName = "LinkedIn Jobs") {
  try {
    const googleSheetClient = await getAuthToken();
    
    // Prepare header row (as per user requirements)
    const headers = [
      "Job title",
      "Connection",  // Company name
      "Working",     // Work mode (Remote/Hybrid/On-site)
      "Sallery",    // Salary (combined min-max or single value)
      "Experience", // Experience (combined min-max or single value)
      "Expectation", // Description/Requirements
      "Experience", // Duplicate as per user requirement
      "State",
      "city",
      "Email",       // Contact email
      "Phone",       // Contact phone
      "linkedin profile", // Job URL
      "Date"        // Scraped date
    ];

    // Prepare data rows (matching new headers)
    const rows = jobs.map(job => {
      // Format salary: "25000-50000" or single value
      const salaryStr = job.salary?.min && job.salary?.max 
        ? `${job.salary.min}-${job.salary.max}` 
        : job.salary?.min || job.salary?.max || "";
      
      // Format experience: "1-3 years" or single value
      const expStr = job.experience?.min && job.experience?.max
        ? `${job.experience.min}-${job.experience.max} years`
        : job.experience?.min 
          ? `${job.experience.min} years`
          : job.experience?.max
            ? `${job.experience.max} years`
            : "";
      
      return [
        job.title || "",                                    // Job title
        job.company || "",                                  // Connection (Company)
        job.workMode || "",                                 // Working (Work mode)
        salaryStr,                                          // Sallery
        expStr,                                             // Experience (first)
        (job.description || "").substring(0, 500),        // Expectation (Description)
        expStr,                                             // Experience (duplicate)
        job.location?.state || "",                          // State
        job.location?.city || "",                          // city
        job.email || "",                                    // Email
        job.phone || "",                                    // Phone
        job.url || job.jobUrl || "",                       // linkedin profile
        new Date().toISOString().split('T')[0]             // Date
      ];
    });

    // Check if sheet exists, if not create it
    try {
      const spreadsheet = await googleSheetClient.spreadsheets.get({
        spreadsheetId: sheetId,
      });

      const sheetExists = spreadsheet.data.sheets?.some(
        sheet => sheet.properties.title === sheetName
      );

      if (!sheetExists) {
        // Create new sheet
        await googleSheetClient.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName,
                }
              }
            }]
          }
        });

        // Add headers
        await googleSheetClient.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          resource: {
            majorDimension: 'ROWS',
            values: [headers]
          },
        });
      } else {
        // Check if headers exist
        const headerCheck = await googleSheetClient.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `${sheetName}!A1:M1`, // Updated for 13 columns (Job title through Date, including Email and Phone)
        });

        if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
          // Add headers
          await googleSheetClient.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
              majorDimension: 'ROWS',
              values: [headers]
            },
          });
        }
      }

      // Step: Check for existing jobs to avoid duplicates
      console.log(`[Google Sheets] 🔍 Checking for existing jobs in sheet...`);
      let existingJobUrls = new Set();
      
      try {
        // Read all existing data (skip header row)
        const existingData = await googleSheetClient.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `${sheetName}!A2:M`, // Read from row 2 onwards (skip header)
        });

        if (existingData.data.values && existingData.data.values.length > 0) {
          // LinkedIn profile URL is in column K (index 11)
          existingData.data.values.forEach(row => {
            if (row[11]) { // Column K (linkedin profile)
              const url = row[11].trim();
              if (url) {
                existingJobUrls.add(url);
              }
            }
          });
          console.log(`[Google Sheets] ✅ Found ${existingJobUrls.size} existing jobs in sheet`);
        }
      } catch (readError) {
        console.log(`[Google Sheets] ⚠️ Could not read existing data: ${readError.message}`);
        // Continue anyway - might be first run or empty sheet
      }

      // Filter out jobs that already exist
      const newJobs = [];
      const newRows = [];
      
      rows.forEach((row, index) => {
        const jobUrl = row[11]; // LinkedIn profile URL column
        if (!existingJobUrls.has(jobUrl)) {
          newJobs.push(jobs[index]);
          newRows.push(row);
        }
      });

      console.log(`[Google Sheets] 📊 Filtered results: ${jobs.length} total jobs, ${existingJobUrls.size} already exist, ${newJobs.length} new jobs to add`);

      if (newRows.length === 0) {
        console.log(`[Google Sheets] ℹ️ No new jobs to add - all jobs already exist in sheet`);
        return {
          newJobsCount: 0,
          duplicateCount: jobs.length,
          totalProcessed: jobs.length
        };
      }

      // Append only new job data
      await googleSheetClient.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${sheetName}`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          majorDimension: 'ROWS',
          values: newRows
        },
      });

      console.log(`[Google Sheets] ✅ Added ${newRows.length} new jobs to sheet`);
      return {
        newJobsCount: newRows.length,
        duplicateCount: jobs.length - newJobs.length,
        totalProcessed: jobs.length
      };
    } catch (appendError) {
      console.error("[Google Sheets] Append error:", appendError);
      throw appendError;
    }
  } catch (error) {
    console.error("[Google Sheets] ❌ Error saving to sheet:", error);
    throw error;
  }
}

/**
 * GET /api/ai/scrape-jobs/test
 * Test endpoint to verify scraping setup
 */
router.get("/scrape-jobs/test", async (req, res) => {
  try {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicApiKey) {
      return res.json({
        status: false,
        message: "ANTHROPIC_API_KEY not configured",
      });
    }

    // Test with a simple HTML sample
    const testHtml = `
      <html>
        <body>
          <div class="job-search-card">
            <h3>Software Engineer</h3>
            <p class="job-search-card__company-name">Tech Corp</p>
            <p class="job-search-card__location">Mumbai, Maharashtra</p>
            <p class="job-search-card__snippet">We are looking for a skilled software engineer...</p>
          </div>
        </body>
      </html>
    `;

    const jobs = await extractJobsWithAnthropic(anthropicApiKey, testHtml, "linkedin");
    
    return res.json({
      status: true,
      message: "Scraping test successful",
      extractedJobs: jobs,
      anthropicConfigured: true,
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Test failed",
      error: error.message,
    });
  }
});

module.exports = router;

