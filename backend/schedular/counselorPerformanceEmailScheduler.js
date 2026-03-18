const cron = require("node-cron");
const moment = require("moment");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
  StatusLogs,
  AppliedCourses,
  Status,
  User,
} = require("../controllers/models");

const helpers = require("../helpers");
const sendMails = helpers.sendMails || helpers.sendMail;
const {
  getManagerWiseAiReports,
  buildAiSupervisionEmailSection,
} = require("../helpers/aiSupervisionReport");

if (!sendMails) {
  console.warn(
    "[CounselorPerformanceEmailScheduler] sendMails/sendMail helper not found. Daily email will NOT be sent."
  );
}

// Build counselor performance matrix similar to /college/counselor-performance-matrix
async function buildCounselorMatrixForToday() {
  const todayStartTime = new Date();
  todayStartTime.setHours(0, 0, 0, 0);

  const todayEndTime = new Date();
  todayEndTime.setHours(23, 59, 59, 999);

  const dateFilter = {
    createdAt: {
      $gte: todayStartTime,
      $lte: todayEndTime,
    },
  };

  // Optional: try to detect a generic "untouch" status (not college-scoped)
  let untouchStatusId = null;
  try {
    const untouchStatus = await Status.findOne({
      title: { $regex: /untouch/i },
    }).select("_id");
    if (untouchStatus) {
      untouchStatusId = untouchStatus._id;
    }
  } catch (e) {
    console.warn(
      "[CounselorPerformanceEmailScheduler] Failed to resolve untouch status:",
      e.message
    );
  }

 
  const appliedCoursesLeads = await AppliedCourses.aggregate([
    {
      $match: {
        ...dateFilter,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "counsellor",
        foreignField: "_id",
        as: "counselorInfo",
      },
    },
    {
      $unwind: {
        path: "$counselorInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          counselorId: "$counsellor",
          counselorName: {
            $ifNull: [
              "$counselorInfo.name",
              {
                $concat: [
                  "Counselor-",
                  { $substr: [{ $toString: "$counsellor" }, 0, 8] },
                ],
              },
            ],
          },
        },
        totalLeads: { $sum: 1 },
        untouchLeads: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$_leadStatus",
                  untouchStatusId ? untouchStatusId : null,
                ],
              },
              1,
              0,
            ],
          },
        },
        totalKYC: { $sum: { $cond: ["$kycStage", 1, 0] } },
        kycDone: { $sum: { $cond: ["$kyc", 1, 0] } },
        pendingKYC: {
          $sum: {
            $cond: [
              { $and: ["$kycStage", { $ne: ["$kyc", true] }] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  // Build quick maps for leads-side metrics
  const totalLeadsMap = {};
  const untouchLeadsMap = {};
  const totalKYCMap = {};
  const kycDoneMap = {};
  const pendingKYCMap = {};

  appliedCoursesLeads.forEach((item) => {
    const counselorId = item._id.counselorId ? String(item._id.counselorId) : null;
    if (!counselorId) return;
  
    totalLeadsMap[counselorId] = (totalLeadsMap[counselorId] || 0) + (item.totalLeads || 0);
    untouchLeadsMap[counselorId] = (untouchLeadsMap[counselorId] || 0) + (item.untouchLeads || 0);
    totalKYCMap[counselorId] = (totalKYCMap[counselorId] || 0) + (item.totalKYC || 0);
    kycDoneMap[counselorId] = (kycDoneMap[counselorId] || 0) + (item.kycDone || 0);
    pendingKYCMap[counselorId] = (pendingKYCMap[counselorId] || 0) + (item.pendingKYC || 0);
  });

  // StatusLogs-based aggregation for admissions/dropouts etc.
  const counselorMatrixData = await StatusLogs.aggregate([
    {
      $match: {
        ...dateFilter,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: "$_appliedId",
        latestRecord: { $first: "$$ROOT" },
      },
    },
    {
      $replaceRoot: { newRoot: "$latestRecord" },
    },
    {
      $lookup: {
        from: "users",
        localField: "counsellor",
        foreignField: "_id",
        as: "counselorInfo",
      },
    },
    {
      $unwind: {
        path: "$counselorInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          counselorId: "$counsellor",
          counselorName: {
            $ifNull: [
              "$counselorInfo.name",
              {
                $concat: [
                  "Counselor-",
                  { $substr: [{ $toString: "$counsellor" }, 0, 8] },
                ],
              },
            ],
          },
        },
        totalLeads: { $sum: 1 },
        totalAdmissions: {
          $sum: { $cond: ["$admissionStatus", 1, 0] },
        },
        totalDropouts: {
          $sum: { $cond: ["$dropOut", 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        counselorId: "$_id.counselorId",
        counselorName: "$_id.counselorName",
        totalLeads: 1,
        totalAdmissions: 1,
        totalDropouts: 1,
        conversionRate: {
          $cond: [
            { $gt: ["$totalLeads", 0] },
            {
              $multiply: [
                { $divide: ["$totalAdmissions", "$totalLeads"] },
                100,
              ],
            },
            0,
          ],
        },
        dropoutRate: {
          $cond: [
            { $gt: ["$totalLeads", 0] },
            {
              $multiply: [
                { $divide: ["$totalDropouts", "$totalLeads"] },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $sort: { counselorName: 1 },
    },
  ]);

  // Transform into the same shape used by the React dashboard
  const transformedData = {};

  counselorMatrixData.forEach((counselor) => {
    const counselorId = counselor.counselorId ? String(counselor.counselorId) : null;
    const counselorName = counselor.counselorName || "Unknown";
    const totalLeads = totalLeadsMap[counselorId] || counselor.totalLeads || 0;
  
    if (!counselorId) return;
  
    transformedData[counselorId] = {
      counselorId,
      counselorName,
      Leads: totalLeads,
      // Untouch: untouchLeadsMap[counselorName] || 0,
      // TotalKYC: totalKYCMap[counselorName] || 0,
      // KYCDone: kycDoneMap[counselorName] || 0,
      // PendingKYC: pendingKYCMap[counselorName] || 0,
      Untouch: untouchLeadsMap[counselorId] || 0,
TotalKYC: totalKYCMap[counselorId] || 0,
KYCDone: kycDoneMap[counselorId] || 0,
PendingKYC: pendingKYCMap[counselorId] || 0,
      Admissions: counselor.totalAdmissions || 0,
      Dropouts: counselor.totalDropouts || 0,
      Paid: counselor.totalAdmissions || 0,
      Unpaid: totalLeads - (counselor.totalAdmissions || 0),
      ConversionRate: Number(counselor.conversionRate || 0).toFixed(1),
      DropoutRate: Number(counselor.dropoutRate || 0).toFixed(1),
    };
  });

  // Ensure we also include counselors that only appear in AppliedCourses aggregation
  appliedCoursesLeads.forEach((item) => {
    const counselorId = item._id.counselorId ? String(item._id.counselorId) : null;
    const counselorName = item._id.counselorName || "Unknown";
    if (!counselorId) return;
    if (transformedData[counselorId]) return;
  
    // const totalLeads = totalLeadsMap[counselorName] || item.totalLeads || 0;
    const totalLeads = totalLeadsMap[counselorId] || item.totalLeads || 0;
  
    transformedData[counselorId] = {
      counselorId,
      counselorName,
      Leads: totalLeads,
      Untouch: untouchLeadsMap[counselorName] || 0,
      TotalKYC: totalKYCMap[counselorName] || 0,
      KYCDone: kycDoneMap[counselorName] || 0,
      PendingKYC: pendingKYCMap[counselorName] || 0,
      Admissions: 0,
      Dropouts: 0,
      Paid: 0,
      Unpaid: totalLeads,
      ConversionRate: 0,
      DropoutRate: 0,
    };
  });

  const counselorIds = Object.keys(transformedData);

  const summary = {
    totalCounselors: counselorIds.length,
    totalLeads: counselorIds.reduce(
      (sum, id) => sum + (transformedData[id].Leads || 0),
      0
    ),
    totalAdmissions: counselorIds.reduce(
      (sum, id) => sum + (transformedData[id].Admissions || 0),
      0
    ),
    totalDropouts: counselorIds.reduce(
      (sum, id) => sum + (transformedData[id].Dropouts || 0),
      0
    ),
    averageConversionRate:
      counselorIds.length === 0
        ? 0
        : counselorIds.reduce(
            (sum, id) => sum + Number(transformedData[id].ConversionRate || 0),
            0
          ) / counselorIds.length,
  };

  return { data: transformedData, summary };
}

function buildHtmlReport({ data, summary, managerName, extraSectionsHtml = "" }) {
  const dateLabel = moment().format("DD MMM YYYY");
  const rows = Array.isArray(data) ? data : Object.values(data);

  const rowsHtml = rows
    .sort((a, b) => (b.Leads || 0) - (a.Leads || 0))
    .map((d) => {
      return `
        <tr>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;font-weight:600;">${d.counselorName}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${d.Leads || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${d.Untouch || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${d.KYCDone || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${d.PendingKYC || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${d.Admissions || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${d.Dropouts || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${d.Paid || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${d.Unpaid || 0}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${Number(d.ConversionRate || 0).toFixed(1)}%</td>
        </tr>
      `;
    })
    .join("");

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Counsellor Performance – ${dateLabel}</title>
    </head>
    <body style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;background:#f3f4f6;padding:16px;">
      <div style="max-width:960px;margin:0 auto;background:#ffffff;border-radius:8px;padding:16px 20px;border:1px solid #e5e7eb;">
        <h2 style="margin:0 0 4px 0;font-size:18px;">Daily Counsellor Performance</h2>
        <div style="color:#6b7280;font-size:13px;margin-bottom:12px;">
          ${managerName ? `Reporting Manager: <strong>${managerName}</strong><br/>` : ""}
          Dashboard snapshot for <strong>${dateLabel}</strong>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px;">
          <tbody>
            <tr>
              <td style="padding:8px 10px;border:1px solid #e5e7eb;">
                <div style="color:#6b7280;font-size:11px;">Counsellors</div>
                <div style="font-size:16px;font-weight:600;">${summary.totalCounselors || 0}</div>
              </td>
              <td style="padding:8px 10px;border:1px solid #e5e7eb;">
                <div style="color:#6b7280;font-size:11px;">Total Leads</div>
                <div style="font-size:16px;font-weight:600;">${summary.totalLeads || 0}</div>
              </td>
              <td style="padding:8px 10px;border:1px solid #e5e7eb;">
                <div style="color:#6b7280;font-size:11px;">Admissions</div>
                <div style="font-size:16px;font-weight:600;">${summary.totalAdmissions || 0}</div>
              </td>
              <td style="padding:8px 10px;border:1px solid #e5e7eb;">
                <div style="color:#6b7280;font-size:11px;">Avg Conversion</div>
                <div style="font-size:16px;font-weight:600;">${Number(summary.averageConversionRate || 0).toFixed(1)}%</div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Counsellor</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Leads</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Untouch</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">KYC Done</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Pending KYC</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Admissions</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Dropouts</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Paid</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Unpaid</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Conversion %</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="10" style="padding:10px;text-align:center;color:#9ca3af;">No data for today.</td></tr>`}
          </tbody>
        </table>
        ${extraSectionsHtml || ""}
      </div>
    </body>
  </html>
  `;
}

async function getManagerWiseReports(counselorDataMap) {

  const counselorIds = Object.keys(counselorDataMap);
  if (!counselorIds.length) return [];

  const allUsers = await User.find({
    email: { $exists: true, $ne: null }
  }).select("name email reporting_managers");

  const userMap = {};
  allUsers.forEach(u => {
    userMap[String(u._id)] = {
      id: String(u._id),
      name: u.name,
      email: u.email,
      reporting_managers: (u.reporting_managers || []).map(String)
    };
  });

  const managerMap = {};

  function ensureManager(managerId){
    const user = userMap[managerId];
    if(!user) return null;

    if(!managerMap[managerId]){
      managerMap[managerId] = {
        managerId,
        managerName: user.name,
        managerEmail: user.email,
        counselors: [],
        managerSummary: {}
      };
    }

    return managerMap[managerId];
  }

  function propagate(reportRow, managerIds, directManagerId=null, visited=new Set()){

    for(const managerId of managerIds){

      if(visited.has(managerId)) continue;
      visited.add(managerId);

      const managerEntry = ensureManager(managerId);
      if(!managerEntry) continue;

      const exists = managerEntry.counselors.some(
        r => String(r.counselorId) === String(reportRow.counselorId)
      );

      if(!exists){
        managerEntry.counselors.push(reportRow);
      }

      if(directManagerId && managerId !== directManagerId){

        const directManager = userMap[directManagerId];
        if(directManager){

          if(!managerEntry.managerSummary[directManagerId]){
            managerEntry.managerSummary[directManagerId] = {
              counselorId: directManagerId,
              counselorName: `${directManager.name}`,
              Leads:0,
              Untouch:0,
              TotalKYC:0,
              KYCDone:0,
              PendingKYC:0,
              Admissions:0,
              Dropouts:0,
              Paid:0,
              Unpaid:0,
              ConversionRate:"0.0",
              DropoutRate:"0.0"
            };
          }

          const row = managerEntry.managerSummary[directManagerId];

          row.Leads += reportRow.Leads || 0;
          row.Untouch += reportRow.Untouch || 0;
          row.TotalKYC += reportRow.TotalKYC || 0;
          row.KYCDone += reportRow.KYCDone || 0;
          row.PendingKYC += reportRow.PendingKYC || 0;
          row.Admissions += reportRow.Admissions || 0;
          row.Dropouts += reportRow.Dropouts || 0;
          row.Paid += reportRow.Paid || 0;
          row.Unpaid += reportRow.Unpaid || 0;
        }
      }

      const managerUser = userMap[managerId];

      if(managerUser && managerUser.reporting_managers.length){

        propagate(
          reportRow,
          managerUser.reporting_managers,
          managerId,
          visited
        );
      }
    }
  }

  for(const counselorId of counselorIds){

    const reportRow = counselorDataMap[counselorId];
    const user = userMap[counselorId];

    if(!reportRow || !user) continue;

    propagate(
      reportRow,
      user.reporting_managers
    );
  }

  return Object.values(managerMap).map(m => {

    const managerRows = Object.values(m.managerSummary);

    return {
      ...m,
      counselors: [...managerRows, ...m.counselors]
    };

  }).filter(m => m.counselors.length > 0);
}
async function sendDailyCounselorPerformanceEmail() {
  if (!sendMails) return;

  try {
    const { data } = await buildCounselorMatrixForToday();
    const aiManagerWiseReports = await getManagerWiseAiReports();
    const aiManagerReportMap = {};
    aiManagerWiseReports.forEach((report) => {
      aiManagerReportMap[String(report.managerId)] = report;
    });

    // console.log("==== transformed counselor data keys ====");
    // console.log(Object.keys(data || {}));

    // console.log("==== transformed counselor data ====");
    // console.log(JSON.stringify(data, null, 2));

    const managerWiseReports = await getManagerWiseReports(data);
    const managerReportMap = {};
    managerWiseReports.forEach((report) => {
      managerReportMap[String(report.managerId)] = report;
    });

    // console.log("==== managerWiseReports ====");
    // console.log(JSON.stringify(managerWiseReports, null, 2));

    const allManagerIds = [...new Set([
      ...Object.keys(managerReportMap),
      ...Object.keys(aiManagerReportMap),
    ])];

    if (!allManagerIds.length) {
      // console.warn("[CounselorPerformanceEmailScheduler] No manager-wise reports found.");
      return;
    }

    const subject = `Daily Counsellor Performance + AI Supervision – ${moment().format("DD MMM YYYY")}`;

    for (const managerId of allManagerIds) {
      const managerReport = managerReportMap[String(managerId)] || null;
      const aiReport = aiManagerReportMap[String(managerId)] || null;
      const rows = managerReport?.counselors || [];
      const managerName = managerReport?.managerName || aiReport?.managerName || "Manager";
      const managerEmail = managerReport?.managerEmail || aiReport?.managerEmail;

      if (!managerEmail) {
        continue;
      }

      const summary = {
        totalCounselors: rows.length,
        totalLeads: rows.reduce((sum, r) => sum + (r.Leads || 0), 0),
        totalAdmissions: rows.reduce((sum, r) => sum + (r.Admissions || 0), 0),
        totalDropouts: rows.reduce((sum, r) => sum + (r.Dropouts || 0), 0),
        averageConversionRate:
          rows.length === 0
            ? 0
            : rows.reduce((sum, r) => sum + Number(r.ConversionRate || 0), 0) / rows.length,
      };

      const extraSectionsHtml = buildAiSupervisionEmailSection({
        summary: aiReport?.summary || {
          totalLeads: 0,
          totalActionItems: 0,
          kycRejected: 0,
          kycPendingVerification: 0,
          kycNoUpload: 0,
          admissionUnpaid: 0,
          admissionNoBatch: 0,
          dropoutRisk: 0,
          overdueFollowup: 0,
          insufficientFollowup: 0,
        },
        items: aiReport?.items || [],
        managerName,
      });

      const html = buildHtmlReport({
        data: rows,
        summary,
        managerName,
        extraSectionsHtml,
      });

      try {
        await sendMails(subject, html, managerEmail, {
          from: "Focalyt Portal <focalytportal@gmail.com>",
          cc: "parveen.bansal@focalyt.com",
          // cc:"akash.gaurav@focalyt.com"
        });

        
      } catch (err) {
       
      }
    }
  } catch (err) {
    console.error(
      "[CounselorPerformanceEmailScheduler] Error while building/sending report:",
      err
    );
  }
}

async function runOnceIfMain() {
  if (require.main === module) {
    const path = require("path");
    require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
    const mongoose = require("mongoose");
    const { mongodbUri } = require("../config");

    if (!mongodbUri) {
      
      process.exit(1);
    }

    try {
      await mongoose.connect(mongodbUri);
     
      await sendDailyCounselorPerformanceEmail();
      // console.log("[CounselorPerformanceEmailScheduler] Done.");
    } catch (err) {
      process.exit(1);
    } finally {
      await mongoose.connection.close();
      process.exit(0);
    }
  }
}

function counselorPerformanceEmailScheduler() {
  // sendDailyCounselorPerformanceEmail();
  cron.schedule(
    "35 18 * * *",
    async () => {
      try {
        
        await sendDailyCounselorPerformanceEmail();
      } catch (err) {
        
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
}

runOnceIfMain();

module.exports = counselorPerformanceEmailScheduler;

