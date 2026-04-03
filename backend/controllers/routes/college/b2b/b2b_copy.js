const express = require('express');
const mongoose = require('mongoose');
const { isCollege } = require('../../../../helpers');

const { createB2BRouter } = require('./b2b');
const LeadCopy = require('../../../models/b2b/lead_copy');
const StatusB2b = require('../../../models/statusB2b');
const User = require('../../../models/users');
const { mountCopyLeadRoutes } = require('./b2b_copy_leads');

const router = express.Router();

// Override only the Add Lead endpoint for copy flow.
router.post('/add-lead', isCollege, async (req, res) => {
  try {
    const {
      leadCategory,
      typeOfB2B,
      businessName,
      address,
      city,
      state,
      block,
      coordinates,
      concernPersonName,
      designation,
      email,
      mobile,
      whatsapp,
      leadOwner,
      leadStatus,
      lockLeadDays,
      remark,
      landlineNumber,
    } = req.body;

    const days = lockLeadDays != null && lockLeadDays !== '' ? Number(lockLeadDays) : NaN;
    const requiredFields = [leadCategory, typeOfB2B, businessName, concernPersonName, mobile, leadStatus];
    if (!Number.isFinite(days) || days < 1 || days > 60) {
      return res.status(400).json({
        status: false,
        message: 'lockLeadDays is required and must be between 1 and 60',
      });
    }
    const missingFields = requiredFields.filter((f) => !f);
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Required fields missing: ${missingFields.join(', ')}`,
      });
    }

    // Check if email already exists
    const existingLead = await LeadCopy.findOne({
      email,
      leadAddedBy: req.user._id,
    });
    if (existingLead) {
      return res.status(400).json({
        status: false,
        message: 'Lead with this email already exists',
      });
    }

    // Handle leadOwner (accept id or name)
    let leadOwnerId = null;
    if (leadOwner && String(leadOwner).trim()) {
      const ownerName = String(leadOwner).trim();
      let owner = null;
      if (mongoose.Types.ObjectId.isValid(ownerName)) {
        owner = await User.findById(ownerName);
      }
      if (!owner) {
        owner = await User.findOne({
          name: { $regex: new RegExp(`^${ownerName}$`, 'i') },
        });
      }
      if (owner) leadOwnerId = owner._id;
    }

    // Find default "Untouch Leads" status (same logic)
    const College = require('../../../models/college');
    const college = await College.findOne({ '_concernPerson._id': req.user._id });

    let defaultStatusId = null;
    let defaultSubStatusId = null;
    if (college) {
      const untouchStatus = await StatusB2b.findOne({
        college: college._id,
        title: { $regex: /^Untouch Leads$/i },
      });
      if (untouchStatus) {
        defaultStatusId = untouchStatus._id;
        if (untouchStatus.substatuses && untouchStatus.substatuses.length > 0) {
          const untouchSubStatus = untouchStatus.substatuses.find((sub) => sub.title && /^Untouch Leads$/i.test(sub.title));
          defaultSubStatusId = untouchSubStatus?._id || untouchStatus.substatuses[0]._id;
        }
      }
    }

    const leadData = {
      leadCategory,
      typeOfB2B,
      businessName,
      address,
      city,
      state,
      block,
      coordinates,
      concernPersonName,
      designation,
      email,
      mobile,
      whatsapp,
      leadAddedBy: req.user._id,
      remark,
      landlineNumber,
      leadStatus,
      lockLeadDays: days,
      approvalStatus: 'Pending',
    };

    if (defaultStatusId) {
      leadData.status = defaultStatusId;
      if (defaultSubStatusId) leadData.subStatus = defaultSubStatusId;
    }

    if (leadOwnerId) {
      leadData.leadOwner = leadOwnerId;
    }

    // Lock flow: assign submitter as lead owner when lock duration is set (e.g. 60 days)
    if (days >= 1 && days <= 60) {
      leadData.leadOwner = req.user._id;
    }

    const newLead = new LeadCopy(leadData);
    const savedLead = await newLead.save();
    if (!savedLead) {
      return res.status(400).json({ status: false, message: 'Failed to create lead' });
    }

    const statusMessage = defaultStatusId ? 'Untouch Leads' : 'default status';
    savedLead.logs.push({
      user: req.user._id,
      timestamp: new Date(),
      action: `Lead submitted for approval with ${statusMessage}`,
      remarks: remark || `Lead created with ${statusMessage}`,
    });
    await savedLead.save();

    return res.status(201).json({
      status: true,
      data: savedLead,
      message: 'Lead created successfully',
    });
  } catch (error) {
    console.error('Error creating lead (copy):', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to create lead',
      error: error.message,
    });
  }
});

// Copy-only: GET /leads (filters: approvalStatus, leadStatus bucket) + PATCH approval — must run before generic B2B router.
mountCopyLeadRoutes(router, LeadCopy, isCollege);

// Same B2B routes but all Lead operations use `b2bleads_copy` (LeadCopy model).
router.use(createB2BRouter(LeadCopy));

module.exports = router;

