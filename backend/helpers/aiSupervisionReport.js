const Anthropic = require("@anthropic-ai/sdk");
const moment = require("moment");
const { AppliedCourses, User } = require("../controllers/models");

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getLeadDisplayName = (lead) =>
  lead?._candidate?.name || lead?.studentName || "Unknown";

const getLeadCenterName = (lead) =>
  lead?._center?.name || lead?.centerName || "Not Assigned";

const getLeadBatchName = (lead) =>
  lead?.batch?.name || lead?.batchName || "";

const getLeadCourseName = (lead) =>
  lead?._course?.name || lead?.courseName || "Not specified";

const getLeadCounselor = (lead) => {
  if (lead?.counsellor?._id) {
    return {
      counselorId: String(lead.counsellor._id),
      counselorName: lead.counsellor.name || "Unknown",
    };
  }

  const latestAssignment = Array.isArray(lead?.leadAssignment) && lead.leadAssignment.length > 0
    ? lead.leadAssignment[lead.leadAssignment.length - 1]
    : null;

  if (latestAssignment?._counsellor?._id) {
    return {
      counselorId: String(latestAssignment._counsellor._id),
      counselorName:
        latestAssignment._counsellor.name ||
        latestAssignment.counsellorName ||
        "Unknown",
    };
  }

  return {
    counselorId: null,
    counselorName: "Unassigned",
  };
};

const getLeadContactNumbers = (lead) => {
  const values = [
    lead?._candidate?.mobile,
    lead?.mobile,
    lead?.phone,
    lead?.whatsapp,
  ].filter(Boolean);

  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
};

const getLeadDocumentSnapshot = (lead) => {
  const requiredDocs = Array.isArray(lead?._course?.docsRequired)
    ? lead._course.docsRequired
    : [];
  const uploadedDocs = Array.isArray(lead?.uploadedDocs) ? lead.uploadedDocs : [];

  const normalizedDocuments = requiredDocs.map((requiredDoc) => {
    const matchingUploads = uploadedDocs.filter(
      (upload) =>
        upload?.docsId &&
        String(upload.docsId) === String(requiredDoc?._id)
    );

    const latestUpload =
      matchingUploads.length > 0 ? matchingUploads[matchingUploads.length - 1] : null;

    const hasUpload = Boolean(latestUpload?.fileUrl || matchingUploads.length > 0);
    const status = latestUpload?.status || (hasUpload ? "Uploaded" : "Not Uploaded");

    return {
      name: requiredDoc?.Name || requiredDoc?.name || "Unknown Document",
      hasUpload,
      status,
    };
  });

  const pendingDocs = normalizedDocuments.filter(
    (doc) =>
      ["Not Uploaded", "No Uploads", "Pending", "Uploaded"].includes(doc.status) &&
      !["Verified", "Rejected"].includes(doc.status)
  ).length;
  const rejectedDocs = normalizedDocuments.filter(
    (doc) => doc.status === "Rejected"
  ).length;
  const verifiedDocs = normalizedDocuments.filter(
    (doc) => doc.status === "Verified"
  ).length;
  const pendingVerificationDocs = normalizedDocuments.filter(
    (doc) => doc.status === "Pending"
  ).length;
  const hasAnyUploads = normalizedDocuments.some((doc) => doc.hasUpload);

  const category = rejectedDocs > 0
    ? "Rejected"
    : pendingVerificationDocs > 0
      ? "Pending Verification"
      : !lead?.kyc && (pendingDocs > 0 || !hasAnyUploads)
        ? "Pending KYC"
        : lead?.kyc
          ? "Verified"
          : "Review";

  return {
    pendingDocs,
    rejectedDocs,
    verifiedDocs,
    pendingVerificationDocs,
    hasAnyUploads,
    category,
  };
};

const getLeadFollowupSummary = (lead) => {
  const followups = Array.isArray(lead?.followups) ? lead.followups : [];
  const totalAttempts = followups.length;

  let doneCount = 0;
  let missedCount = 0;
  let plannedCount = 0;

  followups.forEach((item) => {
    const normalizedStatus = String(item?.status || "").trim().toLowerCase();
    if (normalizedStatus === "done") doneCount += 1;
    else if (normalizedStatus === "missed") missedCount += 1;
    else if (normalizedStatus === "planned") plannedCount += 1;
  });

  let sufficiency = "Not Enough";
  if (totalAttempts >= 4) sufficiency = "Enough";
  else if (totalAttempts >= 2) sufficiency = "Moderate";

  return {
    totalAttempts,
    doneCount,
    missedCount,
    plannedCount,
    sufficiency,
  };
};

const getLowFollowupActionPlan = (lead) => {
  const leadName = getLeadDisplayName(lead);
  const courseName = getLeadCourseName(lead);
  const followupSummary = getLeadFollowupSummary(lead);

  if (followupSummary.totalAttempts >= 2) {
    return [];
  }

  return [
    `Call ${leadName} and confirm current interest in ${courseName}.`,
    "Check the main objection: fee, location, timing, documents, or no response.",
    "Send one clear WhatsApp follow-up with course value, next step, and counselor name.",
    "Set the next action date immediately after the conversation or outreach attempt.",
    "If there is still no response after repeated attempts, escalate to the counselor supervisor.",
  ];
};

const getSeverityWeight = (severity) => {
  if (severity === "High") return 3;
  if (severity === "Medium") return 2;
  return 1;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    return null;
  }

  return new Anthropic({ apiKey });
};

const getAnthropicModel = () => {
  if (process.env.ANTHROPIC_MODEL) {
    return process.env.ANTHROPIC_MODEL.split(",").map((item) => item.trim())[0];
  }

  return "claude-3-haiku-20240307";
};

const parseJsonResponse = (rawText = "") => {
  let jsonText = rawText;
  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonText = rawText.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(jsonText);
};

const getTodayFollowupSummary = (lead, range = getTodayRange()) => {
  const followups = Array.isArray(lead?.followups) ? lead.followups : [];
  const stats = {
    total: 0,
    doneCount: 0,
    missedCount: 0,
    plannedCount: 0,
  };

  followups.forEach((item) => {
    if (!item?.date) return;

    const followupDate = new Date(item.date);
    if (followupDate < range.start || followupDate > range.end) return;

    stats.total += 1;
    const normalizedStatus = String(item?.status || "").trim().toLowerCase();

    if (normalizedStatus === "done") stats.doneCount += 1;
    else if (normalizedStatus === "missed") stats.missedCount += 1;
    else stats.plannedCount += 1;
  });

  return stats;
};

const getLeadPriorityMeta = (lead) => {
  const documentSnapshot = getLeadDocumentSnapshot(lead);
  const followupSummary = getLeadFollowupSummary(lead);
  const todayFollowupSummary = getTodayFollowupSummary(lead);
  const todayStart = getTodayRange().start;
  const followupDate = lead?.followupDate ? new Date(lead.followupDate) : null;
  const isOverdue =
    Boolean(followupDate) &&
    followupDate < todayStart &&
    !lead?.admissionDone &&
    !lead?.dropout;

  let score = 35;
  const reasons = [];

  if (lead?._initialStatus === "Hot") {
    score += 20;
    reasons.push("lead is marked hot");
  } else if (lead?._initialStatus === "Warm") {
    score += 10;
    reasons.push("lead is marked warm");
  }

  if (lead?.admissionDone || lead?.admissionDate) {
    score += 25;
    reasons.push("admission movement is visible");
  }

  if (lead?.registrationFee === "Paid") {
    score += 12;
    reasons.push("payment commitment is stronger");
  } else {
    score -= 5;
  }

  if (lead?.kyc) {
    score += 10;
    reasons.push("KYC is completed");
  } else if (lead?.kycStage) {
    score += 4;
  } else {
    score -= 4;
  }

  if (followupSummary.totalAttempts >= 4) {
    score += 12;
    reasons.push("follow-up depth is strong");
  } else if (followupSummary.totalAttempts >= 2) {
    score += 5;
  } else {
    score -= 12;
    reasons.push("follow-up depth is still low");
  }

  if (todayFollowupSummary.doneCount > 0) {
    score += 8;
    reasons.push("counsellor completed follow-up today");
  }

  if (documentSnapshot.rejectedDocs > 0) {
    score -= 8;
  }

  if (!documentSnapshot.hasAnyUploads && !lead?.kyc) {
    score -= 7;
  }

  if (lead?.dropout) {
    score -= 30;
    reasons.push("dropout risk is already active");
  }

  if (isOverdue) {
    score -= 10;
    reasons.push("next follow-up date is overdue");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let bucket = "Low";
  if (score >= 70) bucket = "High";
  else if (score >= 45) bucket = "Intermediate";

  return {
    score,
    bucket,
    reasons,
    isOverdue,
    followupSummary,
    todayFollowupSummary,
    documentSnapshot,
  };
};

const buildLeadAiInsight = (lead) => {
  const counselor = getLeadCounselor(lead);
  const priorityMeta = getLeadPriorityMeta(lead);
  const actionPlan = getLowFollowupActionPlan(lead);
  const leadName = getLeadDisplayName(lead);
  const courseName = getLeadCourseName(lead);
  const centerName = getLeadCenterName(lead);

  return {
    leadId: String(lead?._id),
    studentName: leadName,
    courseName,
    centerName,
    counselorId: counselor.counselorId,
    counselorName: counselor.counselorName,
    score: priorityMeta.score,
    priorityBucket: priorityMeta.bucket,
    reasons: priorityMeta.reasons,
    totalFollowups: priorityMeta.followupSummary.totalAttempts,
    followupsDone: priorityMeta.followupSummary.doneCount,
    followupsMissed: priorityMeta.followupSummary.missedCount,
    followupsPlanned: priorityMeta.followupSummary.plannedCount,
    followupSufficiency: priorityMeta.followupSummary.sufficiency,
    todayFollowupsDone: priorityMeta.todayFollowupSummary.doneCount,
    todayFollowupsMissed: priorityMeta.todayFollowupSummary.missedCount,
    todayFollowupsPlanned: priorityMeta.todayFollowupSummary.plannedCount,
    kycBucket: priorityMeta.documentSnapshot.category,
    registrationFee: lead?.registrationFee || "Unpaid",
    admissionDone: Boolean(lead?.admissionDone || lead?.admissionDate),
    dropout: Boolean(lead?.dropout),
    isOverdue: priorityMeta.isOverdue,
    nextFollowupDate: lead?.followupDate || null,
    necessarySteps:
      priorityMeta.followupSummary.sufficiency === "Enough" ? [] : actionPlan,
    aiSuggestedAction:
      actionPlan[0] ||
      (priorityMeta.isOverdue
        ? `Reconnect with ${leadName} today and lock the next follow-up date.`
        : `Move ${leadName} forward on ${courseName} with a clear next step.`),
  };
};

const calculateCounselorHealthScore = (metrics) => {
  const totalLeads = metrics.totalLeads || 0;
  if (!totalLeads) return 0;

  const highRatio = metrics.highPriorityLeads / totalLeads;
  const intermediateRatio = metrics.intermediatePriorityLeads / totalLeads;
  const followupEnoughRatio = metrics.followupEnoughLeads / totalLeads;
  const overdueRatio = metrics.overdueLeads / totalLeads;
  const admissionsRatio = metrics.admissions / totalLeads;

  let score =
    25 +
    highRatio * 30 +
    intermediateRatio * 12 +
    followupEnoughRatio * 22 +
    admissionsRatio * 18 -
    overdueRatio * 15 -
    metrics.followupNotEnoughLeads * 2;

  if (metrics.totalDailyFollowupsDone > 0) {
    score += Math.min(10, metrics.totalDailyFollowupsDone * 1.5);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const buildCounselorSnapshotFromLeads = (leads) => {
  const counselorMap = {};
  const leadInsights = [];

  leads.forEach((lead) => {
    const insight = buildLeadAiInsight(lead);
    leadInsights.push(insight);

    if (!insight.counselorId) return;

    if (!counselorMap[insight.counselorId]) {
      counselorMap[insight.counselorId] = {
        counselorId: insight.counselorId,
        counselorName: insight.counselorName,
        totalLeads: 0,
        highPriorityLeads: 0,
        intermediatePriorityLeads: 0,
        lowPriorityLeads: 0,
        totalDailyFollowupsDone: 0,
        totalDailyFollowupsPlanned: 0,
        totalFollowupsDone: 0,
        followupEnoughLeads: 0,
        followupModerateLeads: 0,
        followupNotEnoughLeads: 0,
        admissions: 0,
        paidLeads: 0,
        overdueLeads: 0,
        avgLeadScore: 0,
        topLeadIds: [],
      };
    }

    const current = counselorMap[insight.counselorId];
    current.totalLeads += 1;
    current.totalDailyFollowupsDone += insight.todayFollowupsDone;
    current.totalDailyFollowupsPlanned += insight.todayFollowupsPlanned;
    current.totalFollowupsDone += insight.followupsDone;
    current.admissions += insight.admissionDone ? 1 : 0;
    current.paidLeads += insight.registrationFee === "Paid" ? 1 : 0;
    current.overdueLeads += insight.isOverdue ? 1 : 0;
    current.avgLeadScore += insight.score;

    if (insight.priorityBucket === "High") current.highPriorityLeads += 1;
    else if (insight.priorityBucket === "Intermediate") current.intermediatePriorityLeads += 1;
    else current.lowPriorityLeads += 1;

    if (insight.followupSufficiency === "Enough") current.followupEnoughLeads += 1;
    else if (insight.followupSufficiency === "Moderate") current.followupModerateLeads += 1;
    else current.followupNotEnoughLeads += 1;

    current.topLeadIds.push(insight.leadId);
  });

  const counselors = Object.values(counselorMap)
    .map((item) => {
      const relatedLeads = leadInsights
        .filter((lead) => lead.counselorId === item.counselorId)
        .sort((a, b) => b.score - a.score);

      const avgLeadScore =
        item.totalLeads > 0 ? Number((item.avgLeadScore / item.totalLeads).toFixed(1)) : 0;

      return {
        ...item,
        avgLeadScore,
        performanceScore: calculateCounselorHealthScore(item),
        topLeads: relatedLeads.slice(0, 3),
        lowFollowupLeads: relatedLeads
          .filter((lead) => lead.followupSufficiency !== "Enough")
          .slice(0, 3),
      };
    })
    .sort((a, b) => b.performanceScore - a.performanceScore || b.totalLeads - a.totalLeads);

  return { counselors, leadInsights };
};

const buildManagerCounselorSummary = (counselors, leadInsights) => {
  const topCounselor = counselors[0] || null;
  const bottomCounselor = counselors.length > 1 ? counselors[counselors.length - 1] : null;
  const topLeads = [...leadInsights]
    .sort((a, b) => b.score - a.score || b.todayFollowupsDone - a.todayFollowupsDone)
    .slice(0, 5);
  const lowFollowupLeads = [...leadInsights]
    .filter((lead) => lead.followupSufficiency !== "Enough")
    .sort((a, b) => {
      if (a.followupSufficiency === b.followupSufficiency) {
        return a.totalFollowups - b.totalFollowups;
      }
      if (a.followupSufficiency === "Not Enough") return -1;
      if (b.followupSufficiency === "Not Enough") return 1;
      return 0;
    })
    .slice(0, 5);

  const totalLeads = leadInsights.length;

  return {
    totalCounselors: counselors.length,
    totalLeads,
    highPriorityLeads: leadInsights.filter((lead) => lead.priorityBucket === "High").length,
    intermediatePriorityLeads: leadInsights.filter((lead) => lead.priorityBucket === "Intermediate").length,
    lowPriorityLeads: leadInsights.filter((lead) => lead.priorityBucket === "Low").length,
    totalDailyFollowupsDone: leadInsights.reduce((sum, lead) => sum + (lead.todayFollowupsDone || 0), 0),
    followupEnoughLeads: leadInsights.filter((lead) => lead.followupSufficiency === "Enough").length,
    followupModerateLeads: leadInsights.filter((lead) => lead.followupSufficiency === "Moderate").length,
    followupNotEnoughLeads: leadInsights.filter((lead) => lead.followupSufficiency === "Not Enough").length,
    admissions: leadInsights.filter((lead) => lead.admissionDone).length,
    overdueLeads: leadInsights.filter((lead) => lead.isOverdue).length,
    topCounselor,
    bottomCounselor,
    topLeads,
    lowFollowupLeads,
  };
};

const buildFallbackCounselorNarrative = ({ managerName, summary, counselors }) => {
  const topCounselorLine = summary.topCounselor
    ? `${summary.topCounselor.counselorName} is leading with ${summary.topCounselor.performanceScore}/100 performance health, ${summary.topCounselor.highPriorityLeads} high-intent leads, and ${summary.topCounselor.totalDailyFollowupsDone} follow-ups completed today.`
    : "No counsellor performance leader is available for today.";

  const observations = [
    `${summary.totalLeads} total leads are distributed across ${summary.totalCounselors} counsellors.`,
    `${summary.highPriorityLeads} high-priority and ${summary.intermediatePriorityLeads} intermediate-priority leads need active movement.`,
    `${summary.followupNotEnoughLeads} leads still do not have enough follow-up depth.`,
  ];

  if (summary.overdueLeads > 0) {
    observations.push(`${summary.overdueLeads} leads already have overdue next follow-up dates.`);
  }

  const managerActions = [
    "Review low-follow-up leads first and force the next action date before end of day.",
    "Use the top counsellor's working style as a benchmark for the rest of the team.",
    "Push payment and KYC closures on the highest-scoring leads while intent is active.",
  ];

  const strictMethods = [
    "Every active lead must carry a next action date and fresh remark before day close.",
    "Any lead with fewer than 2 follow-ups must receive call, WhatsApp, and objection tagging on the same day.",
    "Overdue and missed follow-ups must be reviewed first in the morning and closed before new lead work starts.",
  ];

  return {
    headline: `AI counsellor performance brief for ${managerName || "manager team"}`,
    overview: `${managerName || "This team"} handled ${summary.totalLeads} leads today with ${summary.totalDailyFollowupsDone} completed follow-ups and ${summary.admissions} admission-stage wins.`,
    topCounsellorSummary: topCounselorLine,
    observations,
    managerActions,
    weakCounsellorSummary: summary.bottomCounselor
      ? `${summary.bottomCounselor.counselorName} needs immediate review with ${summary.bottomCounselor.followupNotEnoughLeads} weak-discipline leads and only ${summary.bottomCounselor.totalDailyFollowupsDone} follow-ups completed today.`
      : "No weak counsellor flag is available for today.",
    strictMethods,
  };
};

const generateCounselorNarrativeWithAnthropic = async ({
  managerName,
  summary,
  counselors,
  leadInsights,
}) => {
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    return buildFallbackCounselorNarrative({ managerName, summary, counselors, leadInsights });
  }

  try {
    const compactPayload = {
      managerName,
      summary,
      topCounselors: counselors.slice(0, 5).map((item) => ({
        counselorName: item.counselorName,
        totalLeads: item.totalLeads,
        highPriorityLeads: item.highPriorityLeads,
        intermediatePriorityLeads: item.intermediatePriorityLeads,
        dailyFollowupsDone: item.totalDailyFollowupsDone,
        followupEnoughLeads: item.followupEnoughLeads,
        followupNotEnoughLeads: item.followupNotEnoughLeads,
        performanceScore: item.performanceScore,
      })),
      topLeads: leadInsights.slice(0, 6).map((item) => ({
        studentName: item.studentName,
        counselorName: item.counselorName,
        score: item.score,
        priorityBucket: item.priorityBucket,
        totalFollowups: item.totalFollowups,
        followupSufficiency: item.followupSufficiency,
        suggestedAction: item.aiSuggestedAction,
      })),
      lowFollowupLeads: summary.lowFollowupLeads.map((item) => ({
        studentName: item.studentName,
        counselorName: item.counselorName,
        totalFollowups: item.totalFollowups,
        followupSufficiency: item.followupSufficiency,
        necessarySteps: item.necessarySteps,
      })),
    };

    const systemPrompt = `
You are an AI performance coach for a student admissions counselling team.
Return ONLY valid JSON with this exact shape:
{
  "headline": string,
  "overview": string,
  "topCounsellorSummary": string,
  "weakCounsellorSummary": string,
  "observations": string[],
  "managerActions": string[],
  "strictMethods": string[]
}

Rules:
- Keep output concise, executive-friendly, and supervision-oriented.
- Mention follow-up sufficiency, best counsellor movement, weak counsellor gap, and lead conversion readiness.
- Observations: exactly 3 short bullets.
- ManagerActions: exactly 3 short action lines.
- StrictMethods: exactly 3 strict daily enforcement rules for the manager.
- Do not mention raw JSON or formatting notes.
`;

    const message = await anthropic.messages.create({
      model: getAnthropicModel(),
      max_tokens: 450,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Manager report payload:\n${JSON.stringify(compactPayload, null, 2)}`,
        },
      ],
    });

    const rawText = message?.content?.[0]?.text || "";
    const parsed = parseJsonResponse(rawText);

    return {
      headline: String(parsed?.headline || "").trim() || buildFallbackCounselorNarrative({ managerName, summary, counselors }).headline,
      overview: String(parsed?.overview || "").trim() || buildFallbackCounselorNarrative({ managerName, summary, counselors }).overview,
      topCounsellorSummary:
        String(parsed?.topCounsellorSummary || "").trim() ||
        buildFallbackCounselorNarrative({ managerName, summary, counselors }).topCounsellorSummary,
      weakCounsellorSummary:
        String(parsed?.weakCounsellorSummary || "").trim() ||
        buildFallbackCounselorNarrative({ managerName, summary, counselors }).weakCounsellorSummary,
      observations: Array.isArray(parsed?.observations)
        ? parsed.observations.map((item) => String(item).trim()).filter(Boolean).slice(0, 3)
        : buildFallbackCounselorNarrative({ managerName, summary, counselors }).observations,
      managerActions: Array.isArray(parsed?.managerActions)
        ? parsed.managerActions.map((item) => String(item).trim()).filter(Boolean).slice(0, 3)
        : buildFallbackCounselorNarrative({ managerName, summary, counselors }).managerActions,
      strictMethods: Array.isArray(parsed?.strictMethods)
        ? parsed.strictMethods.map((item) => String(item).trim()).filter(Boolean).slice(0, 3)
        : buildFallbackCounselorNarrative({ managerName, summary, counselors }).strictMethods,
    };
  } catch (error) {
    console.warn("[AI counsellor-report] Falling back to rule-based narrative:", error.message);
    return buildFallbackCounselorNarrative({ managerName, summary, counselors, leadInsights });
  }
};

const buildAiSupervisionQueueFromLeads = (leads) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const queue = [];

  leads.forEach((lead) => {
    const documentSnapshot = getLeadDocumentSnapshot(lead);
    const followupSummary = getLeadFollowupSummary(lead);
    const leadName = getLeadDisplayName(lead);
    const courseName = getLeadCourseName(lead);
    const centerName = getLeadCenterName(lead);
    const batchName = getLeadBatchName(lead) || "Unassigned";
    const contactNumbers = getLeadContactNumbers(lead);
    const followupDate = lead?.followupDate || null;
    const isOverdue = followupDate ? new Date(followupDate) < todayStart : false;
    const counselor = getLeadCounselor(lead);

    const pushItem = (type, severity, label, reason, action, extra = {}) => {
      queue.push({
        _id: `${lead?._id}-${type}`,
        leadId: String(lead?._id),
        type,
        severity,
        severityWeight: getSeverityWeight(severity),
        label,
        reason,
        action,
        studentName: leadName,
        courseName,
        centerName,
        counselorId: counselor.counselorId,
        counselorName: counselor.counselorName,
        contactNumbers,
        followupDate,
        admissionDate: lead?.admissionDate || null,
        feeStatus: lead?.registrationFee || "Unknown",
        batchName,
        kycBucket: documentSnapshot.category,
        followupAttempts: followupSummary.totalAttempts,
        followupSufficiency: followupSummary.sufficiency,
        sourceStatus: lead?._leadStatus?.title || lead?.leadStatus || "Unknown",
        ...extra,
      });
    };

    if (documentSnapshot.rejectedDocs > 0) {
      pushItem(
        "kycRejected",
        "High",
        "KYC Rejected",
        `${documentSnapshot.rejectedDocs} rejected document(s) need fresh upload or correction.`,
        "Call the student, explain the rejection reason, and ask for corrected documents today.",
        { pendingDocs: documentSnapshot.pendingDocs, rejectedDocs: documentSnapshot.rejectedDocs }
      );
    }

    if (documentSnapshot.pendingVerificationDocs > 0) {
      pushItem(
        "kycPendingVerification",
        "Medium",
        "Pending Verification",
        `${documentSnapshot.pendingVerificationDocs} document(s) are uploaded but waiting for review.`,
        "Prioritize document verification so the student can move to the next stage.",
        { pendingDocs: documentSnapshot.pendingDocs, rejectedDocs: documentSnapshot.rejectedDocs }
      );
    }

    if (!lead?.kyc && !documentSnapshot.hasAnyUploads) {
      pushItem(
        "kycNoUpload",
        "Medium",
        "No KYC Upload",
        "No document upload found for this lead.",
        "Send a document checklist and take follow-up on upload completion."
      );
    }

    if ((lead?.admissionDone || lead?.admissionDate) && lead?.registrationFee !== "Paid") {
      pushItem(
        "admissionUnpaid",
        "High",
        "Admission Unpaid",
        "Admission is marked, but the registration fee is still not paid.",
        "Take fee follow-up and confirm payment proof before batch movement."
      );
    }

    if ((lead?.admissionDone || lead?.admissionDate) && !getLeadBatchName(lead)) {
      pushItem(
        "admissionNoBatch",
        "Medium",
        "Batch Not Assigned",
        "Student admission exists, but no batch is assigned.",
        "Assign batch quickly to avoid post-admission drop-off."
      );
    }

    if (lead?.dropout) {
      pushItem(
        "dropoutRisk",
        "High",
        "Dropout",
        "Student is already marked as dropout.",
        "Review the dropout reason and identify if recovery or closure is needed."
      );
    }

    if (isOverdue) {
      pushItem(
        "overdueFollowup",
        "Medium",
        "Overdue Follow-up",
        "Follow-up date has already passed.",
        "Counselor should reconnect with the student and update the next action date."
      );
    }

    if (!lead?.admissionDone && !lead?.dropout && followupSummary.totalAttempts < 2) {
      pushItem(
        "insufficientFollowup",
        followupSummary.totalAttempts === 0 ? "High" : "Medium",
        "Insufficient Follow-up",
        `Only ${followupSummary.totalAttempts} follow-up attempt(s) found. Current level: ${followupSummary.sufficiency}.`,
        `Necessary steps: ${getLowFollowupActionPlan(lead).join(" ")}`,
        {
          followupAttempts: followupSummary.totalAttempts,
          followupSufficiency: followupSummary.sufficiency,
        }
      );
    }
  });

  return queue.sort((a, b) => {
    const severityDiff = (b.severityWeight || 0) - (a.severityWeight || 0);
    if (severityDiff !== 0) return severityDiff;

    const followupA = a.followupDate ? new Date(a.followupDate).getTime() : 0;
    const followupB = b.followupDate ? new Date(b.followupDate).getTime() : 0;
    return followupA - followupB;
  });
};

const buildQueueSummary = (queue, leadCount) => ({
  totalLeads: leadCount,
  totalActionItems: queue.length,
  kycRejected: queue.filter((item) => item.type === "kycRejected").length,
  kycPendingVerification: queue.filter((item) => item.type === "kycPendingVerification").length,
  kycNoUpload: queue.filter((item) => item.type === "kycNoUpload").length,
  admissionUnpaid: queue.filter((item) => item.type === "admissionUnpaid").length,
  admissionNoBatch: queue.filter((item) => item.type === "admissionNoBatch").length,
  dropoutRisk: queue.filter((item) => item.type === "dropoutRisk").length,
  overdueFollowup: queue.filter((item) => item.type === "overdueFollowup").length,
  insufficientFollowup: queue.filter((item) => item.type === "insufficientFollowup").length,
});

const fetchAiSupervisionLeads = async ({ fromDate, toDate } = {}) => {
  const todayRange = getTodayRange();
  const start = fromDate || todayRange.start;
  const end = toDate || todayRange.end;

  return AppliedCourses.find({
    createdAt: {
      $gte: start,
      $lte: end,
    },
  })
    .populate("_candidate", "name mobile email")
    .populate("_course", "name college docsRequired")
    .populate("_center", "name")
    .populate("batch", "name")
    .populate("_leadStatus", "title")
    .populate("counsellor", "name email reporting_managers")
    .populate("leadAssignment._counsellor", "name email reporting_managers")
    .lean();
};

const getManagerWiseAiReports = async ({ fromDate, toDate } = {}) => {
  const leads = await fetchAiSupervisionLeads({ fromDate, toDate });
  const queue = buildAiSupervisionQueueFromLeads(leads);

  const allUsers = await User.find({
    email: { $exists: true, $ne: null },
  }).select("name email reporting_managers");

  const userMap = {};
  allUsers.forEach((user) => {
    userMap[String(user._id)] = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      reporting_managers: (user.reporting_managers || []).map(String),
    };
  });

  const managerMap = {};

  const ensureManager = (managerId) => {
    const user = userMap[managerId];
    if (!user) return null;

    if (!managerMap[managerId]) {
      managerMap[managerId] = {
        managerId,
        managerName: user.name,
        managerEmail: user.email,
        items: [],
      };
    }

    return managerMap[managerId];
  };

  const propagateItem = (item, managerIds, visited = new Set()) => {
    managerIds.forEach((managerId) => {
      if (visited.has(managerId)) return;
      visited.add(managerId);

      const managerEntry = ensureManager(managerId);
      if (!managerEntry) return;

      const exists = managerEntry.items.some(
        (existing) => String(existing._id) === String(item._id)
      );
      if (!exists) {
        managerEntry.items.push(item);
      }

      const managerUser = userMap[managerId];
      if (managerUser?.reporting_managers?.length) {
        propagateItem(item, managerUser.reporting_managers, visited);
      }
    });
  };

  queue.forEach((item) => {
    if (!item.counselorId) return;
    const counselor = userMap[item.counselorId];
    if (!counselor?.reporting_managers?.length) return;
    propagateItem(item, counselor.reporting_managers);
  });

  return Object.values(managerMap)
    .map((managerReport) => {
      const uniqueLeadIds = new Set(managerReport.items.map((item) => String(item.leadId)));
      return {
        ...managerReport,
        items: managerReport.items.sort((a, b) => {
          const severityDiff = (b.severityWeight || 0) - (a.severityWeight || 0);
          if (severityDiff !== 0) return severityDiff;
          return String(a.studentName || "").localeCompare(String(b.studentName || ""));
        }),
        summary: buildQueueSummary(managerReport.items, uniqueLeadIds.size),
      };
    })
    .filter((managerReport) => managerReport.items.length > 0);
};

const buildAiSupervisionEmailSection = ({ summary, items, managerName }) => {
  const dateLabel = moment().format("DD MMM YYYY");
  const rows = Array.isArray(items) ? items.slice(0, 15) : [];

  const rowsHtml = rows
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;font-weight:600;">${item.studentName}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${item.label}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${item.severity}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${item.courseName}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${item.centerName}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${item.reason}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${item.action}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="margin-top:20px;padding-top:16px;border-top:2px solid #e5e7eb;">
      <h2 style="margin:0 0 4px 0;font-size:18px;">Daily AI Supervision Report</h2>
      <div style="color:#6b7280;font-size:13px;margin-bottom:12px;">
        ${managerName ? `Reporting Manager: <strong>${managerName}</strong><br/>` : ""}
        AI supervision snapshot for <strong>${dateLabel}</strong>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px;">
        <tbody>
          <tr>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Leads Reviewed</div>
              <div style="font-size:16px;font-weight:600;">${summary.totalLeads || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Action Items</div>
              <div style="font-size:16px;font-weight:600;">${summary.totalActionItems || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Low Follow-up</div>
              <div style="font-size:16px;font-weight:600;">${summary.insufficientFollowup || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Overdue</div>
              <div style="font-size:16px;font-weight:600;">${summary.overdueFollowup || 0}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">No Upload</div>
              <div style="font-size:16px;font-weight:600;">${summary.kycNoUpload || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Pending Verification</div>
              <div style="font-size:16px;font-weight:600;">${summary.kycPendingVerification || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Unpaid</div>
              <div style="font-size:16px;font-weight:600;">${summary.admissionUnpaid || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Dropouts</div>
              <div style="font-size:16px;font-weight:600;">${summary.dropoutRisk || 0}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Student</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Issue</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Severity</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Course</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Center</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Reason</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Recommended Action</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="7" style="padding:10px;text-align:center;color:#9ca3af;">No AI supervision action items for today.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
};

const getManagerWiseCounselorAiReports = async ({ fromDate, toDate } = {}) => {
  const leads = await fetchAiSupervisionLeads({ fromDate, toDate });
  const { counselors, leadInsights } = buildCounselorSnapshotFromLeads(leads);

  const allUsers = await User.find({
    email: { $exists: true, $ne: null },
  }).select("name email reporting_managers");

  const userMap = {};
  allUsers.forEach((user) => {
    userMap[String(user._id)] = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      reporting_managers: (user.reporting_managers || []).map(String),
    };
  });

  const counselorMap = {};
  counselors.forEach((item) => {
    counselorMap[String(item.counselorId)] = item;
  });

  const managerMap = {};

  const ensureManager = (managerId) => {
    const user = userMap[managerId];
    if (!user) return null;

    if (!managerMap[managerId]) {
      managerMap[managerId] = {
        managerId,
        managerName: user.name,
        managerEmail: user.email,
        counselorIds: new Set(),
        leadIds: new Set(),
      };
    }

    return managerMap[managerId];
  };

  const propagateLead = (leadInsight, managerIds, visited = new Set()) => {
    managerIds.forEach((managerId) => {
      if (visited.has(managerId)) return;
      visited.add(managerId);

      const managerEntry = ensureManager(managerId);
      if (!managerEntry) return;

      if (leadInsight.counselorId) {
        managerEntry.counselorIds.add(String(leadInsight.counselorId));
      }
      managerEntry.leadIds.add(String(leadInsight.leadId));

      const managerUser = userMap[managerId];
      if (managerUser?.reporting_managers?.length) {
        propagateLead(leadInsight, managerUser.reporting_managers, visited);
      }
    });
  };

  leadInsights.forEach((leadInsight) => {
    if (!leadInsight.counselorId) return;
    const counselorUser = userMap[leadInsight.counselorId];
    if (!counselorUser?.reporting_managers?.length) return;
    propagateLead(leadInsight, counselorUser.reporting_managers);
  });

  const reports = [];

  for (const managerEntry of Object.values(managerMap)) {
    const managerCounselors = [...managerEntry.counselorIds]
      .map((id) => counselorMap[id])
      .filter(Boolean)
      .sort((a, b) => b.performanceScore - a.performanceScore || b.totalLeads - a.totalLeads);

    const managerLeadInsights = [...managerEntry.leadIds]
      .map((leadId) => leadInsights.find((item) => String(item.leadId) === String(leadId)))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || b.todayFollowupsDone - a.todayFollowupsDone);

    const summary = buildManagerCounselorSummary(managerCounselors, managerLeadInsights);
    const narrative = await generateCounselorNarrativeWithAnthropic({
      managerName: managerEntry.managerName,
      summary,
      counselors: managerCounselors,
      leadInsights: managerLeadInsights,
    });

    reports.push({
      managerId: managerEntry.managerId,
      managerName: managerEntry.managerName,
      managerEmail: managerEntry.managerEmail,
      counselors: managerCounselors,
      leadInsights: managerLeadInsights,
      summary,
      narrative,
    });
  }

  return reports.filter((item) => item.counselors.length > 0 || item.leadInsights.length > 0);
};

const buildCounselorAiEmailSection = ({ summary, narrative, counselors, leadInsights, managerName }) => {
  const dateLabel = moment().format("DD MMM YYYY");
  const topCounselorRows = (Array.isArray(counselors) ? counselors.slice(0, 6) : [])
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;font-weight:600;">${escapeHtml(item.counselorName)}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${item.totalLeads || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${item.highPriorityLeads || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${item.intermediatePriorityLeads || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${item.totalDailyFollowupsDone || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${item.followupEnoughLeads || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${item.followupNotEnoughLeads || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${item.performanceScore || 0}</td>
        </tr>
      `
    )
    .join("");

  const bestLeadRows = (summary?.topLeads || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;font-weight:600;">${escapeHtml(item.studentName)}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${escapeHtml(item.counselorName)}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${escapeHtml(item.priorityBucket)}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${item.score || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${item.totalFollowups || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${escapeHtml(item.followupSufficiency)}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${escapeHtml(item.aiSuggestedAction)}</td>
        </tr>
      `
    )
    .join("");

  const lowFollowupRows = (summary?.lowFollowupLeads || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;font-weight:600;">${escapeHtml(item.studentName)}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${escapeHtml(item.counselorName)}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${item.totalFollowups || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${escapeHtml(item.followupSufficiency)}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${escapeHtml((item.necessarySteps || []).slice(0, 2).join(" "))}</td>
        </tr>
      `
    )
    .join("");

  const observationsHtml = (narrative?.observations || [])
    .map(
      (item) =>
        `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`
    )
    .join("");

  const actionsHtml = (narrative?.managerActions || [])
    .map(
      (item) =>
        `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`
    )
    .join("");

  const strictMethodsHtml = (narrative?.strictMethods || [])
    .map(
      (item) =>
        `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`
    )
    .join("");

  return `
    <div style="padding-top:8px;">
      <h2 style="margin:0 0 4px 0;font-size:18px;">Daily AI Counsellor Performance Report</h2>
      <div style="color:#6b7280;font-size:13px;margin-bottom:12px;">
        ${managerName ? `Reporting Manager: <strong>${escapeHtml(managerName)}</strong><br/>` : ""}
        AI performance snapshot for <strong>${dateLabel}</strong>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px;">
        <tbody>
          <tr>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Counsellors</div>
              <div style="font-size:16px;font-weight:600;">${summary?.totalCounselors || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Total Leads</div>
              <div style="font-size:16px;font-weight:600;">${summary?.totalLeads || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">High / Intermediate</div>
              <div style="font-size:16px;font-weight:600;">${summary?.highPriorityLeads || 0} / ${summary?.intermediatePriorityLeads || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Follow-ups Done Today</div>
              <div style="font-size:16px;font-weight:600;">${summary?.totalDailyFollowupsDone || 0}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Follow-up Enough</div>
              <div style="font-size:16px;font-weight:600;">${summary?.followupEnoughLeads || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Need More Follow-up</div>
              <div style="font-size:16px;font-weight:600;">${summary?.followupNotEnoughLeads || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Admissions</div>
              <div style="font-size:16px;font-weight:600;">${summary?.admissions || 0}</div>
            </td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:11px;">Overdue Leads</div>
              <div style="font-size:16px;font-weight:600;">${summary?.overdueLeads || 0}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style="margin-bottom:16px;padding:14px;border:1px solid #dbeafe;background:#eff6ff;border-radius:8px;">
        <div style="font-size:16px;font-weight:700;margin-bottom:6px;">${escapeHtml(narrative?.headline || "AI Team Brief")}</div>
        <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#1f2937;">${escapeHtml(narrative?.overview || "")}</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#1f2937;"><strong>Top Counsellor Insight:</strong> ${escapeHtml(narrative?.topCounsellorSummary || "")}</p>
        <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#991b1b;"><strong>Weak Counsellor Alert:</strong> ${escapeHtml(narrative?.weakCounsellorSummary || "No weak counsellor alert is available.")}</p>
      </div>

      <table style="width:100%;margin-bottom:16px;">
        <tr>
          <td style="width:50%;vertical-align:top;padding-right:8px;">
            <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;">
              <h3 style="margin:0 0 8px 0;font-size:14px;">AI Observations</h3>
              <ul style="margin:0;padding-left:18px;font-size:13px;color:#374151;">
                ${observationsHtml || "<li>No observations available.</li>"}
              </ul>
            </div>
          </td>
          <td style="width:50%;vertical-align:top;padding-left:8px;">
            <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;">
              <h3 style="margin:0 0 8px 0;font-size:14px;">Manager Actions</h3>
              <ul style="margin:0;padding-left:18px;font-size:13px;color:#374151;">
                ${actionsHtml || "<li>No manager actions available.</li>"}
              </ul>
            </div>
          </td>
        </tr>
      </table>

      <div style="margin-bottom:16px;padding:12px 14px;border:1px solid #fecaca;background:#fff1f2;border-radius:8px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;color:#9f1239;">Strict AI Supervision Methods</h3>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#4b5563;">
          ${strictMethodsHtml || "<li>No strict supervision methods available.</li>"}
        </ul>
      </div>

      <h3 style="margin:0 0 8px 0;font-size:15px;">Counsellor Scoreboard</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Counsellor</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Total Leads</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">High</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Intermediate</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Done Today</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Enough</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Not Enough</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">AI Score</th>
          </tr>
        </thead>
        <tbody>
          ${topCounselorRows || `<tr><td colspan="8" style="padding:10px;text-align:center;color:#9ca3af;">No counsellor data available.</td></tr>`}
        </tbody>
      </table>

      <h3 style="margin:0 0 8px 0;font-size:15px;">Best Leads To Track</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Student</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Counsellor</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Priority</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Score</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Follow-ups</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Enough?</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Next Action</th>
          </tr>
        </thead>
        <tbody>
          ${bestLeadRows || `<tr><td colspan="7" style="padding:10px;text-align:center;color:#9ca3af;">No lead intelligence available.</td></tr>`}
        </tbody>
      </table>

      <h3 style="margin:0 0 8px 0;font-size:15px;">Low Follow-up Alert</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Student</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Counsellor</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Total Follow-ups</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Sufficiency</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Necessary Steps</th>
          </tr>
        </thead>
        <tbody>
          ${lowFollowupRows || `<tr><td colspan="5" style="padding:10px;text-align:center;color:#9ca3af;">No low follow-up leads for today.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
};

const getFallbackManagerRecipients = async () => {
  const allUsers = await User.find({
    email: { $exists: true, $ne: null },
  }).select("name email reporting_managers");

  const managerIds = new Set();
  const userMap = {};

  allUsers.forEach((user) => {
    const id = String(user._id);
    userMap[id] = {
      managerId: id,
      managerName: user.name,
      managerEmail: user.email,
    };

    (user.reporting_managers || []).forEach((managerId) => {
      if (managerId) {
        managerIds.add(String(managerId));
      }
    });
  });

  return [...managerIds]
    .map((managerId) => userMap[managerId])
    .filter((item) => item?.managerEmail);
};

module.exports = {
  buildAiSupervisionQueueFromLeads,
  buildQueueSummary,
  getManagerWiseAiReports,
  buildAiSupervisionEmailSection,
  getManagerWiseCounselorAiReports,
  buildCounselorAiEmailSection,
  getFallbackManagerRecipients,
};
