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

module.exports = {
  buildAiSupervisionQueueFromLeads,
  buildQueueSummary,
  getManagerWiseAiReports,
  buildAiSupervisionEmailSection,
};
