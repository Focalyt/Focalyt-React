const express = require("express");
const router = express.Router();
const Anthropic = require("@anthropic-ai/sdk");
const { Vacancy, FAQ } = require("../../models");
const fs = require("fs").promises;
const path = require("path");

/**
 * AI-Powered Job Recommendations using Anthropic Claude
 * 
 * Features:
 * 1. Natural Language Job Search
 * 2. Smart Job Matching based on user profile
 * 3. Personalized Ranking
 * 4. Skill-based Recommendations
 */

/**
 * POST /api/ai/job-recommendations
 * 
 * Request Body:
 * {
 *   "userQuery": "I want a data analyst job in Mumbai with 2 years experience",
 *   "preferences": {
 *     "state": "Maharashtra",
 *     "city": "Mumbai",
 *     "maxExperienceYears": 2,
 *     "minSalary": 25000,
 *     "qualification": "B.Tech"
 *   },
 *   "userProfile": {
 *     "skills": ["Python", "SQL", "Excel"],
 *     "currentRole": "Data Analyst",
 *     "experience": 1.5
 *   }
 * }
 */
// Load training data helper
const TRAINING_DATA_FILE = path.join(__dirname, "../../../data/botTrainingData.json");
const loadTrainingData = async () => {
  try {
    const dataDir = path.dirname(TRAINING_DATA_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    const data = await fs.readFile(TRAINING_DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return {
      examples: [],
      rules: [],
      intents: [],
      lastUpdated: new Date().toISOString(),
    };
  }
};

// Find matching FAQ from database with improved matching algorithm
const findMatchingFAQ = async (userQuery) => {
  try {
    const queryLower = userQuery.toLowerCase().trim();
    
    if (!queryLower || queryLower.length < 2) {
      // console.log('[FAQ] Query too short or empty');
      return null;
    }
    
    // Fetch all active FAQs
    const faqs = await FAQ.find({
      status: true,
      isDeleted: { $ne: true }
    }).select('Question Answer').lean();
    
    if (!faqs || faqs.length === 0) {
      // console.log('[FAQ] ⚠️ No FAQs found in database. Please add FAQs in admin panel.');
      return null;
    }
    
    // console.log(`[FAQ] 🔍 Checking ${faqs.length} FAQs against query: "${userQuery}"`);
    
    // Also check if query is clearly a Q&A question (even if FAQ doesn't match)
    const qaKeywords = ['how to', 'how do', 'what is', 'what are', 'why', 'when', 'where', 
                        'can you explain', 'tell me about', 'guide me', 'help me understand',
                        'steps to', 'process of', 'way to', 'method to', 'procedure',
                        'apply for', 'application process', 'application procedure'];
    
    // Contact-related keywords
    const contactKeywords = ['contact', 'phone', 'number', 'email', 'address', 'location', 
                             'reach', 'reach out', 'get in touch', 'connect', 'support', 
                             'help desk', 'customer service', 'call', 'call us', 'contact us',
                             'phone number', 'mobile number', 'whatsapp', 'telephone'];
    
    // Check for phone number pattern (10 digits, with or without spaces/dashes)
    const phonePattern = /(\+?91[\s-]?)?[6-9]\d{9}/;
    const hasPhoneNumber = phonePattern.test(queryLower);
    
    // Check for email pattern
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const hasEmail = emailPattern.test(queryLower);
    
    const isQAQuestion = qaKeywords.some(keyword => queryLower.includes(keyword));
    const isContactQuery = contactKeywords.some(keyword => queryLower.includes(keyword)) || 
                          hasPhoneNumber || hasEmail;
    
    if (isQAQuestion) {
      // console.log(`[FAQ] ✅ Query detected as Q&A question: "${userQuery}"`);
    }
    
    if (isContactQuery) {
      // console.log(`[FAQ] ✅ Query detected as contact-related: "${userQuery}"`);
    }
    
    // Calculate similarity score for each FAQ
    let bestMatch = null;
    let bestScore = 0;
    const scoredFAQs = [];
    
    for (const faq of faqs) {
      const faqQuestion = (faq.Question || '').toLowerCase().trim();
      
      if (!faqQuestion) continue;
      
      let score = 0;
      
      // 1. Exact match (highest priority)
      if (faqQuestion === queryLower) {
        score = 1.0;
        // console.log(`[FAQ] Exact match found: "${faq.Question}"`);
      }
      // 2. Query contains FAQ question or vice versa
      else if (faqQuestion.includes(queryLower) || queryLower.includes(faqQuestion)) {
        const longer = faqQuestion.length > queryLower.length ? faqQuestion : queryLower;
        const shorter = faqQuestion.length > queryLower.length ? queryLower : faqQuestion;
        score = shorter.length / longer.length;
        score = Math.min(score + 0.3, 0.95); // Bonus for substring match
        // console.log(`[FAQ] Substring match: "${faq.Question}" (score: ${score.toFixed(2)})`);
      }
      // 3. Word-based similarity
      else {
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
        const faqWords = faqQuestion.split(/\s+/).filter(w => w.length > 2);
        
        if (queryWords.length === 0 || faqWords.length === 0) continue;
        
        // Calculate word overlap
        const commonWords = queryWords.filter(w => faqWords.includes(w));
        const uniqueWords = new Set([...queryWords, ...faqWords]);
        
        // Jaccard similarity
        const jaccardSimilarity = commonWords.length / uniqueWords.size;
        
        // Word order bonus (if words appear in same order)
        let orderBonus = 0;
        if (commonWords.length > 1) {
          const queryOrder = queryWords.map(w => commonWords.indexOf(w)).filter(i => i >= 0);
          const faqOrder = faqWords.map(w => commonWords.indexOf(w)).filter(i => i >= 0);
          if (queryOrder.length === faqOrder.length && 
              queryOrder.every((val, idx) => val === faqOrder[idx])) {
            orderBonus = 0.1;
          }
        }
        
        score = jaccardSimilarity + orderBonus;
        
        // Minimum threshold check
        if (score < 0.25) continue;
        
        // console.log(`[FAQ] Word similarity: "${faq.Question}" (score: ${score.toFixed(2)})`);
      }
      
      // Store scored FAQ
      scoredFAQs.push({ faq, score });
      
      // Update best match
      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }
    
    // Log top matches for debugging
    if (scoredFAQs.length > 0) {
      const topMatches = scoredFAQs
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(m => `"${m.faq.Question}" (${m.score.toFixed(2)})`)
        .join(', ');
      // console.log(`[FAQ] Top matches: ${topMatches}`);
    }
    
    // Return FAQ if similarity is good enough (lowered threshold for better matching)
    // For Q&A questions and contact queries, be more lenient with matching
    let threshold = 0.25;
    if (isContactQuery) {
      threshold = 0.10; // Very lenient for contact queries
    } else if (isQAQuestion) {
      threshold = 0.15;
    }
    
    if (bestScore >= threshold) {
      // console.log(`[FAQ] ✅ Best match: "${bestMatch.Question}" (score: ${bestScore.toFixed(2)}, threshold: ${threshold})`);
      return bestMatch;
    }
    
    // If it's a Q&A or contact question but no FAQ match, log warning
    if (isContactQuery || isQAQuestion) {
      const queryType = isContactQuery ? 'contact' : 'Q&A';
      // console.log(`[FAQ] ⚠️ ${queryType} question detected but no FAQ match found (best score: ${bestScore.toFixed(2)})`);
      // console.log(`[FAQ] 💡 Tip: Add FAQ in admin panel: Question="${userQuery}"`);
    } else {
      // console.log(`[FAQ] ❌ No good match found (best score: ${bestScore.toFixed(2)})`);
    }
    return null;
  } catch (error) {
    console.error('[FAQ] Error fetching FAQs:', error);
    return null;
  }
};

// Check if query is a Q&A question (not a job search)
const isQAQuery = (userQuery, trainingData) => {
  const queryLower = userQuery.toLowerCase().trim();
  
  // Q&A keywords
  const qaKeywords = [
    'how to', 'how do', 'what is', 'what are', 'why', 'when', 'where',
    'can you explain', 'tell me about', 'guide me', 'help me understand',
    'steps to', 'process of', 'way to', 'method to', 'procedure',
    'apply for', 'application process', 'application procedure'
  ];
  
  // Contact-related keywords
  const contactKeywords = [
    'contact', 'phone', 'number', 'email', 'address', 'location', 
    'reach', 'reach out', 'get in touch', 'connect', 'support', 
    'help desk', 'customer service', 'call', 'call us', 'contact us',
    'phone number', 'mobile number', 'whatsapp', 'telephone', 'contact you',
    'how can i contact', 'how to contact', 'your contact', 'your number'
  ];
  
  // Check for phone number pattern (10 digits, with or without spaces/dashes)
  const phonePattern = /(\+?91[\s-]?)?[6-9]\d{9}/;
  const hasPhoneNumber = phonePattern.test(queryLower);
  
  // Check for email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const hasEmail = emailPattern.test(queryLower);
  
  // Check if query contains Q&A keywords
  const hasQAKeyword = qaKeywords.some(keyword => queryLower.includes(keyword));
  const hasContactKeyword = contactKeywords.some(keyword => queryLower.includes(keyword));
  const isContactQuery = hasContactKeyword || hasPhoneNumber || hasEmail;
  
  // Check training data for matching Q&A examples
  const matchingExample = trainingData.examples?.find((ex) => {
    const exLower = ex.userQuery.toLowerCase();
    // Check if it's a Q&A example (has expectedResponse but no expectedPreferences)
    const isQAExample = ex.expectedResponse && (!ex.expectedPreferences || Object.keys(ex.expectedPreferences).length === 0);
    if (isQAExample) {
      // Check similarity
      return exLower.includes(queryLower) || queryLower.includes(exLower) || 
             queryLower.split(' ').some(word => exLower.includes(word) && word.length > 3);
    }
    return false;
  });
  
  return hasQAKeyword || isContactQuery || !!matchingExample;
};

router.post("/job-recommendations", async (req, res) => {
  try {
    const { userQuery, preferences = {}, userProfile = {} } = req.body;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    // console.log(`[AI] 📥 Received query: "${userQuery}"`);

    // Step 0: First check FAQ database for matching question
    // console.log(`[AI] 🔍 Checking FAQ database...`);
    const matchingFAQ = await findMatchingFAQ(userQuery);
    if (matchingFAQ) {
      // console.log(`[AI] ✅ FAQ match found! Returning FAQ answer.`);
      return res.json({
        status: true,
        isQA: true,
        answer: matchingFAQ.Answer,
        source: "faq_database",
        jobs: [],
        message: "Question answered from FAQ database",
      });
    }
    // console.log(`[AI] ❌ No FAQ match found, checking if it's a Q&A query...`);

    // Step 1: Check if this is a Q&A query (from training data or keywords)
    const trainingData = await loadTrainingData();
    const queryLower = userQuery.toLowerCase().trim();
    
    // Force Q&A detection for certain keywords (even if FAQ doesn't match)
    const forceQAKeywords = [
      'how to apply', 'how do i apply', 'how can i apply',
      'application process', 'application procedure', 'how to submit',
      'what documents', 'what is required', 'what do i need'
    ];
    
    // Force contact query detection
    const forceContactKeywords = [
      'contact', 'phone', 'number', 'email', 'address', 'call', 
      'reach', 'get in touch', 'connect', 'support', 'contact you',
      'how can i contact', 'how to contact', 'your contact', 'your number'
    ];
    const phonePattern = /(\+?91[\s-]?)?[6-9]\d{9}/;
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    
    const isForceQA = forceQAKeywords.some(keyword => queryLower.includes(keyword));
    const isForceContact = forceContactKeywords.some(keyword => queryLower.includes(keyword)) ||
                           phonePattern.test(queryLower) || emailPattern.test(queryLower);
    
    // First, always check training data for Q&A examples (even if not detected as Q&A query)
    // This ensures bot training questions are always checked
    const qaExamples = trainingData.examples?.filter(ex => 
      ex.expectedResponse && (!ex.expectedPreferences || Object.keys(ex.expectedPreferences).length === 0)
    ) || [];
    
    if (qaExamples.length > 0) {
      // console.log(`[AI] 🔍 Checking ${qaExamples.length} training examples for Q&A match...`);
      
      // Score all Q&A examples and find best match
      const scoredExamples = qaExamples.map((ex) => {
        const exLower = ex.userQuery.toLowerCase().trim();
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
        const exWords = exLower.split(/\s+/).filter(w => w.length > 2);
        let score = 0;
        
        // 1. Exact match (highest priority)
        if (exLower === queryLower) {
          return { example: ex, score: 1.0 };
        }
        
        // 2. Tags-based matching (high priority)
        if (ex.tags && Array.isArray(ex.tags) && ex.tags.length > 0) {
          const tagsLower = ex.tags.map(t => String(t).toLowerCase().trim()).filter(t => t.length > 0);
          const queryLowerForTags = queryLower;
          
          // Check if any tag matches the query
          const matchingTags = tagsLower.filter(tag => {
            // Exact tag match
            if (queryLowerForTags === tag) return true;
            // Tag contains query or query contains tag
            if (queryLowerForTags.includes(tag) || tag.includes(queryLowerForTags)) return true;
            // Check if query words match tag
            const queryWordsForTags = queryLowerForTags.split(/\s+/);
            return queryWordsForTags.some(word => tag.includes(word) || word.includes(tag));
          });
          
          if (matchingTags.length > 0) {
            // Tag match gets high score (0.8-0.9)
            const tagScore = Math.min(0.9, 0.7 + (matchingTags.length / tagsLower.length) * 0.2);
            score = Math.max(score, tagScore);
            // console.log(`[AI] 🏷️ Tag match found: tags=${ex.tags.join(', ')}, matched=${matchingTags.join(', ')}, score=${tagScore.toFixed(2)}`);
          }
        }
        
        // 3. Contains match (both ways)
        if (exLower.includes(queryLower) || queryLower.includes(exLower)) {
          const commonWords = queryWords.filter(w => exWords.includes(w));
          const similarity = commonWords.length / Math.max(queryWords.length, exWords.length, 1);
          score = Math.max(score, Math.max(0.7, similarity));
        }
        
        // 4. Word overlap similarity
        const commonWords = queryWords.filter(w => exWords.includes(w));
        const similarity = commonWords.length / Math.max(queryWords.length, exWords.length, 1);
        score = Math.max(score, similarity);
        
        // 5. Boost score if significant keyword match
        const importantWords = queryWords.filter(w => w.length > 4 && exWords.includes(w));
        const boost = importantWords.length > 0 ? 0.2 : 0;
        
        return { example: ex, score: score + boost };
      });
      
      // Sort by score (highest first)
      scoredExamples.sort((a, b) => b.score - a.score);
      
      // Use best match if score > 0.25 (lowered threshold for better matching)
      const bestMatch = scoredExamples[0];
      if (bestMatch && bestMatch.score > 0.25 && bestMatch.example.expectedResponse) {
        // console.log(`[AI] ✅ Training data match found: "${bestMatch.example.userQuery}" (score: ${bestMatch.score.toFixed(2)})`);
        return res.json({
          status: true,
          isQA: true,
          answer: bestMatch.example.expectedResponse,
          source: "training_data",
          jobs: [], // No jobs for Q&A
          message: "Question answered from training data",
        });
      }
    }

    if (isForceContact || isForceQA || isQAQuery(userQuery, trainingData)) {
      const queryType = isForceContact ? 'contact' : 'Q&A';
      console.log(`[AI] ✅ ${queryType} query detected (force: ${isForceContact || isForceQA}, training: ${isQAQuery(userQuery, trainingData)})`);
      
      // If no training data match but it's a Q&A query, proceed with AI generation

      // If no exact match but it's a Q&A query, use AI to generate answer
      if (anthropicApiKey && anthropicApiKey.startsWith("sk-ant-")) {
        try {
          console.log(`[AI] 🤖 Generating AI answer for Q&A query...`);
          const qaPrompt = buildQAPrompt(userQuery, trainingData);
          const aiResponse = await callAnthropicAPI(anthropicApiKey, qaPrompt);
          
          return res.json({
            status: true,
            isQA: true,
            answer: aiResponse.answer || aiResponse.content || "I'm here to help! Could you please rephrase your question?",
            source: "ai_generated",
            jobs: [],
            message: "Question answered by AI",
          });
        } catch (aiError) {
          console.error("[AI] Q&A AI generation failed:", aiError.message);
          // Fall through to return generic answer
        }
      }

      // Generic Q&A response (if FAQ doesn't exist and AI fails)
      console.log(`[AI] 📝 No FAQ or training data found for Q&A query`);
      
      // Check if it's a contact query
      if (isForceContact) {
        return res.json({
          status: true,
          isQA: true,
          answer: `You can contact us through the following channels:

📞 Phone: 8699011108
📧 Email: info@focalyt.com
📍 Address: SCF 3,4, 2nd floor, Shiva Complex, Patiala Rd, opposite Hyundai Showroom, Swastik Vihar, Utrathiya, Zirakpur, Punjab 140603

You can also visit our contact page for more information or fill out the contact form on our website.

For job-related queries, please browse available jobs using the search filters.`,
          source: "generic_contact",
          jobs: [],
          message: "Contact query detected but no FAQ found",
        });
      }
      
      // Return simple message instead of generic instructions
      return res.json({
        status: true,
        isQA: true,
        answer: `I'm here to help! Could you please rephrase your question or try asking about jobs, courses, or our services?`,
        source: "generic",
        jobs: [],
        message: "Q&A query detected but no FAQ or training data found",
      });
    }
    
    console.log(`[AI] 🔍 Not a Q&A query, proceeding with job search...`);

    if (!anthropicApiKey) {
      console.error("[AI] ❌ ANTHROPIC_API_KEY not found in environment variables");
      return res.status(500).json({
        status: false,
        message: "AI service not configured. Please set ANTHROPIC_API_KEY in environment variables.",
      });
    }

    // Validate API key format (should start with sk-ant-)
    if (!anthropicApiKey.startsWith("sk-ant-")) {
      console.error("[AI] ❌ Invalid API key format. Should start with 'sk-ant-'");
      return res.status(500).json({
        status: false,
        message: "Invalid API key format. Please check your ANTHROPIC_API_KEY.",
      });
    }

    // Step 1: Fetch all active jobs
    const allJobs = await Vacancy.find({
      status: true,
      _company: { $ne: null },
      validity: { $gte: new Date() },
      verified: true,
      $or: [
        { postingType: "Public" },
        { postingType: { $exists: false } },
        { postingType: null },
      ],
    })
      .populate([
        { path: "_company", select: "name logo stateId cityId" },
        { path: "_industry", select: "name" },
        { path: "_qualification", select: "name" },
        { path: "state" },
        { path: "city", select: "name" },
        { path: "_techSkills", select: "name" },
        { path: "_nonTechSkills", select: "name" },
      ])
      .limit(100); // Limit for AI processing

    if (allJobs.length === 0) {
      return res.json({
        status: true,
        jobs: [],
        message: "No jobs available",
        aiAnalysis: null,
      });
    }

    // Step 2: Prepare job data for AI
    const jobsForAI = allJobs.map((job) => ({
      id: job._id.toString(),
      title: job.title || job.name || "N/A",
      company: job._company?.name || job.displayCompanyName || "N/A",
      location: {
        state: job.state?.name || "N/A",
        city: job.city?.name || "N/A",
      },
      salary: job.isFixed
        ? { type: "fixed", amount: job.amount }
        : { type: "range", min: job.min, max: job.max },
      experience: {
        years: job.experience || 0,
        months: job.experienceMonths || 0,
      },
      qualification: job._qualification?.name || "N/A",
      industry: job._industry?.name || "N/A",
      skills: {
        tech: (job._techSkills || []).map((s) => s.name),
        nonTech: (job._nonTechSkills || []).map((s) => s.name),
      },
      workMode: job.work || "N/A",
      description: job.jobDescription?.substring(0, 500) || "", // First 500 chars
    }));

    // Step 3: Build AI prompt
    const aiPrompt = buildAIPrompt(userQuery, preferences, userProfile, jobsForAI);

    // Step 4: Try AI API, fallback to simple search if fails
    let rankedJobs = allJobs;
    let aiAnalysis = null;

    try {
      console.log(`[AI] Processing ${allJobs.length} jobs for user query: "${userQuery || 'N/A'}"`);
      const aiResponse = await callAnthropicAPI(anthropicApiKey, aiPrompt);
      const rankedJobIds = parseAIResponse(aiResponse);
      rankedJobs = rankJobsByAI(allJobs, rankedJobIds);
      aiAnalysis = {
        reasoning: aiResponse.reasoning || "AI analysis completed",
        matchedCriteria: aiResponse.matchedCriteria || [],
      };
      console.log(`[AI] ✅ Successfully ranked ${rankedJobIds.length} jobs`);
    } catch (aiError) {
      console.error("[AI] ❌ AI API failed, using fallback search:", aiError.message);
      console.error("[AI] Error details:", aiError);
      
      // Fallback: Simple keyword-based search
      if (userQuery) {
        const queryLower = userQuery.toLowerCase();
        rankedJobs = allJobs.filter((job) => {
          const titleMatch = (job.title || job.name || "").toLowerCase().includes(queryLower);
          const companyMatch = (job._company?.name || job.displayCompanyName || "").toLowerCase().includes(queryLower);
          const locationMatch = 
            (job.city?.name || "").toLowerCase().includes(queryLower) ||
            (job.state?.name || "").toLowerCase().includes(queryLower);
          const industryMatch = (job._industry?.name || "").toLowerCase().includes(queryLower);
          
          return titleMatch || companyMatch || locationMatch || industryMatch;
        });
      }

      // Apply preference filters
      if (preferences.stateName || preferences.state) {
        const stateFilter = (preferences.stateName || preferences.state).toLowerCase();
        rankedJobs = rankedJobs.filter((job) => {
          const jobState = (job.state?.name || "").toLowerCase();
          return jobState.includes(stateFilter) || stateFilter.includes(jobState);
        });
      }

      // Track if exact city match found
      let exactCityMatch = false;
      let originalCityFilter = null;
      
      if (preferences.cityName || preferences.city) {
        const cityFilter = (preferences.cityName || preferences.city).toLowerCase();
        originalCityFilter = cityFilter;
        const cityMatchedJobs = rankedJobs.filter((job) => {
          const jobCity = (job.city?.name || "").toLowerCase();
          return jobCity.includes(cityFilter) || cityFilter.includes(jobCity);
        });
        
        if (cityMatchedJobs.length > 0) {
          exactCityMatch = true;
          rankedJobs = cityMatchedJobs;
        } else {
          // No exact city match - show nearby jobs (same state)
          exactCityMatch = false;
          const stateFilter = (preferences.stateName || preferences.state || "").toLowerCase();
          if (stateFilter) {
            // Filter by state (nearby cities in same state)
            rankedJobs = rankedJobs.filter((job) => {
              const jobState = (job.state?.name || "").toLowerCase();
              return jobState.includes(stateFilter) || stateFilter.includes(jobState);
            });
          }
        }
      }

      if (preferences.maxExperienceYears) {
        const maxExpMonths = Number(preferences.maxExperienceYears) * 12;
        rankedJobs = rankedJobs.filter((job) => {
          const jobExpMonths = (Number(job.experience || 0) * 12) + Number(job.experienceMonths || 0);
          return jobExpMonths <= maxExpMonths;
        });
      }

      if (preferences.minSalary) {
        const minSal = Number(preferences.minSalary);
        rankedJobs = rankedJobs.filter((job) => {
          const jobMinSal = job.isFixed ? Number(job.amount || 0) : Number(job.min || 0);
          return jobMinSal >= minSal;
        });
      }

      aiAnalysis = {
        reasoning: "Used fallback keyword search (AI unavailable)",
        matchedCriteria: ["keyword", "location", "experience", "salary"].filter(
          (criteria) => preferences[criteria] || preferences[`${criteria}Name`]
        ),
      };
    }

    // Step 7: Check if we need to show nearby jobs message
    let responseMessage = "Job recommendations generated successfully";
    const hasCityPreference = preferences.cityName || preferences.city;
    const exactCityMatchFound = hasCityPreference && rankedJobs.some((job) => {
      const jobCity = (job.city?.name || "").toLowerCase();
      const cityFilter = ((preferences.cityName || preferences.city) || "").toLowerCase();
      return jobCity.includes(cityFilter) || cityFilter.includes(jobCity);
    });
    
    if (hasCityPreference && !exactCityMatchFound && rankedJobs.length > 0) {
      const cityName = preferences.cityName || preferences.city;
      responseMessage = `No jobs found in ${cityName}. Showing nearby jobs in ${preferences.stateName || preferences.state || 'the same state'}.`;
    } else if (hasCityPreference && rankedJobs.length === 0) {
      const cityName = preferences.cityName || preferences.city;
      const stateName = preferences.stateName || preferences.state;
      responseMessage = `No jobs found in ${cityName}${stateName ? `, ${stateName}` : ''}. Try searching in nearby locations or different cities.`;
    }

    // Step 8: Return results
    return res.json({
      status: true,
      jobs: rankedJobs.slice(0, 20), // Top 20 recommendations
      totalJobs: allJobs.length,
      aiAnalysis: aiAnalysis,
      message: responseMessage,
      showNearbyMessage: hasCityPreference && !exactCityMatchFound && rankedJobs.length > 0,
      requestedCity: preferences.cityName || preferences.city,
      actualLocation: rankedJobs.length > 0 ? rankedJobs[0]?.state?.name : null,
    });
  } catch (error) {
    console.error("❌ AI Job Recommendations Error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to generate AI recommendations",
      error: error.message,
    });
  }
});

/**
 * Build Q&A prompt for Anthropic Claude
 */
function buildQAPrompt(userQuery, trainingData) {
  const examples = trainingData.examples?.filter(ex => 
    ex.expectedResponse && (!ex.expectedPreferences || Object.keys(ex.expectedPreferences).length === 0)
  ).slice(0, 5) || [];

  const examplesText = examples.map(ex => 
    `Q: ${ex.userQuery}\nA: ${ex.expectedResponse}`
  ).join('\n\n');

  return `You are a helpful job search assistant. Answer the user's question about jobs, applications, or career guidance.

USER QUESTION: "${userQuery}"

TRAINING EXAMPLES:
${examplesText || "No examples available"}

INSTRUCTIONS:
1. If the question is about "how to apply for a job", provide step-by-step guidance
2. Be helpful, clear, and concise
3. Use the training examples as reference for style and format
4. If you don't know the answer, suggest using the job search filters

OUTPUT FORMAT (JSON only):
{
  "answer": "Your detailed answer here with step-by-step instructions if applicable"
}

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting
- Make the answer helpful and actionable
- Include specific steps if it's a "how to" question`;
}

/**
 * Build AI prompt for Anthropic Claude
 */
function buildAIPrompt(userQuery, preferences, userProfile, jobs) {
  const jobsJson = JSON.stringify(jobs, null, 2);
  const hasCityPreference = preferences.cityName || preferences.city;
  const hasStatePreference = preferences.stateName || preferences.state;

  return `You are an expert job matching AI assistant. Analyze the following job listings and provide personalized recommendations.

USER QUERY: "${userQuery || "Find suitable jobs"}"

USER PREFERENCES:
${JSON.stringify(preferences, null, 2)}

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

AVAILABLE JOBS (${jobs.length} jobs):
${jobsJson}

TASK:
1. Analyze each job against user preferences and profile
2. Calculate a relevance score (0-100) for each job
3. Rank jobs from most relevant to least relevant
4. ${hasCityPreference ? `IMPORTANT: If no jobs match the exact city "${preferences.cityName || preferences.city}", prioritize jobs in the same state "${preferences.stateName || preferences.state || 'any state'}" as nearby alternatives.` : ''}
5. Provide brief reasoning for top 5 matches

OUTPUT FORMAT (JSON only, no markdown):
{
  "rankedJobs": [
    {
      "jobId": "job_id_here",
      "relevanceScore": 95,
      "reasoning": "Matches location preference, salary range, and required skills"
    }
  ],
  "topMatches": [
    {
      "jobId": "job_id_here",
      "matchReasons": ["Location match", "Salary within range", "Skills alignment"]
    }
  ],
  "reasoning": "Overall analysis summary",
  "matchedCriteria": ["location", "salary", "experience", "skills"]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting
- Include ALL job IDs from the input in rankedJobs (even low scores)
- Relevance score: 90-100 (excellent match), 70-89 (good match), 50-69 (fair match), <50 (poor match)
- Prioritize: Location > Salary > Experience > Skills > Qualification
${hasCityPreference ? `- If exact city match not found, include nearby jobs from same state with lower scores (60-79 range)` : ''}`;
}

/**
 * Call Anthropic Claude API using official SDK
 * Includes timeout protection and better error handling
 */
async function callAnthropicAPI(apiKey, prompt) {
  const API_TIMEOUT = 30000; // 30 seconds timeout
  
  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Try multiple model names in order of preference
    // Can override with ANTHROPIC_MODEL env variable (comma-separated for fallbacks)
    // Example: ANTHROPIC_MODEL="claude-3-haiku-20240307"
    // Note: Model availability depends on your API key/account tier
    // Haiku is typically available on all tiers and is the most reliable fallback
    const envModels = process.env.ANTHROPIC_MODEL;
    const models = envModels 
      ? envModels.split(',').map(m => m.trim()).filter(m => m)
      : [
          "claude-3-haiku-20240307",         // Claude 3 Haiku (most reliable, available on all tiers)
          "claude-3-5-sonnet-20241022",      // Latest Claude 3.5 Sonnet (may require higher tier)
          "claude-3-5-sonnet-20240620",      // Previous version (fallback)
          "claude-3-opus-20240229",          // Claude 3 Opus (may require higher tier)
          "claude-3-sonnet-20240229",        // Claude 3 Sonnet (may require higher tier)
        ];
    
    console.log(`[AI] Using ${models.length} model(s): ${models.join(", ")}`);

    let lastError = null;
    let attemptedModels = [];

    for (const model of models) {
      try {
        console.log(`[AI] Attempting model: ${model}`);
        
        // Create a promise with timeout
        const apiCall = anthropic.messages.create({
          model: model,
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        // Add timeout protection
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Request timeout after ${API_TIMEOUT}ms`)), API_TIMEOUT);
        });

        const message = await Promise.race([apiCall, timeoutPromise]);

        // Validate response structure
        if (!message || !message.content || !Array.isArray(message.content) || message.content.length === 0) {
          throw new Error("Invalid response structure from API");
        }

        const content = message.content[0].text;
        console.log(`[AI] ✅ Successfully used model: ${model}`);
        
        // Extract JSON from response (handle markdown code blocks if present)
        let jsonStr = content.trim();
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/```\n?/g, "").replace(/```\n?/g, "");
        }

        const parsedResponse = JSON.parse(jsonStr);
        
        // Validate parsed response has expected structure
        if (!parsedResponse || typeof parsedResponse !== 'object') {
          throw new Error("Invalid JSON response from AI");
        }

        return parsedResponse;
      } catch (modelError) {
        const errorMessage = modelError.message || JSON.stringify(modelError.error || modelError);
        const errorCode = modelError.status || modelError.error?.type || 'unknown';
        const is404 = errorCode === 404 || errorMessage.includes('not_found') || errorMessage.includes('404');
        
        console.error(`[AI] ❌ Model ${model} failed:`, errorMessage, `(Code: ${errorCode})`);
        attemptedModels.push({ model, error: errorMessage, code: errorCode });
        lastError = modelError;
        
        // If it's a 401 (auth error), stop trying other models
        if (errorCode === 401 || errorCode === 'authentication_error') {
          console.error("[AI] ❌ Authentication error - stopping model attempts");
          throw new Error(`Authentication failed: ${errorMessage}`);
        }
        
        // If it's a 404 (model not found/not available), log and continue
        if (is404) {
          console.warn(`[AI] ⚠️  Model ${model} not available (404) - this model may not be accessible with your API key tier`);
        }
        
        // Try next model
        continue;
      }
    }

    // If all models failed, provide detailed error information
    const errorDetails = attemptedModels.map(m => `${m.model} (${m.code}): ${m.error}`).join("; ");
    console.error(`[AI] ❌ All models failed. Attempted: ${models.join(", ")}`);
    
    // Check if all failures were 404s (model availability issue)
    const all404s = attemptedModels.every(m => m.code === 404 || m.error.includes('not_found'));
    if (all404s) {
      throw new Error(`All Claude models unavailable (404). Your API key may not have access to these models. Please check your Anthropic account tier or use ANTHROPIC_MODEL env variable to specify an available model. Errors: ${errorDetails}`);
    }
    
    throw new Error(`All Claude models failed. Errors: ${errorDetails}`);
  } catch (error) {
    console.error("[AI] Anthropic API Error:", error.message || error);
    throw new Error(`AI API call failed: ${error.message || error}`);
  }
}

/**
 * Parse AI response and extract ranked job IDs
 */
function parseAIResponse(aiResponse) {
  try {
    if (aiResponse.rankedJobs && Array.isArray(aiResponse.rankedJobs)) {
      return aiResponse.rankedJobs.map((item) => item.jobId);
    }
    // Fallback: if structure is different, try to extract IDs
    return [];
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return [];
  }
}

/**
 * Reorder jobs based on AI ranking
 */
function rankJobsByAI(allJobs, rankedJobIds) {
  const jobMap = new Map(allJobs.map((job) => [job._id.toString(), job]));
  const ranked = [];
  const unranked = [];

  // Add ranked jobs in order
  rankedJobIds.forEach((id) => {
    if (jobMap.has(id)) {
      ranked.push(jobMap.get(id));
      jobMap.delete(id);
    }
  });

  // Add remaining unranked jobs
  jobMap.forEach((job) => unranked.push(job));

  return [...ranked, ...unranked];
}

/**
 * GET /api/ai/job-recommendations/simple
 * Simplified version - just uses preferences without AI
 * (Fallback if AI is unavailable)
 */
router.get("/job-recommendations/simple", async (req, res) => {
  try {
    const { state, city, maxExperience, minSalary, sector } = req.query;

    let filter = {
      status: true,
      _company: { $ne: null },
      validity: { $gte: new Date() },
      verified: true,
      $or: [
        { postingType: "Public" },
        { postingType: { $exists: false } },
        { postingType: null },
      ],
    };

    if (sector) {
      filter._industry = sector;
    }

    if (maxExperience) {
      const exp = Number(maxExperience);
      if (exp === 0) {
        filter.$or = [{ experience: { $lte: 0 } }];
      } else {
        filter.experience = { $lte: exp };
      }
    }

    if (minSalary) {
      filter.$or = [
        { isFixed: true, amount: { $gte: Number(minSalary) } },
        { isFixed: false, max: { $gte: Number(minSalary) } },
      ];
    }

    const jobs = await Vacancy.find(filter)
      .populate([
        { path: "_company", select: "name logo" },
        { path: "_industry", select: "name" },
        { path: "state" },
        { path: "city", select: "name" },
      ])
      .limit(50)
      .sort({ createdAt: -1 });

    return res.json({
      status: true,
      jobs,
      message: "Jobs filtered successfully",
    });
  } catch (error) {
    console.error("Simple job filter error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to filter jobs",
      error: error.message,
    });
  }
});

module.exports = router;

