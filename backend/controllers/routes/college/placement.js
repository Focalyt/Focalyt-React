// routes/college/placementStatus.js
const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const { isCollege, auth1, authenti } = require("../../../helpers");

const PlacementStatus = require('../../models/PlacementStatus');
const Placement = require('../../models/Placement');

router.get('/', isCollege, async (req, res) => {
  try {
    const statuses = await PlacementStatus.find({ college: req.user.college._id }).sort({ index: 1 });

    return res.status(200).json({ 
      success: true, 
      message: 'Placement statuses fetched successfully', 
      data: statuses 
    });
  } catch (err) {
    console.error('Error fetching placement statuses:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

router.get('/status-count', isCollege, async (req, res) => {
  try {
    const college = req.user.college;

    const baseQuery = {
      college: college._id
    };

    // Get all PlacementStatus statuses for the college
    const statuses = await PlacementStatus.find({ college: college._id }).sort({ index: 1 });

    // Get total count
    const totalPlacements = await Placement.countDocuments(baseQuery);

    // Get count by status
    const statusCounts = await Promise.all(
      statuses.map(async (status) => {
        const count = await Placement.countDocuments({
          ...baseQuery,
          status: status._id
        });
        return {
          statusId: status._id,
          statusName: status.title,
          count: count
        };
      })
    );

    // Get count for placements without status (null status)
    const nullStatusCount = await Placement.countDocuments({
      ...baseQuery,
      status: null
    });

    if (nullStatusCount > 0) {
      statusCounts.push({
        statusId: null,
        statusName: 'No Status',
        count: nullStatusCount
      });
    }

    res.json({
      status: true,
      data: {
        statusCounts,
        totalLeads: totalPlacements,
        collegeId: college._id
      },
      message: 'Placement status counts retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting placement status counts:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to retrieve placement status counts',
      error: error.message
    });
  }
});

router.post('/add', isCollege, async (req, res) => {
  try {
    const { title, description, milestone } = req.body;
    const college = req.user.college;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const highestIndexStatus = await PlacementStatus.findOne({ college: college._id })
      .sort('-index')
      .exec();
    const newIndex = highestIndexStatus ? highestIndexStatus.index + 1 : 0;

    const newStatus = new PlacementStatus({
      title,
      description: description || '',
      milestone: milestone || '',
      index: newIndex,
      substatuses: [],
      college: college._id
    });

    const savedStatus = await newStatus.save();

    return res.status(201).json({ 
      success: true, 
      message: 'Placement status created successfully', 
      data: savedStatus 
    });
  } catch (err) {
    console.error('Error creating placement status:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

router.put('/edit/:id', isCollege, async (req, res) => {
  try {
    const { title, description, milestone } = req.body;

    
    const status = await PlacementStatus.findOne({
      _id: req.params.id,
      college: req.user.college._id
    });

    if (!status) {
      return res.status(404).json({ success: false, message: 'Placement status not found' });
    }

    // Update fields
    if (title !== undefined) status.title = title;
    if (description !== undefined) status.description = description;
    if (milestone !== undefined) status.milestone = milestone;

    const updatedStatus = await status.save();

    return res.status(200).json({
      success: true,
      message: 'Placement status updated successfully',
      data: updatedStatus
    });
  } catch (err) {
    console.error('Error updating placement status:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});


router.delete('/delete/:id', isCollege, async (req, res) => {
  try {
    // Find status and verify it belongs to the college
    const status = await PlacementStatus.findOne({
      _id: req.params.id,
      college: req.user.college._id
    });

    if (!status) {
      return res.status(404).json({ success: false, message: 'Placement status not found' });
    }

    await PlacementStatus.deleteOne({ _id: req.params.id });

    // Reindex remaining statuses for this college
    const remainingStatuses = await PlacementStatus.find({ college: req.user.college._id })
      .sort('index')
      .exec();

    for (let i = 0; i < remainingStatuses.length; i++) {
      remainingStatuses[i].index = i;
      await remainingStatuses[i].save();
    }

    return res.status(200).json({
      success: true,
      message: 'Placement status deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting placement status:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});


router.put('/reorder', isCollege, async (req, res) => {
  try {
    const { statusOrder } = req.body;

    if (!Array.isArray(statusOrder)) {
      return res.status(400).json({ success: false, message: 'Invalid statusOrder array' });
    }

    // Verify all statuses belong to the college
    const statusIds = statusOrder.map(item => item._id);
    const statuses = await PlacementStatus.find({
      _id: { $in: statusIds },
      college: req.user.college._id
    });

    if (statuses.length !== statusOrder.length) {
      return res.status(400).json({ success: false, message: 'Some statuses not found or belong to different college' });
    }

    // Update indices
    for (let i = 0; i < statusOrder.length; i++) {
      const { _id, index } = statusOrder[i];

      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ success: false, message: `Invalid status ID at position ${i}` });
      }

      await PlacementStatus.findByIdAndUpdate(_id, { index: index });
    }

    const updatedStatuses = await PlacementStatus.find({ college: req.user.college._id })
      .sort('index')
      .exec();

    return res.status(200).json({
      success: true,
      message: 'Placement status order updated successfully',
      data: updatedStatuses
    });
  } catch (error) {
    console.error('Error in reorder:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});


router.post('/:statusId/substatus', isCollege, async (req, res) => {
  try {
    const { title, description, hasRemarks, hasFollowup, hasAttachment } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Sub-status title is required' });
    }

    // Find status and verify it belongs to the college
    const status = await PlacementStatus.findOne({
      _id: req.params.statusId,
      college: req.user.college._id
    });

    if (!status) {
      return res.status(404).json({ success: false, message: 'Placement status not found' });
    }

    const newSubstatus = {
      title,
      description: description || '',
      hasRemarks: hasRemarks || false,
      hasFollowup: hasFollowup || false,
      hasAttachment: hasAttachment || false
    };

    status.substatuses.push(newSubstatus);
    const updatedStatus = await status.save();

    return res.status(201).json({ 
      success: true, 
      message: 'Sub-status created successfully', 
      data: updatedStatus 
    });
  } catch (err) {
    console.error('Error creating sub-status:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

router.get('/:statusId/substatus', isCollege, async (req, res) => {
  try {
    // Find status and verify it belongs to the college
    const status = await PlacementStatus.findOne({
      _id: req.params.statusId,
      college: req.user.college._id
    });

    if (!status) {
      return res.status(404).json({ success: false, message: 'Placement status not found' });
    }

    return res.status(200).json({ 
      success: true, 
      data: status.substatuses 
    });
  } catch (err) {
    console.error('Error fetching sub-statuses:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});


router.put('/:statusId/substatus/:substatusId', isCollege, async (req, res) => {
  try {
    const { title, description, hasRemarks, hasFollowup, hasAttachment } = req.body;

    // Find status and verify it belongs to the college
    const status = await PlacementStatus.findOne({
      _id: req.params.statusId,
      college: req.user.college._id
    });

    if (!status) {
      return res.status(404).json({ success: false, message: 'Placement status not found' });
    }

    // Find the substatus
    const substatus = status.substatuses.id(req.params.substatusId);

    if (!substatus) {
      return res.status(404).json({ success: false, message: 'Sub-status not found' });
    }

    // Update substatus
    if (title !== undefined) substatus.title = title;
    if (description !== undefined) substatus.description = description;
    if (hasRemarks !== undefined) substatus.hasRemarks = hasRemarks;
    if (hasFollowup !== undefined) substatus.hasFollowup = hasFollowup;
    if (hasAttachment !== undefined) substatus.hasAttachment = hasAttachment;

    const updatedStatus = await status.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Sub-status updated successfully', 
      data: updatedStatus 
    });
  } catch (err) {
    console.error('Error updating sub-status:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});


router.delete('/deleteSubStatus/:statusId/substatus/:substatusId', isCollege, async (req, res) => {
  try {
    // Find status and verify it belongs to the college
    const status = await PlacementStatus.findOne({
      _id: req.params.statusId,
      college: req.user.college._id
    });

    if (!status) {
      return res.status(404).json({ success: false, message: 'Placement status not found' });
    }

    // Find the substatus index
    const substatusIndex = status.substatuses.findIndex(
      sub => sub._id.toString() === req.params.substatusId
    );

    if (substatusIndex === -1) {
      return res.status(404).json({ success: false, message: 'Sub-status not found' });
    }

    // Remove the substatus
    status.substatuses.splice(substatusIndex, 1);
    await status.save();

    return res.status(200).json({
      success: true,
      message: 'Sub-status deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting sub-status:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});


router.get('/candidates', isCollege, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const college = req.user.college;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      college: college._id
    };

    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { employerName: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const placements = await Placement.find(query)
      .populate('status', 'title')
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPlacements = await Placement.countDocuments(query);
    const totalPages = Math.ceil(totalPlacements / parseInt(limit));

    return res.status(200).json({
      status: true,
      message: 'Placements fetched successfully',
      data: {
        placements,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPlacements,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('Error fetching placements:', err.message);
    res.status(500).json({
      status: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

router.post('/add-candidate', isCollege, async (req, res) => {
  try {
    const { companyName, employerName, contactNumber, dateOfJoining, location } = req.body;
    const college = req.user.college;
    const userId = req.user._id;

    const missingFields = [];
    if (!companyName) missingFields.push('companyName');
    if (!employerName) missingFields.push('employerName');
    if (!contactNumber) missingFields.push('contactNumber');
    if (!dateOfJoining) missingFields.push('dateOfJoining');
    if (!location) missingFields.push('location');

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Required fields missing: ${missingFields.join(', ')}`
      });
    }

    const cleanContactNumber = contactNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanContactNumber)) {
      return res.status(400).json({
        status: false,
        message: 'Please enter a valid 10-digit contact number'
      });
    }

    const newPlacement = new Placement({
      companyName: companyName.trim(),
      employerName: employerName.trim(),
      contactNumber: cleanContactNumber,
      dateOfJoining: new Date(dateOfJoining),
      location: location.trim(),
      college: college._id,
      addedBy: userId,
      logs: [{
        user: userId,
        action: 'Candidate added',
        remarks: `New candidate added: ${employerName} at ${companyName}`
      }]
    });

    const savedPlacement = await newPlacement.save();

    return res.status(201).json({
      status: true,
      message: 'Candidate added successfully',
      data: savedPlacement
    });
  } catch (err) {
    console.error('Error adding candidate:', err.message);
    

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        status: false,
        message: errors.join(', ')
      });
    }

    res.status(500).json({
      status: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

module.exports = router;

