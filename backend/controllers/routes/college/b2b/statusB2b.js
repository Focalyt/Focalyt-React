// server.js
const express = require("express");
const mongoose = require('mongoose');
const cors = require('cors');
const router = express.Router();
const { isCollege, auth1, authenti } = require("../../../../helpers");

// Status Model
const Status = require('../../../models/statusB2b');
const AppliedCourses = require('../../../models/appliedCourses');

// @route   GET api/statuses
// @desc    Get All Statuses
// @access  Public
router.get('/', isCollege, async (req, res) => {
 try {
    // Include both college-specific statuses and global statuses (college: null)
    const collegeId = req.user?.college?._id;
    
    // Build query to include both college-specific and global (null) statuses
    let query = {};
    if (collegeId) {
      query = {
        $or: [
          { college: collegeId },
          { college: null },
          { college: { $exists: false } } // Also include documents where college field doesn't exist
        ]
      };
    } else {
      query = {
        $or: [
          { college: null },
          { college: { $exists: false } }
        ]
      };
    }
    
    console.log('Fetching B2B statuses with query:', JSON.stringify(query));
    console.log('College ID:', collegeId);
    const statuses = await Status.find(query).sort({ index: 1 });
    console.log('Found statuses:', statuses.length);

    // For each status, get count of AppliedCourses with _leadStatus = status._id

    const statusesWithCount = await Promise.all(
      statuses.map(async (status) => {
        const count = await AppliedCourses.countDocuments({ _leadStatus: status._id, kycStage: { $nin: [true] },
			kyc: { $nin: [true] },
			admissionDone: { $nin: [true] } });
        return {
          _id: status._id,
          title: status.title,
          description: status.description,
          milestone: status.milestone,
          index: status.index,
          count,          // yaha count add kar diya
          substatuses: status.substatuses,
          createdAt: status.createdAt,
          updatedAt: status.updatedAt
        };
      })
    );

    return res.status(200).json({ success: true, message: 'Statuses fetched successfully', data: statusesWithCount });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/statuses
// @desc    Create A Status
// @access  Public
router.post('/add', isCollege, async (req, res) => {
  try {
    const { title, description, milestone } = req.body;
    const college = req.user.college;
    
    // Find the highest index to add new status at the end
    const highestIndexStatus = await Status.findOne().sort('-index');
    const newIndex = highestIndexStatus ? highestIndexStatus.index + 1 : 0;
    
    const newStatus = new Status({
      title,
      description,
      index: newIndex,
      milestone,
      substatuses: [],
      college: college._id
    });
    
    const data = await newStatus.save();
    
	return res.status(201).json({ success: true, message: 'Status created successfully', data: data });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/statuses/:id
// @desc    Update A Status
// @access  Public
router.put('/edit/:id', async (req, res) => {
  try {
    const { title, description,milestone } = req.body;
    
    // console.log('req.body',req.body)
    // Find status by id
    const status = await Status.findById(req.params.id);
    
    if (!status) {
      return res.status(404).json({ msg: 'Status not found' });
    }
    
    // Update fields
    status.title = title;
    status.description = description;
    status.milestone = milestone
    
    const data = await status.save();
    // console.log('data',data)
    return res.status(200).json({
        success: true,
        message: 'Status updated successfully',
        data: data,
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/statuses/:id
// @desc    Delete A Status
// @access  Public
router.delete('/delete/:id', async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) {
      return res.status(404).json({ msg: 'Status not found' });
    }
    
    await status.deleteOne();;
    
    // Reindex remaining statuses
    const remainingStatuses = await Status.find().sort('index');
    for (let i = 0; i < remainingStatuses.length; i++) {
      remainingStatuses[i].index = i;
      await remainingStatuses[i].save();
    }
    
    return res.status(200).json({
        success: true,
        message: 'Status deleted successfully'
        
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/statuses/reorder
// @desc    Reorder Statuses
// @access  Public
router.put('/reorder', async (req, res) => {
    try {
      const { statusOrder } = req.body;
  
      if (!Array.isArray(statusOrder)) {
        return res.status(400).json({ success: false, message: 'Invalid statusOrder array' });
      }
  
      for (let i = 0; i < statusOrder.length; i++) {
        const { _id, index } = statusOrder[i];
  
        if (!mongoose.Types.ObjectId.isValid(_id)) {
          return res.status(400).json({ success: false, message: `Invalid status ID at position ${i}` });
        }
  
        await Status.findByIdAndUpdate(_id, { index: index });
      }
  
      const updatedStatuses = await Status.find().sort('index');
  
      return res.status(200).json({
        success: true,
        message: 'Status order updated successfully',
        data: updatedStatuses,
      });
    } catch (error) {
      console.error('Error in reorder:', error.message);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  });
  

// @route   POST api/statuses/:statusId/substatus
// @desc    Add a substatus to a status
// @access  Public
router.post('/:statusId/substatus', async (req, res) => {
  try {
    const { title, description, hasRemarks, hasFollowup, hasAttachment } = req.body;
    
    const status = await Status.findById(req.params.statusId);
    
    if (!status) {
      return res.status(404).json({ msg: 'Status not found' });
    }
    
    const newSubstatus = {
      title,
      description,
      hasRemarks: hasRemarks || false,
      hasFollowup: hasFollowup || false,
      hasAttachment: hasAttachment || false
    };
    
    status.substatuses.push(newSubstatus);
    
    const data = await status.save();
    return res.status(201).json({ success: true, message: 'Sub status created successfully', data: data });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:statusId/substatus', async (req, res) => {
    try {
      const status = await Status.findById(req.params.statusId);
  
      if (!status) {
        return res.status(404).json({ msg: 'Status not found' });
      }
  
      return res.status(200).json({ success: true, data: status.substatuses });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  

// @route   PUT api/statuses/:statusId/substatus/:substatusId
// @desc    Update a substatus
// @access  Public
router.put('/:statusId/substatus/:substatusId', async (req, res) => {
  try {
    const { title, description, hasRemarks, hasFollowup, hasAttachment } = req.body;
    
    const status = await Status.findById(req.params.statusId);
    
    if (!status) {
      return res.status(404).json({ msg: 'Status not found' });
    }
    
    // Find the substatus
    const substatus = status.substatuses.id(req.params.substatusId);
    
    if (!substatus) {
      return res.status(404).json({ msg: 'Substatus not found' });
    }
    
    // Update substatus
    substatus.title = title;
    substatus.description = description;
    substatus.hasRemarks = hasRemarks;
    substatus.hasFollowup = hasFollowup;
    substatus.hasAttachment = hasAttachment;
    
    const data = await status.save();
    return res.status(201).json({ success: true, message: 'Sub status updated successfully', data: data });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/statuses/:statusId/substatus/:substatusId
// @desc    Delete a substatus
// @access  Public
router.delete('/deleteSubStatus/:statusId/substatus/:substatusId', async (req, res) => {
  try {
    const status = await Status.findById(req.params.statusId);
    
    if (!status) {
      return res.status(404).json({ msg: 'Status not found' });
    }
    
    // Find the substatus index
    const substatusIndex = status.substatuses.findIndex(
      sub => sub._id.toString() === req.params.substatusId
    );
    
    if (substatusIndex === -1) {
      return res.status(404).json({ msg: 'Substatus not found' });
    }
    
    // Remove the substatus
    status.substatuses.splice(substatusIndex, 1);
    
    await status.save();
    return res.status(200).json({
        success: true,
        message: 'Status deleted successfully'
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;