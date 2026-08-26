const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { isCollege } = require('../../../helpers');

const StatusHr = require('../../models/statusHr');
const CareerApplication = require('../../models/careerApplication');

const collegeScope = (req) => {
  const collegeId = req.user?.college?._id;
  const scope = [{ college: null }, { college: { $exists: false } }];
  if (collegeId) scope.unshift({ college: collegeId });
  return { isDeleted: { $ne: true }, $or: scope };
};

const reindexStatuses = async () => {
  const remaining = await StatusHr.find({ isDeleted: { $ne: true } }).sort('index');
  for (let i = 0; i < remaining.length; i += 1) {
    if (remaining[i].index !== i) {
      remaining[i].index = i;
      await remaining[i].save();
    }
  }
};

// @route   GET /college/statusHr
// @desc    List HR statuses with lead counts
router.get('/', isCollege, async (req, res) => {
  try {
    const statuses = await StatusHr.find(collegeScope(req)).sort({ index: 1 });

    const statusesWithCount = await Promise.all(
      statuses.map(async (status) => {
        const count = await CareerApplication.countDocuments({
          leadStatus: status._id,
          isDeleted: { $ne: true },
          ...(req.user?.college?._id
            ? {
                $or: [
                  { college: req.user.college._id },
                  { college: null },
                  { college: { $exists: false } },
                ],
              }
            : {}),
        });
        return {
          _id: status._id,
          title: status.title,
          description: status.description,
          milestone: status.milestone,
          index: status.index,
          count,
          substatuses: status.substatuses,
          createdAt: status.createdAt,
          updatedAt: status.updatedAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'HR statuses fetched successfully',
      data: statusesWithCount,
    });
  } catch (err) {
    console.error('[HR status] list error:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /college/statusHr/add
// @desc    Create an HR status
router.post('/add', isCollege, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ success: false, message: 'Status title is required' });
    }

    const highestIndexStatus = await StatusHr.findOne({ isDeleted: { $ne: true } }).sort('-index');
    const newIndex = highestIndexStatus ? highestIndexStatus.index + 1 : 0;

    const newStatus = new StatusHr({
      title,
      description: req.body.description,
      milestone: req.body.milestone,
      index: newIndex,
      substatuses: [],
      college: req.user?.college?._id || null,
    });

    const data = await newStatus.save();
    return res.status(201).json({ success: true, message: 'Status created successfully', data });
  } catch (err) {
    console.error('[HR status] create error:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT /college/statusHr/reorder
// @desc    Reorder HR statuses
router.put('/reorder', isCollege, async (req, res) => {
  try {
    const { statusOrder } = req.body;
    if (!Array.isArray(statusOrder)) {
      return res.status(400).json({ success: false, message: 'Invalid statusOrder array' });
    }

    for (let i = 0; i < statusOrder.length; i += 1) {
      const { _id, index } = statusOrder[i];
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ success: false, message: `Invalid status ID at position ${i}` });
      }
      await StatusHr.findByIdAndUpdate(_id, { index, updatedAt: new Date() });
    }

    const updatedStatuses = await StatusHr.find({ isDeleted: { $ne: true } }).sort('index');
    return res.status(200).json({
      success: true,
      message: 'Status order updated successfully',
      data: updatedStatuses,
    });
  } catch (err) {
    console.error('[HR status] reorder error:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT /college/statusHr/edit/:id
// @desc    Update an HR status
router.put('/edit/:id', isCollege, async (req, res) => {
  try {
    const status = await StatusHr.findById(req.params.id);
    if (!status || status.isDeleted) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }

    const title = String(req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ success: false, message: 'Status title is required' });
    }

    status.title = title;
    status.description = req.body.description;
    status.milestone = req.body.milestone;

    const data = await status.save();
    return res.status(200).json({ success: true, message: 'Status updated successfully', data });
  } catch (err) {
    console.error('[HR status] update error:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE /college/statusHr/delete/:id
// @desc    Delete an HR status
router.delete('/delete/:id', isCollege, async (req, res) => {
  try {
    const status = await StatusHr.findById(req.params.id);
    if (!status || status.isDeleted) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }

    const inUse = await CareerApplication.countDocuments({
      leadStatus: status._id,
      isDeleted: { $ne: true },
    });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: `This status is used by ${inUse} lead(s). Move those leads first.`,
      });
    }

    await status.deleteOne();
    await reindexStatuses();

    return res.status(200).json({ success: true, message: 'Status deleted successfully' });
  } catch (err) {
    console.error('[HR status] delete error:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /college/statusHr/:statusId/substatus
// @desc    List substatuses of a status
router.get('/:statusId/substatus', isCollege, async (req, res) => {
  try {
    const status = await StatusHr.findById(req.params.statusId);
    if (!status || status.isDeleted) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }
    return res.status(200).json({ success: true, data: status.substatuses });
  } catch (err) {
    console.error('[HR status] substatus list error:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /college/statusHr/:statusId/substatus
// @desc    Add a substatus
router.post('/:statusId/substatus', isCollege, async (req, res) => {
  try {
    const status = await StatusHr.findById(req.params.statusId);
    if (!status || status.isDeleted) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }

    const title = String(req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ success: false, message: 'Sub-status title is required' });
    }

    status.substatuses.push({
      title,
      description: req.body.description,
      hasRemarks: req.body.hasRemarks || false,
      hasFollowup: req.body.hasFollowup || false,
      hasAttachment: req.body.hasAttachment || false,
    });

    const data = await status.save();
    return res.status(201).json({ success: true, message: 'Sub status created successfully', data });
  } catch (err) {
    console.error('[HR status] substatus create error:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT /college/statusHr/:statusId/substatus/:substatusId
// @desc    Update a substatus
router.put('/:statusId/substatus/:substatusId', isCollege, async (req, res) => {
  try {
    const status = await StatusHr.findById(req.params.statusId);
    if (!status || status.isDeleted) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }

    const substatus = status.substatuses.id(req.params.substatusId);
    if (!substatus) {
      return res.status(404).json({ success: false, message: 'Substatus not found' });
    }

    const title = String(req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ success: false, message: 'Sub-status title is required' });
    }

    substatus.title = title;
    substatus.description = req.body.description;
    substatus.hasRemarks = req.body.hasRemarks;
    substatus.hasFollowup = req.body.hasFollowup;
    substatus.hasAttachment = req.body.hasAttachment;

    const data = await status.save();
    return res.status(200).json({ success: true, message: 'Sub status updated successfully', data });
  } catch (err) {
    console.error('[HR status] substatus update error:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE /college/statusHr/deleteSubStatus/:statusId/substatus/:substatusId
// @desc    Delete a substatus
router.delete('/deleteSubStatus/:statusId/substatus/:substatusId', isCollege, async (req, res) => {
  try {
    const status = await StatusHr.findById(req.params.statusId);
    if (!status || status.isDeleted) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }

    const substatusIndex = status.substatuses.findIndex(
      (sub) => sub._id.toString() === req.params.substatusId
    );
    if (substatusIndex === -1) {
      return res.status(404).json({ success: false, message: 'Substatus not found' });
    }

    const substatusId = status.substatuses[substatusIndex]._id;
    const inUse = await CareerApplication.countDocuments({
      leadSubstatus: substatusId,
      isDeleted: { $ne: true },
    });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: `This sub-status is used by ${inUse} lead(s). Move those leads first.`,
      });
    }

    status.substatuses.splice(substatusIndex, 1);
    await status.save();

    return res.status(200).json({ success: true, message: 'Sub status deleted successfully' });
  } catch (err) {
    console.error('[HR status] substatus delete error:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
