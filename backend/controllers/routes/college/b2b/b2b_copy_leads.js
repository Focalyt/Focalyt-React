/**
 * B2B Sales Copy only — list/filter leads + approval patch.
 * Uses LeadCopy / b2bleads_copy. Do not add this logic to b2b.js.
 */
const mongoose = require('mongoose');
const { getAllTeamMembers } = require('../../../../helpers');

const VALID_APPROVAL = ['Pending', 'Approved', 'Rejected'];
const VALID_LEAD_STATUS = ['hot', 'warm', 'cold', 'prospect', 'won'];

/**
 * @param {import('express').Router} router
 * @param {import('mongoose').Model} LeadCopy
 * @param {function} isCollege
 */
function mountCopyLeadRoutes(router, LeadCopy, isCollege) {
  /** Counts for Lead tab (not CRM pipeline cards): total + approval buckets */
  router.get('/leads/approval-summary', isCollege, async (req, res) => {
    try {
      const isAdmin = () => req.user.permissions?.permission_type === 'Admin';

      const base = {};
      if (!isAdmin()) {
        const teamMembers = await getAllTeamMembers(req.user._id);
        base.$or = teamMembers.flatMap((member) => [
          { leadAddedBy: member },
          { leadOwner: member },
        ]);
      }

      const total = await LeadCopy.countDocuments(base);
      const accepted = await LeadCopy.countDocuments({ ...base, approvalStatus: 'Approved' });
      const rejected = await LeadCopy.countDocuments({ ...base, approvalStatus: 'Rejected' });
      const pending = await LeadCopy.countDocuments({ ...base, approvalStatus: 'Pending' });

      return res.json({
        status: true,
        data: { total, accepted, rejected, pending },
        message: 'Approval summary retrieved successfully',
      });
    } catch (error) {
      console.error('[b2b_copy] GET /leads/approval-summary:', error);
      return res.status(500).json({
        status: false,
        message: 'Failed to retrieve approval summary',
        error: error.message,
      });
    }
  });

  /** Approved leads only, counts by add-time Lead Status (Performance tab — not CRM pipeline). */
  router.get('/leads/performance-summary', isCollege, async (req, res) => {
    try {
      const isAdmin = () => req.user.permissions?.permission_type === 'Admin';

      const base = {};
      if (!isAdmin()) {
        const teamMembers = await getAllTeamMembers(req.user._id);
        base.$or = teamMembers.flatMap((member) => [
          { leadAddedBy: member },
          { leadOwner: member },
        ]);
      }

      const approved = { ...base, approvalStatus: 'Approved' };
      const all = await LeadCopy.countDocuments(approved);
      const hot = await LeadCopy.countDocuments({ ...approved, leadStatus: 'hot' });
      const warm = await LeadCopy.countDocuments({ ...approved, leadStatus: 'warm' });
      const cold = await LeadCopy.countDocuments({ ...approved, leadStatus: 'cold' });
      const prospect = await LeadCopy.countDocuments({ ...approved, leadStatus: 'prospect' });
      const won = await LeadCopy.countDocuments({ ...approved, leadStatus: 'won' });

      return res.json({
        status: true,
        data: { all, hot, warm, cold, prospect, won },
        message: 'Performance summary retrieved successfully',
      });
    } catch (error) {
      console.error('[b2b_copy] GET /leads/performance-summary:', error);
      return res.status(500).json({
        status: false,
        message: 'Failed to retrieve performance summary',
        error: error.message,
      });
    }
  });


  router.get('/leads/submitter-report', isCollege, async (req, res) => {
    try {
      const {
        status,
        statusIn,
        leadCategory,
        typeOfB2B,
        search,
        subStatus,
        startDate,
        endDate,
        leadOwner,
        approvalStatus,
        leadStatus: leadStatusBucket,
        hasFollowUp,
      } = req.query;

      const isAdmin = () => req.user.permissions?.permission_type === 'Admin';

      let ownershipConditions = [];
      if (!isAdmin()) {
        const teamMembers = await getAllTeamMembers(req.user._id);
        ownershipConditions = teamMembers.map((member) => ({
          $or: [{ leadAddedBy: member }, { leadOwner: member }],
        }));
      }

      const searchConditions = search
        ? {
            $or: [
              { concernPersonName: { $regex: search, $options: 'i' } },
              { businessName: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { mobile: { $regex: search, $options: 'i' } },
            ],
          }
        : {};

      const convertToObjectId = (id) => {
        if (!id) return null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          return new mongoose.Types.ObjectId(id);
        }
        return id;
      };

      const approvalOk =
        approvalStatus && VALID_APPROVAL.includes(String(approvalStatus));
      const bucket =
        leadStatusBucket &&
        VALID_LEAD_STATUS.includes(String(leadStatusBucket).toLowerCase())
          ? String(leadStatusBucket).toLowerCase()
          : null;

      const finalQuery = {
        $and: [
          ...(ownershipConditions.length > 0
            ? [{ $or: ownershipConditions.flatMap((c) => c.$or) }]
            : []),
          ...(search ? [searchConditions] : []),
          ...(statusIn
            ? [
                {
                  status: {
                    $in: String(statusIn)
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((id) => convertToObjectId(id))
                      .filter(Boolean),
                  },
                },
              ]
            : []),
          ...(status && !statusIn ? [{ status: convertToObjectId(status) }] : []),
          ...(leadCategory ? [{ leadCategory: convertToObjectId(leadCategory) }] : []),
          ...(typeOfB2B ? [{ typeOfB2B: convertToObjectId(typeOfB2B) }] : []),
          ...(subStatus ? [{ subStatus: convertToObjectId(subStatus) }] : []),
          ...(String(hasFollowUp).toLowerCase() === 'true'
            ? [{ followUp: { $exists: true, $ne: null } }]
            : []),
          ...(startDate || endDate
            ? [
                {
                  createdAt: {
                    ...(startDate ? { $gte: new Date(startDate) } : {}),
                    ...(endDate ? { $lte: new Date(endDate) } : {}),
                  },
                },
              ]
            : []),
          ...(leadOwner
            ? [
                {
                  $or: [
                    { leadOwner: convertToObjectId(leadOwner) },
                    { leadAddedBy: convertToObjectId(leadOwner) },
                  ],
                },
              ]
            : []),
          ...(approvalOk ? [{ approvalStatus: String(approvalStatus) }] : []),
          ...(bucket ? [{ leadStatus: bucket }] : []),
          { leadAddedBy: { $exists: true, $ne: null } },
        ],
      };

      if (finalQuery.$and.length === 0) {
        delete finalQuery.$and;
      }

      const pipeline = [
        { $match: finalQuery },
        {
          $addFields: {
            isComplete: {
              $let: {
                vars: {
                  em: { $trim: { input: { $ifNull: ['$email', ''] } } },
                  mob: { $trim: { input: { $ifNull: ['$mobile', ''] } } },
                  bn: { $trim: { input: { $ifNull: ['$businessName', ''] } } },
                  cp: { $trim: { input: { $ifNull: ['$concernPersonName', ''] } } },
                  ad: { $trim: { input: { $ifNull: ['$address', ''] } } },
                  ct: { $trim: { input: { $ifNull: ['$city', ''] } } },
                  st: { $trim: { input: { $ifNull: ['$state', ''] } } },
                },
                in: {
                  $and: [
                    { $gt: [{ $strLenCP: '$$em' }, 0] },
                    { $gt: [{ $strLenCP: '$$mob' }, 0] },
                    { $gt: [{ $strLenCP: '$$bn' }, 0] },
                    { $gt: [{ $strLenCP: '$$cp' }, 0] },
                    {
                      $or: [
                        { $gt: [{ $strLenCP: '$$ad' }, 0] },
                        {
                          $and: [
                            { $gt: [{ $strLenCP: '$$ct' }, 0] },
                            { $gt: [{ $strLenCP: '$$st' }, 0] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $group: {
            _id: '$leadAddedBy',
            totalLeads: { $sum: 1 },
            completeLeads: { $sum: { $cond: ['$isComplete', 1, 0] } },
            pendingApproval: {
              $sum: { $cond: [{ $eq: ['$approvalStatus', 'Pending'] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ['$approvalStatus', 'Approved'] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$approvalStatus', 'Rejected'] }, 1, 0] },
            },
          },
        },
        {
          $addFields: {
            incompleteLeads: { $subtract: ['$totalLeads', '$completeLeads'] },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userDoc',
          },
        },
        { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: { $ifNull: ['$userDoc.name', ''] },
            email: { $ifNull: ['$userDoc.email', ''] },
            userMobile: '$userDoc.mobile',
            totalLeads: 1,
            completeLeads: 1,
            incompleteLeads: 1,
            pendingApproval: 1,
            approved: 1,
            rejected: 1,
          },
        },
        { $sort: { totalLeads: -1, name: 1 } },
      ];

      const rows = await LeadCopy.aggregate(pipeline);

      const summary = rows.reduce(
        (acc, r) => {
          acc.distinctSubmitters += 1;
          acc.totalLeads += r.totalLeads || 0;
          acc.completeLeads += r.completeLeads || 0;
          acc.incompleteLeads += r.incompleteLeads || 0;
          return acc;
        },
        {
          distinctSubmitters: 0,
          totalLeads: 0,
          completeLeads: 0,
          incompleteLeads: 0,
        }
      );

      return res.json({
        status: true,
        data: { rows, summary },
        message: 'Submitter report retrieved successfully',
      });
    } catch (error) {
      console.error('[b2b_copy] GET /leads/submitter-report:', error);
      return res.status(500).json({
        status: false,
        message: 'Failed to retrieve submitter report',
        error: error.message,
      });
    }
  });

  router.get('/leads/status-count', isCollege, async (req, res) => {
    try {
      const {
        leadCategory,
        typeOfB2B,
        search,
        subStatus,
        startDate,
        endDate,
        leadOwner,
        approvalStatus,
      } = req.query;

      const isAdmin = () => req.user.permissions?.permission_type === 'Admin';

      let ownershipConditions = [];
      if (!isAdmin()) {
        const teamMembers = await getAllTeamMembers(req.user._id);
        ownershipConditions = teamMembers.map((member) => ({
          $or: [{ leadAddedBy: member }, { leadOwner: member }],
        }));
      }

      const convertToObjectId = (id) => {
        if (!id) return null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          return new mongoose.Types.ObjectId(id);
        }
        return id;
      };

      const searchConditions = search
        ? {
            $or: [
              { concernPersonName: { $regex: search, $options: 'i' } },
              { businessName: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { mobile: { $regex: search, $options: 'i' } },
            ],
          }
        : {};

      const filterConditions = [];
      if (leadCategory) filterConditions.push({ leadCategory: convertToObjectId(leadCategory) });
      if (typeOfB2B) filterConditions.push({ typeOfB2B: convertToObjectId(typeOfB2B) });
      if (subStatus) filterConditions.push({ subStatus: convertToObjectId(subStatus) });
      if (startDate || endDate) {
        filterConditions.push({
          createdAt: {
            ...(startDate ? { $gte: new Date(startDate) } : {}),
            ...(endDate ? { $lte: new Date(endDate) } : {}),
          },
        });
      }
      if (leadOwner) {
        filterConditions.push({
          $or: [
            { leadOwner: convertToObjectId(leadOwner) },
            { leadAddedBy: convertToObjectId(leadOwner) },
          ],
        });
      }
      const approvalOk = approvalStatus && VALID_APPROVAL.includes(String(approvalStatus));
      if (approvalOk) filterConditions.push({ approvalStatus: String(approvalStatus) });

      const baseQuery = {
        $and: [
          ...(ownershipConditions.length > 0 ? [{ $or: ownershipConditions.flatMap((c) => c.$or || [c]) }] : []),
          ...(search ? [searchConditions] : []),
          ...filterConditions,
        ],
      };

      if (baseQuery.$and.length === 0) {
        delete baseQuery.$and;
      }

      const StatusB2b = require('../../../models/statusB2b');
      const College = require('../../../models/college');

      const college = await College.findOne({
        '_concernPerson._id': req.user._id,
      });

      if (!college) {
        return res.status(400).json({
          status: false,
          message: 'College not found for this user',
        });
      }

      const statuses = await StatusB2b.find({ college: college._id }).sort({ index: 1 });

      const totalLeads = await LeadCopy.countDocuments(baseQuery);

      const statusCounts = await Promise.all(
        statuses.map(async (status) => {
          const count = await LeadCopy.countDocuments({
            ...baseQuery,
            status: status._id,
          });
          return {
            statusId: status._id,
            statusName: status.title,
            count,
          };
        })
      );

      const nullStatusCount = await LeadCopy.countDocuments({
        ...baseQuery,
        status: null,
      });

      if (nullStatusCount > 0) {
        statusCounts.push({
          statusId: null,
          statusName: 'No Status',
          count: nullStatusCount,
        });
      }

      return res.json({
        status: true,
        data: {
          statusCounts,
          totalLeads,
          collegeId: college._id,
        },
        message: 'Lead status counts retrieved successfully',
      });
    } catch (error) {
      console.error('[b2b_copy] GET /leads/status-count:', error);
      return res.status(500).json({
        status: false,
        message: 'Failed to retrieve lead status counts',
        error: error.message,
      });
    }
  });

  router.get('/leads', isCollege, async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        statusIn,
        leadCategory,
        typeOfB2B,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        subStatus,
        startDate,
        endDate,
        leadOwner,
        approvalStatus,
        leadStatus: leadStatusBucket,
        hasFollowUp,
      } = req.query;

      const isAdmin = () => req.user.permissions?.permission_type === 'Admin';

      let ownershipConditions = [];
      if (!isAdmin()) {
        const teamMembers = await getAllTeamMembers(req.user._id);
        ownershipConditions = teamMembers.map((member) => ({
          $or: [{ leadAddedBy: member }, { leadOwner: member }],
        }));
      }

      const searchConditions = search
        ? {
            $or: [
              { concernPersonName: { $regex: search, $options: 'i' } },
              { businessName: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { mobile: { $regex: search, $options: 'i' } },
            ],
          }
        : {};

      const convertToObjectId = (id) => {
        if (!id) return null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          return new mongoose.Types.ObjectId(id);
        }
        return id;
      };

      const approvalOk =
        approvalStatus && VALID_APPROVAL.includes(String(approvalStatus));
      const bucket =
        leadStatusBucket &&
        VALID_LEAD_STATUS.includes(String(leadStatusBucket).toLowerCase())
          ? String(leadStatusBucket).toLowerCase()
          : null;

      const finalQuery = {
        $and: [
          ...(ownershipConditions.length > 0
            ? [{ $or: ownershipConditions.flatMap((c) => c.$or) }]
            : []),
          ...(search ? [searchConditions] : []),
          ...(statusIn
            ? [
                {
                  status: {
                    $in: String(statusIn)
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((id) => convertToObjectId(id))
                      .filter(Boolean),
                  },
                },
              ]
            : []),
          ...(status && !statusIn ? [{ status: convertToObjectId(status) }] : []),
          ...(leadCategory ? [{ leadCategory: convertToObjectId(leadCategory) }] : []),
          ...(typeOfB2B ? [{ typeOfB2B: convertToObjectId(typeOfB2B) }] : []),
          ...(subStatus ? [{ subStatus: convertToObjectId(subStatus) }] : []),
          ...(String(hasFollowUp).toLowerCase() === 'true'
            ? [{ followUp: { $exists: true, $ne: null } }]
            : []),
          ...(startDate || endDate
            ? [
                {
                  createdAt: {
                    ...(startDate ? { $gte: new Date(startDate) } : {}),
                    ...(endDate ? { $lte: new Date(endDate) } : {}),
                  },
                },
              ]
            : []),
          ...(leadOwner
            ? [
                {
                  $or: [
                    { leadOwner: convertToObjectId(leadOwner) },
                    { leadAddedBy: convertToObjectId(leadOwner) },
                  ],
                },
              ]
            : []),
          ...(approvalOk ? [{ approvalStatus: String(approvalStatus) }] : []),
          ...(bucket ? [{ leadStatus: bucket }] : []),
        ],
      };

      if (finalQuery.$and.length === 0) {
        delete finalQuery.$and;
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;
      const totalLeads = await LeadCopy.countDocuments(finalQuery);
      const totalPages = Math.ceil(totalLeads / limit) || 1;

      const leads = await LeadCopy.find(finalQuery)
        .populate('leadCategory', 'name')
        .populate('typeOfB2B', 'name')
        .populate('status', 'name title substatuses')
        .populate('followUp', 'followUpType scheduledDate status')
        .populate('leadAddedBy', 'name email')
        .populate('leadOwner', 'name email')
        .populate('documents.reviewedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit));

      const seenIds = new Set();
      const uniqueLeads = leads.filter((doc) => {
        const id = doc?._id != null ? String(doc._id) : '';
        if (!id) return true;
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      });

      return res.json({
        status: true,
        data: {
          leads: uniqueLeads,
          pagination: {
            currentPage: parseInt(page, 10),
            totalPages,
            totalLeads,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
        message: 'Leads retrieved successfully',
      });
    } catch (error) {
      console.error('[b2b_copy] GET /leads:', error);
      return res.status(500).json({
        status: false,
        message: 'Failed to retrieve leads',
        error: error.message,
      });
    }
  });

  router.patch('/leads/:id/approval', isCollege, async (req, res) => {
    try {
      const { decision } = req.body;
      if (!['Approved', 'Rejected'].includes(decision)) {
        return res.status(400).json({
          status: false,
          message: 'decision must be Approved or Rejected',
        });
      }

      const lead = await LeadCopy.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({ status: false, message: 'Lead not found' });
      }

      const isAdmin = req.user.permissions?.permission_type === 'Admin';
      const teamMembers = isAdmin ? [] : await getAllTeamMembers(req.user._id);
      const uid = String(req.user._id);
      const addedBy = lead.leadAddedBy ? String(lead.leadAddedBy) : '';
      const owner = lead.leadOwner ? String(lead.leadOwner) : '';
      const inTeam =
        isAdmin ||
        teamMembers.some((m) => String(m) === addedBy || String(m) === owner);

      if (!inTeam) {
        return res.status(403).json({ status: false, message: 'Forbidden' });
      }

      lead.approvalStatus = decision;
      lead.approvedBy = req.user._id;
      lead.approvedAt = new Date();
      await lead.save();

      return res.json({
        status: true,
        data: lead,
        message: `Lead ${decision.toLowerCase()} successfully`,
      });
    } catch (error) {
      console.error('[b2b_copy] PATCH /leads/:id/approval:', error);
      return res.status(500).json({
        status: false,
        message: 'Failed to update approval',
        error: error.message,
      });
    }
  });

  const populateLeadCopyForResponse = (query) =>
    query
      .populate('leadCategory', 'name')
      .populate('typeOfB2B', 'name')
      .populate('status', 'name title substatuses')
      .populate('followUp', 'followUpType scheduledDate status')
      .populate('leadAddedBy', 'name email')
      .populate('leadOwner', 'name email')
      .populate('documents.reviewedBy', 'name email');

  const canAccessLeadCopy = async (lead, req) => {
    const isAdmin = req.user.permissions?.permission_type === 'Admin';
    if (isAdmin) return true;
    const teamMembers = await getAllTeamMembers(req.user._id);
    const addedBy = lead.leadAddedBy ? String(lead.leadAddedBy) : '';
    const owner = lead.leadOwner ? String(lead.leadOwner) : '';
    return teamMembers.some((m) => String(m) === addedBy || String(m) === owner);
  };

  /** Add a document row (client provides file URL after upload or external link) */
  router.post('/leads/:id/documents', isCollege, async (req, res) => {
    try {
      const { name, fileUrl } = req.body || {};
      if (!name || !String(name).trim() || !fileUrl || !String(fileUrl).trim()) {
        return res.status(400).json({
          status: false,
          message: 'name and fileUrl are required',
        });
      }

      const lead = await LeadCopy.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({ status: false, message: 'Lead not found' });
      }

      if (!(await canAccessLeadCopy(lead, req))) {
        return res.status(403).json({ status: false, message: 'Forbidden' });
      }

      if (!lead.documents) {
        lead.documents = [];
      }
      lead.documents.push({
        name: String(name).trim(),
        fileUrl: String(fileUrl).trim(),
        approvalStatus: 'Pending',
        uploadedAt: new Date(),
      });
      await lead.save();

      const fresh = await populateLeadCopyForResponse(LeadCopy.findById(lead._id));

      return res.status(201).json({
        status: true,
        data: fresh,
        message: 'Document added',
      });
    } catch (error) {
      console.error('[b2b_copy] POST /leads/:id/documents:', error);
      return res.status(500).json({
        status: false,
        message: 'Failed to add document',
        error: error.message,
      });
    }
  });

  /** Approve or reject one document on a lead */
  router.patch('/leads/:id/documents/:docId/approval', isCollege, async (req, res) => {
    try {
      const { decision } = req.body || {};
      if (!['Approved', 'Rejected'].includes(decision)) {
        return res.status(400).json({
          status: false,
          message: 'decision must be Approved or Rejected',
        });
      }

      const lead = await LeadCopy.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({ status: false, message: 'Lead not found' });
      }

      if (!(await canAccessLeadCopy(lead, req))) {
        return res.status(403).json({ status: false, message: 'Forbidden' });
      }

      const doc = lead.documents.id(req.params.docId);
      if (!doc) {
        return res.status(404).json({ status: false, message: 'Document not found' });
      }

      doc.approvalStatus = decision;
      doc.reviewedAt = new Date();
      doc.reviewedBy = req.user._id;
      await lead.save();

      const fresh = await populateLeadCopyForResponse(LeadCopy.findById(lead._id));

      return res.json({
        status: true,
        data: fresh,
        message: `Document ${decision.toLowerCase()}`,
      });
    } catch (error) {
      console.error('[b2b_copy] PATCH /leads/:id/documents/:docId/approval:', error);
      return res.status(500).json({
        status: false,
        message: 'Failed to update document approval',
        error: error.message,
      });
    }
  });
}

module.exports = { mountCopyLeadRoutes };
