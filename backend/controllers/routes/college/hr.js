const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const router = express.Router();
const { isCollege } = require('../../../helpers');
const CareerApplication = require('../../models/careerApplication');
const StatusHr = require('../../models/statusHr');
const College = require('../../models/college');

const STATUS_POPULATE = { path: 'leadStatus', select: 'title milestone substatuses' };
const HR_DOCUMENT_TYPES = [
  { key: 'resume', name: 'Resume / CV' },
  { key: 'photo', name: 'Photograph' }
];
const { resolvePublicUrl } = require('../../../helpers/s3Storage');
const { uploadSinglefile } = require('../functions/images');

const isActualMediaFile = (value) => {
  const v = String(value || '').trim();
  if (!v) return false;
  if (/^(n\/?a|null|undefined|not found|none|-)$/i.test(v)) return false;
  const path = v.split('?')[0];
  if (/\.(pdf|png|jpe?g|gif|webp|bmp|doc|docx)$/i.test(path)) return true;
  return /(?:^|\/)uploads\//i.test(v);
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

// Lead sources send mobiles as +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX or plain 10 digits.
const normalizeMobile = (value) => {
  let mobile = String(value || '')
    .trim()
    .replace(/[\s\-()]/g, '');

  if (mobile.startsWith('+91')) mobile = mobile.slice(3);
  else if (mobile.startsWith('0091')) mobile = mobile.slice(4);
  else if (mobile.startsWith('91') && mobile.length === 12) mobile = mobile.slice(2);
  else if (mobile.startsWith('0') && mobile.length === 11) mobile = mobile.slice(1);

  return mobile;
};

const capitalizeWords = (str) => {
  if (!str) return '';
  return String(str)
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const serializeLead = (doc) => {
  const lead = doc?.toObject ? doc.toObject() : { ...doc };
  if (isActualMediaFile(lead.resume)) {
    lead.resume = resolvePublicUrl(lead.resume) || lead.resume;
  } else {
    lead.resume = '';
  }
  lead.leadOwner = lead.leadOwner || lead.assignedTo || null;

  const statusRef = lead.leadStatus;
  if (statusRef && typeof statusRef === 'object' && statusRef.title) {
    const sub = (statusRef.substatuses || []).find(
      (item) => String(item._id) === String(lead.leadSubstatus || '')
    );
    lead.leadStatus = {
      _id: statusRef._id,
      title: statusRef.title,
      milestone: statusRef.milestone || '',
    };
    lead.statusTitle = statusRef.title;
    lead.statusMilestone = statusRef.milestone || '';
    lead.subStatusTitle = sub?.title || '';
  } else {
    lead.leadStatus = null;
    lead.statusTitle = '';
    lead.statusMilestone = '';
    lead.subStatusTitle = '';
  }

  const docsByKey = {};
  (lead.documents || []).forEach((item) => {
    if (item?.key && isActualMediaFile(item.fileUrl)) docsByKey[item.key] = item;
  });
  if (isActualMediaFile(lead.resume) && !docsByKey.resume?.fileUrl) {
    docsByKey.resume = {
      key: 'resume',
      name: 'Resume / CV',
      fileUrl: lead.resume,
      uploadedAt: lead.updatedAt || lead.createdAt || null,
    };
  }
  lead.documents = HR_DOCUMENT_TYPES.map((type) => {
    const saved = docsByKey[type.key] || {};
    const raw = saved.fileUrl || (type.key === 'resume' ? lead.resume : '') || '';
    const fileUrl = isActualMediaFile(raw) ? (resolvePublicUrl(raw) || raw) : '';
    return {
      key: type.key,
      name: type.name,
      fileUrl,
      uploadedAt: fileUrl ? (saved.uploadedAt || null) : null,
    };
  });
  const summary = buildFollowupSummary(lead.followups);
  lead.followupCounts = summary.counts;
  lead.nextCallFollowup = summary.nextCall;
  lead.nextVisitFollowup = summary.nextVisit;
  return lead;
};

const buildFollowupSummary = (followups = []) => {
  const now = new Date();
  const counts = {
    call: { done: 0, planned: 0, missed: 0 },
    visit: { done: 0, planned: 0, missed: 0 },
  };
  let nextCall = null;
  let nextVisit = null;

  (followups || []).forEach((item) => {
    const bucketKey = item?.type === 'Visit' ? 'visit' : 'call';
    const followupDate = item?.followupDate ? new Date(item.followupDate) : null;
    if (item?.status === 'done') {
      counts[bucketKey].done += 1;
      return;
    }
    if (!followupDate) return;
    if (followupDate < now) {
      counts[bucketKey].missed += 1;
    } else {
      counts[bucketKey].planned += 1;
    }
    const current = bucketKey === 'visit' ? nextVisit : nextCall;
    if (!current || followupDate < new Date(current.followupDate)) {
      const next = { followupDate, remarks: item.remarks || '' };
      if (bucketKey === 'visit') nextVisit = next;
      else nextCall = next;
    }
  });

  return { counts, nextCall, nextVisit };
};

const followupMatch = (type, bucket) => {
  const now = new Date();
  if (bucket === 'done') {
    return { followups: { $elemMatch: { type, status: 'done' } } };
  }
  if (bucket === 'missed') {
    return { followups: { $elemMatch: { type, status: 'planned', followupDate: { $lt: now } } } };
  }
  return { followups: { $elemMatch: { type, status: 'planned', followupDate: { $gte: now } } } };
};

const toObjectId = (value) => {
  if (!value) return null;
  const id = typeof value === 'object' ? (value._id || value.id) : value;
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return null;
  return String(id);
};

const toCollegeObjectId = (value) => {
  const id = toObjectId(value);
  return id ? new mongoose.Types.ObjectId(id) : null;
};

// A college sees its own leads plus older records that were saved before college scoping.
const collegeScopeFilter = (collegeId) => {
  const id = toCollegeObjectId(collegeId);
  if (!id) return {};
  return {
    $or: [
      { college: id },
      { college: null },
      { college: { $exists: false } },
    ],
  };
};

const applyCollegeScope = (match, collegeId) => {
  const scope = collegeScopeFilter(collegeId);
  if (!scope.$or) return match;
  if (match.$or || match.$and) {
    match.$and = [
      ...(match.$and || []),
      ...(match.$or ? [{ $or: match.$or }] : []),
      { $or: scope.$or },
    ];
    delete match.$or;
  } else {
    match.$or = scope.$or;
  }
  return match;
};

const exactInsensitive = (value) => new RegExp(`^${String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

const collegeIdFilter = (id) => (
  id ? [{ college: id }, { college: String(id) }] : []
);

const firstHrStatus = async (collegeId) => {
  const id = toCollegeObjectId(collegeId);
  if (id) {
    const owned = await StatusHr.findOne({
      isDeleted: { $ne: true },
      $or: collegeIdFilter(id),
    }).sort({ index: 1 });
    if (owned) return owned;
  }
  return StatusHr.findOne({
    isDeleted: { $ne: true },
    $or: [{ college: null }, { college: { $exists: false } }],
  }).sort({ index: 1 });
};

// Digital lead payloads send status/sub-status as titles, so resolve them against HR Status Design.
const resolveHrStatus = async (statusTitle, subStatusTitle, collegeId) => {
  const id = toCollegeObjectId(collegeId);
  const title = String(statusTitle || '').trim();
  let status = null;
  if (title) {
    if (id) {
      status = await StatusHr.findOne({
        isDeleted: { $ne: true },
        title: exactInsensitive(title),
        $or: collegeIdFilter(id),
      });
    }
    if (!status) {
      status = await StatusHr.findOne({
        isDeleted: { $ne: true },
        title: exactInsensitive(title),
        $or: [{ college: null }, { college: { $exists: false } }],
      });
    }
    if (!status) return { error: 'Status not found' };
  } else {
    status = await firstHrStatus(collegeId);
  }

  if (!status) return { status: null, substatus: null };

  let substatus = null;
  const subTitle = String(subStatusTitle || '').trim();
  if (subTitle) {
    substatus = (status.substatuses || []).find(
      (item) => String(item.title || '').trim().toLowerCase() === subTitle.toLowerCase()
    );
    if (!substatus) return { error: 'Substatus not found' };
  } else {
    substatus = status.substatuses?.[0] || null;
  }

  return { status, substatus };
};

const buildMatch = (query = {}, collegeId) => {
  const {
    search,
    leadStatus,
    subStatus,
    applyingFor,
    startDate,
    endDate,
    city,
    followupType,
    followupBucket,
  } = query;

  const match = { isDeleted: { $ne: true } };

  if (followupType && followupBucket) {
    Object.assign(match, followupMatch(followupType === 'Visit' ? 'Visit' : 'Call', followupBucket));
  }

  // Statuses are configured from the HR Status Design page, so filters carry StatusHr ids.
  // 'none' keeps the bucket of leads that were never moved to a configured status.
  if (leadStatus && leadStatus !== 'all') {
    if (leadStatus === 'none') {
      match.$or = [{ leadStatus: null }, { leadStatus: { $exists: false } }];
    } else if (mongoose.Types.ObjectId.isValid(String(leadStatus))) {
      match.leadStatus = new mongoose.Types.ObjectId(String(leadStatus));
    }
  }

  if (subStatus && mongoose.Types.ObjectId.isValid(String(subStatus))) {
    match.leadSubstatus = new mongoose.Types.ObjectId(String(subStatus));
  }

  if (applyingFor) {
    match.applyingFor = applyingFor;
  }

  if (city) {
    match.city = new RegExp(String(city).trim(), 'i');
  }

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) {
      const start = moment(startDate).startOf('day').toDate();
      if (!Number.isNaN(start.getTime())) match.createdAt.$gte = start;
    }
    if (endDate) {
      const end = moment(endDate).endOf('day').toDate();
      if (!Number.isNaN(end.getTime())) match.createdAt.$lte = end;
    }
    if (!Object.keys(match.createdAt).length) delete match.createdAt;
  }

  const q = String(search || '').trim();
  if (q) {
    const searchOr = [
      { fullName: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { mobile: new RegExp(q, 'i') },
      { city: new RegExp(q, 'i') },
      { applyingFor: new RegExp(q, 'i') },
      { experience: new RegExp(q, 'i') },
    ];
    if (match.$or) {
      match.$and = [{ $or: match.$or }, { $or: searchOr }];
      delete match.$or;
    } else {
      match.$or = searchOr;
    }
  }

  return applyCollegeScope(match, collegeId);
};

router.get('/leads', isCollege, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const match = buildMatch(req.query, req.user?.college?._id);

    const [leads, total] = await Promise.all([
      CareerApplication.find(match)
        .populate('leadOwner', 'name email')
        .populate('leadCoOwner', 'name email')
        .populate('assignedTo', 'name email')
        .populate(STATUS_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CareerApplication.countDocuments(match),
    ]);

    return res.json({
      success: true,
      data: {
        leads: leads.map(serializeLead),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      },
    });
  } catch (error) {
    console.error('[HR leads] list error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch HR leads' });
  }
});

router.get('/leads/counts', isCollege, async (req, res) => {
  try {
    const baseMatch = buildMatch({
      ...req.query,
      leadStatus: 'all',
      followupType: undefined,
      followupBucket: undefined,
    }, req.user?.college?._id);

    const followupBuckets = ['done', 'planned', 'missed'];
    const [grouped, roles, ...followupTotals] = await Promise.all([
      CareerApplication.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$leadStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      CareerApplication.distinct('applyingFor', { ...baseMatch }),
      ...['Call', 'Visit'].flatMap((type) =>
        followupBuckets.map((bucket) =>
          CareerApplication.countDocuments({ ...baseMatch, ...followupMatch(type, bucket) })
        )
      ),
    ]);

    const followups = {
      call: {
        done: followupTotals[0] || 0,
        planned: followupTotals[0] || 0,
        missed: followupTotals[0] || 0,
      },
      visit: {
        done: followupTotals[0] || 0,
        planned: followupTotals[0] || 0,
        missed: followupTotals[0] || 0,
      },
    };

    // Counts are keyed by StatusHr id, 'none' holds leads without a configured status.
    const counts = { all: 0, none: 0 };
    grouped.forEach((row) => {
      const key = row._id ? String(row._id) : 'none';
      counts[key] = (counts[key] || 0) + row.count;
      counts.all += row.count;
    });

    return res.json({
      success: true,
      data: {
        counts,
        followups,
        roles: (roles || []).filter(Boolean).sort((a, b) => a.localeCompare(b)),
      },
    });
  } catch (error) {
    console.error('[HR leads] counts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch HR lead counts' });
  }
});

// Configured HR statuses (managed from the HR Status Design page)
router.get('/statuses', isCollege, async (req, res) => {
  try {
    const collegeId = req.user?.college?._id;
    const scope = [{ college: null }, { college: { $exists: false } }];
    if (collegeId) scope.unshift({ college: collegeId });

    const statuses = await StatusHr.find({ isDeleted: { $ne: true }, $or: scope }).sort({ index: 1 });

    return res.json({
      success: true,
      data: statuses.map((status) => ({
        _id: status._id,
        title: status.title,
        description: status.description,
        milestone: status.milestone,
        index: status.index,
        substatuses: (status.substatuses || []).map((sub) => ({
          _id: sub._id,
          title: sub.title,
          description: sub.description,
          hasRemarks: sub.hasRemarks,
          hasFollowup: sub.hasFollowup,
          hasAttachment: sub.hasAttachment,
        })),
      })),
    });
  } catch (error) {
    console.error('[HR leads] statuses error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch HR statuses' });
  }
});

router.get('/leads/download', isCollege, async (req, res) => {
  try {
    const match = buildMatch(req.query, req.user?.college?._id);
    const leads = await CareerApplication.find(match)
      .populate('leadOwner', 'name email')
      .populate('leadCoOwner', 'name email')
      .populate(STATUS_POPULATE)
      .sort({ createdAt: -1 })
      .lean();

    const rows = leads.map((lead) => ({
      Date: moment(lead.createdAt).utcOffset('+05:30').format('DD/MM/YYYY hh:mm A'),
      Name: lead.fullName || '',
      Mobile: lead.mobile || '',
      Email: lead.email || '',
      City: lead.city || '',
      'Applying For': lead.applyingFor || '',
      Qualification: lead.qualification || '',
      'Date Of Birth': lead.dateOfBirth ? moment(lead.dateOfBirth).format('DD/MM/YYYY') : '',
      Experience: lead.experience || '',
      Status: lead.leadStatus?.title || '',
      'Sub-Status': (lead.leadStatus?.substatuses || []).find(
        (item) => String(item._id) === String(lead.leadSubstatus || '')
      )?.title || '',
      'Lead Owner': lead.leadOwner?.name || '',
      'Lead Co-Owner': lead.leadCoOwner?.name || '',
      Source: lead.source || '',
      Remark: lead.remark || '',
      Resume: lead.resume ? resolvePublicUrl(lead.resume) || lead.resume : '',
    }));

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[HR leads] download error:', error);
    return res.status(500).json({ success: false, message: 'Failed to download HR leads' });
  }
});

// Manual add from the HR panel.
router.post('/leads', isCollege, async (req, res) => {
  try {
    const fullName = capitalizeWords(req.body.fullName || req.body.name);
    const email = String(req.body.email || '').trim().toLowerCase();
    const mobile = normalizeMobile(req.body.mobile);
    const city = String(req.body.city || '').trim();
    const applyingFor = String(req.body.applyingFor || req.body.position || '').trim();
    const experience = String(req.body.experience || '').trim();
    const qualification = String(req.body.qualification || '').trim();
    const dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
    const remark = String(req.body.remark || '').trim();
    const source = String(req.body.source || 'manual').trim() || 'manual';

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter a valid full name' });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email ID' });
    }
    if (!mobile || !MOBILE_RE.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }
    if (!applyingFor) {
      return res.status(400).json({ success: false, message: 'Applying for is required' });
    }
    if (!experience) {
      return res.status(400).json({ success: false, message: 'Experience is required' });
    }

    let resumeUrl = String(req.body.resume || '').trim();
    const resumeFile = req.files?.resume || req.files?.cv;
    if (resumeFile) {
      const cvKey = await uploadSinglefile(resumeFile);
      resumeUrl = resolvePublicUrl(cvKey);
    }

    const collegeId = req.user?.college?._id || null;
    const defaultStatus = await firstHrStatus(collegeId);

    const lead = await CareerApplication.create({
      fullName,
      email,
      mobile,
      city,
      applyingFor,
      experience,
      qualification,
      dateOfBirth: dateOfBirth && !Number.isNaN(dateOfBirth.getTime()) ? dateOfBirth : undefined,
      resume: isActualMediaFile(resumeUrl) ? resumeUrl : '',
      remark,
      source,
      college: collegeId,
      leadStatus: defaultStatus?._id || null,
      leadSubstatus: defaultStatus?.substatuses?.[0]?._id || null,
      logs: [
        {
          user: req.user?._id,
          action: 'Lead created',
          remarks: source === 'manual' ? 'Added from HR panel' : source,
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'HR lead added successfully',
      data: serializeLead(lead),
    });
  } catch (error) {
    console.error('[HR leads] create error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add HR lead' });
  }
});

// Public ingestion for digital career leads (ads / landing pages / lead forms).
// Mirrors /college/digitalLead/addleaddandcourseapply: status and sub-status arrive as titles,
// and a repeat submission for the same role is recorded as a re-enquiry instead of a duplicate lead.
router.route("/digitalhrleads").post(async (req, res) => {
  try {
      console.log("[DigitalHRLead] POST /digitalhrleads →", {
          fullname: req.body.fullname,
          mobile: req.body.mobile,
          applyingFor: req.body.applyingFor,
          city: req.body.city,
          college: req.body.college,
          source: req.body.source || "Digital Lead"
      });

      let { fullname, mobile, email,  gender, city, applyingFor, experience, qualification, dob, source, remark, status, subStatus, college } = req.body;

      if (!fullname || !mobile || !email || !gender || !city || !applyingFor || !status || !subStatus || !college) {
          return res.status(400).json({
              status: false,
              msg: "All required fields must be provided"
          });
      }

      const collegeId = toCollegeObjectId(college);
      if (!collegeId) {
          return res.status(400).json({
              status: false,
              msg: "Valid college is required"
          });
      }

      const collegeDoc = await College.findOne({ _id: collegeId, isDeleted: { $ne: true } });
      if (!collegeDoc) {
          return res.status(404).json({
              status: false,
              msg: "College not found"
          });
      }

      if (!source) {
        source = 'Digital Lead';
    }

      // Normalize mobile number
      mobile = mobile.toString().trim().replace(/[\s-]/g, "");

      if (mobile.startsWith("+91")) {
          mobile = mobile.slice(3);
      } else if (mobile.startsWith("91") && mobile.length === 12) {
          mobile = mobile.slice(2);
      }

      if (!/^[6-9][0-9]{9}$/.test(mobile)) {
          return res.status(400).json({
              status: false,
              msg: "Invalid Indian mobile number"
          });
      }

      if (!EMAIL_RE.test(email.trim())) {
          return res.status(400).json({
              status: false,
              msg: "Invalid email format"
          });
      }

      // Match HR Status Design by title; if the sheet title does not match, use this college's first status.
      let resolved = await resolveHrStatus(status, subStatus, collegeId);
      if (resolved.error) {
          console.log('[DigitalHRLead] status title miss, using first HR status', {
              status,
              subStatus,
              college: String(collegeId),
              error: resolved.error,
          });
          const fallback = await firstHrStatus(collegeId);
          if (!fallback) {
              return res.status(404).json({
                  status: false,
                  msg: resolved.error,
              });
          }
          const fallbackSub = (fallback.substatuses || []).find(
              (item) => String(item.title || '').trim().toLowerCase() === String(subStatus || '').trim().toLowerCase()
          ) || fallback.substatuses?.[0] || null;
          if (!fallbackSub) {
              return res.status(404).json({
                  status: false,
                  msg: 'Substatus not found',
              });
          }
          resolved = { status: fallback, substatus: fallbackSub };
      }

      const statusDocument = resolved.status;
      const subStatusDocument = resolved.substatus;
      if (!statusDocument || !subStatusDocument) {
          return res.status(404).json({
              status: false,
              msg: !statusDocument ? 'Status not found' : 'Substatus not found',
          });
      }

     

      const parsedDob = dob ? new Date(dob) : null;

      if (dob && Number.isNaN(parsedDob.getTime())) {
          return res.status(400).json({
              status: false,
              msg: "Invalid date of birth"
          });
      }

      let resumeUrl = String(req.body.resume || req.body.cv || "").trim();
      const resumeFile = req.files?.resume || req.files?.cv;
      if (resumeFile) {
          const cvKey = await uploadSinglefile(resumeFile);
          resumeUrl = resolvePublicUrl(cvKey);
      }

      // Same mobile applying for the same role at the same college is a re-enquiry, not a new lead.
      const existingLead = await CareerApplication.findOne({
          mobile,
          applyingFor: exactInsensitive(applyingFor),
          college: collegeId,
          isDeleted: { $ne: true }
      }).populate(STATUS_POPULATE);

      if (existingLead) {
          existingLead.logs.push({
              action: `Re-enquiry received from ${source}`,
              remarks: remark || "",
              timestamp: new Date()
          });
          await existingLead.save();

          console.log("[DigitalHRLead] Re-enquiry logged →", { leadId: existingLead._id.toString(), mobile, applyingFor });

          return res.status(200).json({
              status: false,
              duplicate: true,
              msg: "Lead already exists for this job, re-enquiry recorded",
              data: {
                  leadId: existingLead._id,
                  lead: serializeLead(existingLead)
              }
          });
      }

      const lead = await CareerApplication.create({
          fullName: capitalizeWords(fullname),
          email: email.trim().toLowerCase(),
          mobile,
          gender,
          city,
          applyingFor,
          experience: experience || "",
          qualification: qualification || "",
          dateOfBirth: parsedDob || undefined,
          resume: isActualMediaFile(resumeUrl) ? resumeUrl : '',
          remark: remark || "",
          source,
          college: collegeId,
          leadStatus: statusDocument._id,
          leadSubstatus: subStatusDocument._id,
          logs: [
              {
                  action: `Lead added with ${statusDocument.title} and ${subStatusDocument.title} from ${source}`,
                  remarks: remark || "",
                  timestamp: new Date()
              }
          ]
      });

      const createdLead = await CareerApplication.findById(lead._id).populate(STATUS_POPULATE);
      console.log("[DigitalHRLead] Lead created →", { leadId: lead._id.toString(), mobile, applyingFor });

      return res.status(201).json({
          status: true,
          msg: "HR lead added successfully",
          data: {
              leadId: lead._id,
              lead: serializeLead(createdLead)
          }
      });
  } catch (err) {
      console.error("[DigitalHRLead] Error:", err);


      return res.status(500).json({
          status: false,
          msg: err.message || "Failed to add HR lead"
      });
  }
});
router.patch('/leads/:id', isCollege, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lead id' });
    }

    const lead = await CareerApplication.findOne({ _id: id, isDeleted: { $ne: true }, ...collegeScopeFilter(req.user?.college?._id) });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const updates = {};
    const logActions = [];

    if (typeof req.body.leadStatus !== 'undefined') {
      const statusId = toObjectId(req.body.leadStatus);
      if (!statusId) {
        return res.status(400).json({ success: false, message: 'Please select a valid status' });
      }

      const status = await StatusHr.findOne({ _id: statusId, isDeleted: { $ne: true } });
      if (!status) {
        return res.status(404).json({ success: false, message: 'Selected status no longer exists' });
      }

      let substatus = null;
      const substatusId = toObjectId(req.body.leadSubstatus);
      if (substatusId) {
        substatus = (status.substatuses || []).find((item) => String(item._id) === substatusId) || null;
        if (!substatus) {
          return res.status(400).json({ success: false, message: 'Selected sub-status does not belong to this status' });
        }
      } else if ((status.substatuses || []).length) {
        return res.status(400).json({ success: false, message: 'Please select a sub-status' });
      }

      if (substatus?.hasRemarks && !String(req.body.remark || '').trim()) {
        return res.status(400).json({ success: false, message: 'Remarks are mandatory for this sub-status' });
      }

      if (substatus?.hasFollowup) {
        const nextFollowup = req.body.followupDate ? new Date(req.body.followupDate) : null;
        if (!nextFollowup || Number.isNaN(nextFollowup.getTime())) {
          return res.status(400).json({ success: false, message: 'Followup date and time are mandatory for this sub-status' });
        }

        const followupType = req.body.followupType === 'Visit' ? 'Visit' : 'Call';
        (lead.followups || []).forEach((item) => {
          if (item.type === followupType && item.status === 'planned') {
            item.status = 'done';
            item.completedAt = new Date();
          }
        });
        lead.followups.push({
          type: followupType,
          followupDate: nextFollowup,
          remarks: String(req.body.remark || '').trim(),
          status: 'planned',
          createdBy: req.user?._id,
        });
        await lead.save();
        logActions.push(`${followupType} followup scheduled`);
      }

      if (String(lead.leadStatus || '') !== statusId) {
        logActions.push(`Status changed to ${status.title}`);
      }
      if (String(lead.leadSubstatus || '') !== String(substatus?._id || '')) {
        logActions.push(`Sub-status changed to ${substatus?.title || 'None'}`);
      }
      updates.leadStatus = statusId;
      updates.leadSubstatus = substatus?._id || null;
    }

    if (typeof req.body.remark === 'string' && req.body.remark !== lead.remark) {
      updates.remark = req.body.remark.trim();
      logActions.push('Remark updated');
    }

    if (typeof req.body.qualification === 'string' && req.body.qualification !== (lead.qualification || '')) {
      updates.qualification = req.body.qualification.trim();
      logActions.push('Qualification updated');
    }

    if (typeof req.body.dateOfBirth !== 'undefined') {
      const nextDob = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
      updates.dateOfBirth = nextDob && !Number.isNaN(nextDob.getTime()) ? nextDob : null;
      logActions.push('Date of birth updated');
    }

    if (typeof req.body.leadOwner !== 'undefined' || typeof req.body.assignedTo !== 'undefined') {
      const nextOwner = toObjectId(req.body.leadOwner ?? req.body.assignedTo);
      updates.leadOwner = nextOwner;
      updates.assignedTo = nextOwner;
      logActions.push('Lead owner updated');
    }

    if (typeof req.body.leadCoOwner !== 'undefined') {
      updates.leadCoOwner = toObjectId(req.body.leadCoOwner);
      logActions.push('Lead co-owner updated');
    }

    if (!Object.keys(updates).length) {
      return res.json({ success: true, message: 'No changes', data: serializeLead(lead) });
    }

    updates.$push = {
      logs: {
        $each: logActions.map((action) => ({
          user: req.user?._id,
          action,
          remarks: req.body.remark || '',
          timestamp: new Date(),
        })),
      },
    };

    const updated = await CareerApplication.findByIdAndUpdate(id, updates, { new: true })
      .populate('leadOwner', 'name email')
      .populate('leadCoOwner', 'name email')
      .populate('assignedTo', 'name email')
      .populate(STATUS_POPULATE);

    return res.json({
      success: true,
      message: 'Lead updated',
      data: serializeLead(updated),
    });
  } catch (error) {
    console.error('[HR leads] update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update HR lead' });
  }
});

router.post('/leads/:id/followup', isCollege, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lead id' });
    }

    const type = req.body.type === 'Visit' ? 'Visit' : 'Call';
    const followupDate = req.body.followupDate ? new Date(req.body.followupDate) : null;
    const remarks = String(req.body.remarks || '').trim();

    if (!followupDate || Number.isNaN(followupDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Please select a valid followup date and time' });
    }
    if (!remarks) {
      return res.status(400).json({ success: false, message: 'Remarks are mandatory for followup' });
    }

    const lead = await CareerApplication.findOne({ _id: id, isDeleted: { $ne: true }, ...collegeScopeFilter(req.user?.college?._id) });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    (lead.followups || []).forEach((item) => {
      if (item.type === type && item.status === 'planned') {
        item.status = 'done';
        item.completedAt = new Date();
      }
    });

    lead.followups.push({
      type,
      followupDate,
      remarks,
      status: 'planned',
      createdBy: req.user?._id,
    });
    lead.logs.push({
      user: req.user?._id,
      action: `${type} followup scheduled`,
      remarks,
      timestamp: new Date(),
    });
    await lead.save();

    const updated = await CareerApplication.findById(lead._id)
      .populate('leadOwner', 'name email')
      .populate('leadCoOwner', 'name email')
      .populate('assignedTo', 'name email')
      .populate(STATUS_POPULATE);

    return res.json({
      success: true,
      message: `${type} followup set successfully`,
      data: serializeLead(updated),
    });
  } catch (error) {
    console.error('[HR leads] followup error:', error);
    return res.status(500).json({ success: false, message: 'Failed to set followup' });
  }
});

router.post('/leads/:id/documents', isCollege, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lead id' });
    }

    const key = String(req.body.key || req.body.documentKey || '').trim();
    const docType = HR_DOCUMENT_TYPES.find((item) => item.key === key);
    if (!docType) {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }

    const file = req.files?.file || req.files?.document || req.files?.resume;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Please choose a file to upload' });
    }

    const lead = await CareerApplication.findOne({ _id: id, isDeleted: { $ne: true }, ...collegeScopeFilter(req.user?.college?._id) });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const uploadedKey = await uploadSinglefile(file);
    const fileUrl = resolvePublicUrl(uploadedKey) || uploadedKey;
    const nextDoc = {
      key: docType.key,
      name: docType.name,
      fileUrl,
      uploadedAt: new Date(),
    };

    const docs = Array.isArray(lead.documents) ? lead.documents.map((item) => item.toObject?.() || item) : [];
    const existingIndex = docs.findIndex((item) => item.key === docType.key);
    if (existingIndex >= 0) docs[existingIndex] = { ...docs[existingIndex], ...nextDoc };
    else docs.push(nextDoc);

    lead.documents = docs;
    if (docType.key === 'resume') lead.resume = fileUrl;
    lead.logs.push({
      user: req.user?._id,
      action: `${docType.name} uploaded`,
      remarks: '',
      timestamp: new Date(),
    });
    await lead.save();

    const updated = await CareerApplication.findById(lead._id)
      .populate('leadOwner', 'name email')
      .populate('leadCoOwner', 'name email')
      .populate('assignedTo', 'name email')
      .populate(STATUS_POPULATE);

    return res.json({
      success: true,
      message: `${docType.name} uploaded`,
      data: serializeLead(updated),
    });
  } catch (error) {
    console.error('[HR leads] document upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
});

module.exports = router;
