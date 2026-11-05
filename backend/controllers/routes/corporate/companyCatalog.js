const express = require('express');
const mongoose = require('mongoose');
const { isCompany } = require('../../../helpers');
const { Company, AppliedJobs } = require('../../models');
const CompanyStatus = require('../../models/companyStatus');
const CompanyMilestone = require('../../models/companyMilestone');

const router = express.Router();

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function loadCompany(req) {
  const userId = req.companyUser || req.session?.user?._id;
  if (!userId) return null;
  return Company.findOne({ _concernPerson: userId }).select('_id name');
}

function cleanText(value, max) {
  return String(value || '').trim().slice(0, max);
}

async function nextIndex(Model, companyId) {
  const latest = await Model.findOne({ company: companyId }).sort('-index').select('index').lean();
  return latest ? Number(latest.index) + 1 : 0;
}

router.get('/milestone', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company) return res.redirect('/company/login');
    const milestones = await CompanyMilestone.find({ company: company._id }).sort({ index: 1, createdAt: 1 }).lean();
    return res.render(`${req.vPath}/app/corporate/milestone`, {
      menu: 'milestone',
      company,
      milestones,
      notice: req.query.notice || '',
      error: req.query.error || '',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});

router.post('/milestone', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company) return res.redirect('/company/login');
    const title = cleanText(req.body.title, 80);
    const description = cleanText(req.body.description, 300);
    if (!title) return res.redirect('/company/milestone?error=Milestone name is required');
    const duplicate = await CompanyMilestone.findOne({
      company: company._id,
      title: new RegExp(`^${escapeRegex(title)}$`, 'i'),
    }).select('_id');
    if (duplicate) return res.redirect('/company/milestone?error=A milestone with this name already exists');
    await CompanyMilestone.create({
      title,
      description,
      index: await nextIndex(CompanyMilestone, company._id),
      company: company._id,
    });
    return res.redirect('/company/milestone?notice=Milestone created');
  } catch (error) {
    console.error(error);
    return res.redirect('/company/milestone?error=Unable to create milestone');
  }
});

router.post('/milestone/:id', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company || !mongoose.Types.ObjectId.isValid(req.params.id)) return res.redirect('/company/milestone?error=Milestone not found');
    const title = cleanText(req.body.title, 80);
    const description = cleanText(req.body.description, 300);
    if (!title) return res.redirect('/company/milestone?error=Milestone name is required');
    const duplicate = await CompanyMilestone.findOne({
      company: company._id,
      _id: { $ne: req.params.id },
      title: new RegExp(`^${escapeRegex(title)}$`, 'i'),
    }).select('_id');
    if (duplicate) return res.redirect('/company/milestone?error=A milestone with this name already exists');
    const milestone = await CompanyMilestone.findOne({ _id: req.params.id, company: company._id });
    if (!milestone) return res.redirect('/company/milestone?error=Milestone not found');
    milestone.title = title;
    milestone.description = description;
    await milestone.save();
    return res.redirect('/company/milestone?notice=Milestone updated');
  } catch (error) {
    console.error(error);
    return res.redirect('/company/milestone?error=Unable to update milestone');
  }
});

router.post('/milestone/:id/delete', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company || !mongoose.Types.ObjectId.isValid(req.params.id)) return res.redirect('/company/milestone?error=Milestone not found');
    const removed = await CompanyMilestone.findOneAndDelete({ _id: req.params.id, company: company._id });
    if (!removed) return res.redirect('/company/milestone?error=Milestone not found');
    await CompanyStatus.updateMany({ company: company._id, milestone: req.params.id }, { $set: { milestone: null } });
    return res.redirect('/company/milestone?notice=Milestone deleted');
  } catch (error) {
    console.error(error);
    return res.redirect('/company/milestone?error=Unable to delete milestone');
  }
});

router.get('/status', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company) return res.redirect('/company/login');
    const [statuses, milestones] = await Promise.all([
      CompanyStatus.find({ company: company._id }).populate('milestone', 'title').sort({ index: 1, createdAt: 1 }).lean(),
      CompanyMilestone.find({ company: company._id }).sort({ index: 1, title: 1 }).select('title').lean(),
    ]);
    return res.render(`${req.vPath}/app/corporate/status`, {
      menu: 'status',
      company,
      statuses,
      milestones,
      notice: req.query.notice || '',
      error: req.query.error || '',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});

router.post('/status', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company) return res.redirect('/company/login');
    const title = cleanText(req.body.title, 80);
    const description = cleanText(req.body.description, 300);
    const milestoneId = mongoose.Types.ObjectId.isValid(req.body.milestone) ? req.body.milestone : null;
    if (!title) return res.redirect('/company/status?error=Status name is required');
    const duplicate = await CompanyStatus.findOne({
      company: company._id,
      title: new RegExp(`^${escapeRegex(title)}$`, 'i'),
    }).select('_id');
    if (duplicate) return res.redirect('/company/status?error=A status with this name already exists');
    if (milestoneId) {
      const milestone = await CompanyMilestone.findOne({ _id: milestoneId, company: company._id }).select('_id');
      if (!milestone) return res.redirect('/company/status?error=Choose a milestone from your list');
    }
    await CompanyStatus.create({
      title,
      description,
      milestone: milestoneId,
      index: await nextIndex(CompanyStatus, company._id),
      company: company._id,
    });
    return res.redirect('/company/status?notice=Status created');
  } catch (error) {
    console.error(error);
    return res.redirect('/company/status?error=Unable to create status');
  }
});

router.post('/status/:id', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company || !mongoose.Types.ObjectId.isValid(req.params.id)) return res.redirect('/company/status?error=Status not found');
    const title = cleanText(req.body.title, 80);
    const description = cleanText(req.body.description, 300);
    const milestoneId = mongoose.Types.ObjectId.isValid(req.body.milestone) ? req.body.milestone : null;
    if (!title) return res.redirect('/company/status?error=Status name is required');
    const duplicate = await CompanyStatus.findOne({
      company: company._id,
      _id: { $ne: req.params.id },
      title: new RegExp(`^${escapeRegex(title)}$`, 'i'),
    }).select('_id');
    if (duplicate) return res.redirect('/company/status?error=A status with this name already exists');
    if (milestoneId) {
      const milestone = await CompanyMilestone.findOne({ _id: milestoneId, company: company._id }).select('_id');
      if (!milestone) return res.redirect('/company/status?error=Choose a milestone from your list');
    }
    const status = await CompanyStatus.findOne({ _id: req.params.id, company: company._id });
    if (!status) return res.redirect('/company/status?error=Status not found');
    status.title = title;
    status.description = description;
    status.milestone = milestoneId;
    await status.save();
    return res.redirect('/company/status?notice=Status updated');
  } catch (error) {
    console.error(error);
    return res.redirect('/company/status?error=Unable to update status');
  }
});

router.post('/status/:id/move', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company || !mongoose.Types.ObjectId.isValid(req.params.id)) return res.redirect('/company/status?error=Status not found');
    const statuses = await CompanyStatus.find({ company: company._id }).sort({ index: 1, createdAt: 1 });
    const currentIndex = statuses.findIndex((item) => String(item._id) === String(req.params.id));
    const swapIndex = req.body.direction === 'right' ? currentIndex + 1 : currentIndex - 1;
    if (currentIndex < 0 || swapIndex < 0 || swapIndex >= statuses.length) return res.redirect('/company/status');
    const [moved] = statuses.splice(currentIndex, 1);
    statuses.splice(swapIndex, 0, moved);
    await Promise.all(statuses.map((item, position) => {
      item.index = position;
      return item.save();
    }));
    return res.redirect('/company/status');
  } catch (error) {
    console.error(error);
    return res.redirect('/company/status?error=Unable to move status');
  }
});

router.post('/status/:id/substatus', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company || !mongoose.Types.ObjectId.isValid(req.params.id)) return res.redirect('/company/status?error=Status not found');
    const title = cleanText(req.body.title, 80);
    const description = cleanText(req.body.description, 300);
    if (!title) return res.redirect('/company/status?error=Substatus name is required');
    const status = await CompanyStatus.findOne({ _id: req.params.id, company: company._id });
    if (!status) return res.redirect('/company/status?error=Status not found');
    status.substatuses.push({
      title,
      description,
      hasRemarks: req.body.hasRemarks === 'on',
      hasFollowup: req.body.hasFollowup === 'on',
      hasAttachment: req.body.hasAttachment === 'on',
    });
    await status.save();
    return res.redirect('/company/status?notice=Substatus added');
  } catch (error) {
    console.error(error);
    return res.redirect('/company/status?error=Unable to add substatus');
  }
});

router.post('/status/:id/substatus/:subId', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company || !mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.subId)) {
      return res.redirect('/company/status?error=Substatus not found');
    }
    const title = cleanText(req.body.title, 80);
    const description = cleanText(req.body.description, 300);
    if (!title) return res.redirect('/company/status?error=Substatus name is required');
    const status = await CompanyStatus.findOne({ _id: req.params.id, company: company._id });
    const substatus = status && status.substatuses.id(req.params.subId);
    if (!substatus) return res.redirect('/company/status?error=Substatus not found');
    substatus.title = title;
    substatus.description = description;
    substatus.hasRemarks = req.body.hasRemarks === 'on';
    substatus.hasFollowup = req.body.hasFollowup === 'on';
    substatus.hasAttachment = req.body.hasAttachment === 'on';
    await status.save();
    return res.redirect('/company/status?notice=Substatus updated');
  } catch (error) {
    console.error(error);
    return res.redirect('/company/status?error=Unable to update substatus');
  }
});

router.post('/status/:id/substatus/:subId/delete', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company || !mongoose.Types.ObjectId.isValid(req.params.id)) return res.redirect('/company/status?error=Substatus not found');
    const status = await CompanyStatus.findOne({ _id: req.params.id, company: company._id });
    const substatus = status && status.substatuses.id(req.params.subId);
    if (!substatus) return res.redirect('/company/status?error=Substatus not found');
    substatus.deleteOne();
    await status.save();
    return res.redirect('/company/status?notice=Substatus deleted');
  } catch (error) {
    console.error(error);
    return res.redirect('/company/status?error=Unable to delete substatus');
  }
});

router.post('/status/:id/delete', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company || !mongoose.Types.ObjectId.isValid(req.params.id)) return res.redirect('/company/status?error=Status not found');
    const removed = await CompanyStatus.findOneAndDelete({ _id: req.params.id, company: company._id });
    if (!removed) return res.redirect('/company/status?error=Status not found');
    return res.redirect('/company/status?notice=Status deleted');
  } catch (error) {
    console.error(error);
    return res.redirect('/company/status?error=Unable to delete status');
  }
});

router.get('/lead-statuses', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company) return res.status(401).json({ message: 'Please sign in again.' });
    const rows = await CompanyStatus.find({ company: company._id }).sort({ index: 1, createdAt: 1 }).select('title substatuses').lean();
    return res.json({
      statuses: rows.map((status) => ({
        _id: String(status._id),
        title: status.title,
        substatuses: (status.substatuses || []).map((item) => ({
          _id: String(item._id),
          title: item.title,
          hasRemarks: !!item.hasRemarks,
          hasFollowup: !!item.hasFollowup,
        })),
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to load statuses.' });
  }
});

router.post('/application/:id/lead-status', isCompany, async (req, res) => {
  try {
    const company = await loadCompany(req);
    if (!company || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    const statusId = String(req.body.statusId || '');
    const subStatusId = String(req.body.subStatusId || '');
    if (!mongoose.Types.ObjectId.isValid(statusId)) return res.status(400).json({ message: 'Please select a status.' });
    const status = await CompanyStatus.findOne({ _id: statusId, company: company._id });
    if (!status) return res.status(404).json({ message: 'Selected status no longer exists.' });
    const substatus = subStatusId ? status.substatuses.id(subStatusId) : null;
    if (subStatusId && !substatus) return res.status(400).json({ message: 'Selected sub-status does not belong to this status.' });
    if (!substatus && status.substatuses.length) return res.status(400).json({ message: 'Please select a sub-status.' });
    const remark = cleanText(req.body.remark, 2000);
    if (substatus && substatus.hasRemarks && !remark) return res.status(400).json({ message: 'Remarks are mandatory for this sub-status.' });
    const application = await AppliedJobs.findOne({ _id: req.params.id, _company: company._id, isDeleted: { $ne: true } });
    if (!application) return res.status(404).json({ message: 'Application not found.' });
    if (substatus && substatus.hasFollowup) {
      const followupDate = req.body.followupDate ? new Date(req.body.followupDate) : null;
      if (!followupDate || Number.isNaN(followupDate.getTime()) || followupDate <= new Date()) {
        return res.status(400).json({ message: 'Choose a future follow-up date and time for this sub-status.' });
      }
      const followupType = req.body.followupType === 'Visit' ? 'Visit' : 'Call';
      application.companyFollowups.push({
        type: followupType,
        followupDate,
        remarks: remark,
        status: 'planned',
        createdBy: req.companyUser,
      });
    }
    if (remark) application.remark = remark;
    application.leadStatus = status._id;
    application.leadSubstatus = substatus ? substatus._id : null;
    application.logs.push({
      user: req.companyUser,
      action: `Status changed to ${status.title}${substatus ? ' / ' + substatus.title : ''}`,
      remarks: remark,
    });
    await application.save();
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update status.' });
  }
});

module.exports = router;
