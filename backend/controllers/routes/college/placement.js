// routes/college/placementStatus.js
const express = require("express");
const mongoose = require('mongoose');
const moment = require('moment');
const router = express.Router();
const { isCollege, auth1, authenti } = require("../../../helpers");

const PlacementStatus = require('../../models/PlacementStatus');
const Placement = require('../../models/Placement');
const AppliedCourses = require('../../models/appliedCourses');
const { Vacancy, Company, City, State, Qualification, Industry, Skill, JobCategory, JobOffer } = require('../../models');

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

    // Get all PlacementStatus statuses for the college
    const statuses = await PlacementStatus.find({ college: college._id }).sort({ index: 1 });

    // Get total count from AppliedCourses where movetoplacementstatus is true
    const totalPlacementsPipeline = [
      {
        $match: {
          movetoplacementstatus: true
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_course',
          foreignField: '_id',
          as: '_course'
        }
      },
      {
        $unwind: {
          path: '$_course',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          '_course.college': new mongoose.Types.ObjectId(college._id)
        }
      },
      {
        $count: 'total'
      }
    ];

    const totalResult = await AppliedCourses.aggregate(totalPlacementsPipeline);
    const totalPlacements = totalResult[0]?.total || 0;

    const statusCounts = await Promise.all(
      statuses.map(async (status) => {
        const countPipeline = [
          {
            $match: {
              movetoplacementstatus: true
            }
          },
          {
            $lookup: {
              from: 'courses',
              localField: '_course',
              foreignField: '_id',
              as: '_course'
            }
          },
          {
            $unwind: {
              path: '$_course',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              '_course.college': new mongoose.Types.ObjectId(college._id)
            }
          },
          {
            $lookup: {
              from: 'placements',
              localField: '_id',
              foreignField: 'appliedCourse',
              as: 'placementRecord'
            }
          },
          {
            $match: {
              'placementRecord.status': new mongoose.Types.ObjectId(status._id)
            }
          },
          {
            $count: 'total'
          }
        ];

        const result = await AppliedCourses.aggregate(countPipeline);
        const count = result[0]?.total || 0;

        return {
          statusId: status._id,
          statusName: status.title,
          count: count
        };
      })
    );

    // Count AppliedCourses without a Placement record or with null status (No Status)
    const nullStatusPipeline = [
      {
        $match: {
          movetoplacementstatus: true
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_course',
          foreignField: '_id',
          as: '_course'
        }
      },
      {
        $unwind: {
          path: '$_course',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          '_course.college': new mongoose.Types.ObjectId(college._id)
        }
      },
      {
        $lookup: {
          from: 'placements',
          localField: '_id',
          foreignField: 'appliedCourse',
          as: 'placementRecord'
        }
      },
      {
        $match: {
          $or: [
            { 'placementRecord.0': { $exists: false } },
            { 'placementRecord.status': null }
          ]
        }
      },
      {
        $count: 'total'
      }
    ];

    const nullStatusResult = await AppliedCourses.aggregate(nullStatusPipeline);
    const nullStatusCount = nullStatusResult[0]?.total || 0;

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
    const { page = 1, limit = 10, status, search, placementStatus, placementStartDate, placementEndDate } = req.query;
    const college = req.user.college;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query for AppliedCourses where movetoplacementstatus is true
    const appliedCoursesQuery = {
      movetoplacementstatus: true
    };

    // Filter by college through course
    const aggregationPipeline = [
      {
        $match: {
          movetoplacementstatus: true
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_course',
          foreignField: '_id',
          as: '_course',
          pipeline: [
            {
              $lookup: {
                from: 'coursesectors',
                localField: 'sectors',
                foreignField: '_id',
                as: 'sectors'
              }
            },
            {
              $lookup: {
                from: 'projects',
                localField: 'project',
                foreignField: '_id',
                as: 'project'
              }
            },
            {
              $unwind: {
                path: '$project',
                preserveNullAndEmptyArrays: true
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$_course',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          '_course.college': new mongoose.Types.ObjectId(college._id)
        }
      }
    ];

    // Add search filter
    if (search) {
      aggregationPipeline.push({
        $lookup: {
          from: 'candidateprofiles',
          localField: '_candidate',
          foreignField: '_id',
          as: '_candidate'
        }
      });
      aggregationPipeline.push({
        $unwind: {
          path: '$_candidate',
          preserveNullAndEmptyArrays: true
        }
      });
      const searchRegex = new RegExp(search, 'i');
      aggregationPipeline.push({
        $match: {
          $or: [
            { '_candidate.name': searchRegex },
            { '_candidate.email': searchRegex },
            { '_candidate.mobile': searchRegex }
          ]
        }
      });
    } else {
      // Always populate candidate for response
      aggregationPipeline.push({
        $lookup: {
          from: 'candidateprofiles',
          localField: '_candidate',
          foreignField: '_id',
          as: '_candidate'
        }
      });
      aggregationPipeline.push({
        $unwind: {
          path: '$_candidate',
          preserveNullAndEmptyArrays: true
        }
      });
    }

    // Lookup Center details
    aggregationPipeline.push({
      $lookup: {
        from: 'centers',
        localField: '_center',
        foreignField: '_id',
        as: '_center'
      }
    });
    aggregationPipeline.push({
      $unwind: {
        path: '$_center',
        preserveNullAndEmptyArrays: true
      }
    });

    // Lookup Counsellor details
    aggregationPipeline.push({
      $lookup: {
        from: 'users',
        localField: 'counsellor',
        foreignField: '_id',
        as: 'counsellor'
      }
    });
    aggregationPipeline.push({
      $unwind: {
        path: '$counsellor',
        preserveNullAndEmptyArrays: true
      }
    });
  
    aggregationPipeline.push({
      $lookup: {
        from: 'users',
        localField: 'registeredBy',
        foreignField: '_id',
        as: 'registeredBy'
      }
    });
    aggregationPipeline.push({
      $unwind: {
        path: '$registeredBy',
        preserveNullAndEmptyArrays: true
      }
    });

    aggregationPipeline.push({
      $lookup: {
        from: 'placements',
        localField: '_id',
        foreignField: 'appliedCourse',
        as: 'placementRecord'
      }
    });

    aggregationPipeline.push({
      $lookup: {
        from: 'placementstatuses',
        localField: 'placementRecord.status',
        foreignField: '_id',
        as: 'placementStatuses'
      }
    });


    aggregationPipeline.push({
      $lookup: {
        from: 'joboffers',
        localField: 'placementRecord._id',
        foreignField: 'placement',
        as: 'jobOffers'
      }
    });

    if (placementStatus) {
      aggregationPipeline.push({
        $match: {
          'placementRecord.status': new mongoose.Types.ObjectId(placementStatus)
        }
      });
    }

    if (placementStartDate || placementEndDate) {
      const dateMatch = {};
      if (placementStartDate) {
        dateMatch.$gte = new Date(placementStartDate);
      }
      if (placementEndDate) {
        dateMatch.$lte = new Date(placementEndDate);
      }
      aggregationPipeline.push({
        $match: {
          'placementRecord.createdAt': dateMatch
        }
      });
    }

    const countPipeline = [...aggregationPipeline, { $count: 'total' }];
    const countResult = await AppliedCourses.aggregate(countPipeline);
    const totalPlacements = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalPlacements / parseInt(limit));

    aggregationPipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const appliedCourses = await AppliedCourses.aggregate(aggregationPipeline);

    const placements = appliedCourses.map(appliedCourse => {
      const placementRecord = appliedCourse.placementRecord?.[0] || null;
      const statusDoc = placementRecord && appliedCourse.placementStatuses?.find(
        s => s._id.toString() === placementRecord.status?.toString()
      );

      return {
        _id: placementRecord?._id || appliedCourse._id, 
        _candidate: appliedCourse._candidate ? {
          _id: appliedCourse._candidate._id,
          name: appliedCourse._candidate.name,
          email: appliedCourse._candidate.email,
          mobile: appliedCourse._candidate.mobile,
          personalInfo: appliedCourse._candidate.personalInfo || {},
          sex: appliedCourse._candidate.sex,
          dob: appliedCourse._candidate.dob
        } : null,
        _student: appliedCourse._candidate ? {
          _id: appliedCourse._candidate._id,
          name: appliedCourse._candidate.name,
          email: appliedCourse._candidate.email,
          mobile: appliedCourse._candidate.mobile,
          personalInfo: appliedCourse._candidate.personalInfo || {},
          sex: appliedCourse._candidate.sex,
          dob: appliedCourse._candidate.dob
        } : null,
        status: statusDoc ? {
          _id: statusDoc._id,
          title: statusDoc.title,
          substatuses: statusDoc.substatuses || []
        } : null,
        subStatus: placementRecord?.subStatus || null,
        appliedCourseId: appliedCourse._id,
        placementId: placementRecord?._id || null,
        
        companyName: placementRecord?.companyName || null,
        employerName: placementRecord?.employerName || null,
        contactNumber: placementRecord?.contactNumber || null,
        dateOfJoining: placementRecord?.dateOfJoining || null,
        location: placementRecord?.location || null,
        remark: placementRecord?.remark || appliedCourse.remarks || null,
        remarks: placementRecord?.remark || appliedCourse.remarks || null,
        _course: appliedCourse._course ? {
          _id: appliedCourse._course._id,
          name: appliedCourse._course.name,
          sectors: appliedCourse._course.sectors ? appliedCourse._course.sectors.map(s => s.name || s).join(', ') : null,
          project: appliedCourse._course.project ? {
            _id: appliedCourse._course.project._id,
            name: appliedCourse._course.project.name
          } : null
        } : null,
        sector: appliedCourse._course?.sectors && Array.isArray(appliedCourse._course.sectors) && appliedCourse._course.sectors.length > 0
          ? appliedCourse._course.sectors.map(s => {
              if (s && typeof s === 'object' && s.name) {
                return s.name;
              } else if (typeof s === 'string') {
                return s;
              } else {
                return null;
              }
            }).filter(Boolean).join(', ') || null
          : null,
        projectName: appliedCourse._course?.project?.name || null,
        _center: appliedCourse._center || null,
        counsellor: appliedCourse.counsellor || null,
        leadAssignment: appliedCourse.leadAssignment || [],
        followup: appliedCourse.followupDate ? { followupDate: appliedCourse.followupDate } : null,
        followupDate: appliedCourse.followupDate || null,
        registeredBy: appliedCourse.registeredBy || null,
        addedBy: placementRecord?.addedBy || appliedCourse.registeredBy || null,
        updatedBy: placementRecord?.updatedBy || null,
        logs: placementRecord?.logs || appliedCourse.logs || [],
        createdAt: appliedCourse.createdAt,
        updatedAt: appliedCourse.updatedAt || placementRecord?.updatedAt,
        // Job offers with candidate response
        jobOffers: appliedCourse.jobOffers ? appliedCourse.jobOffers.map(offer => ({
          _id: offer._id,
          _job: offer._job,
          title: offer.title,
          candidateResponse: offer.candidateResponse,
          respondedAt: offer.respondedAt,
          status: offer.status
        })) : []
      };
    });

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
    if (!dateOfJoining) missingFields.push('dateOfJoining');
    if (!location) missingFields.push('location');

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Required fields missing: ${missingFields.join(', ')}`
      });
    }

    let cleanContactNumber = '';
    if (contactNumber && contactNumber.trim() !== '') {
      cleanContactNumber = contactNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanContactNumber)) {
      return res.status(400).json({
        status: false,
        message: 'Please enter a valid 10-digit contact number'
      });
      }
    }

    const newPlacement = new Placement({
      companyName: companyName.trim(),
      employerName: employerName ? employerName.trim() : '',
      contactNumber: cleanContactNumber || '',
      dateOfJoining: new Date(dateOfJoining),
      location: location.trim(),
      college: college._id,
      addedBy: userId,
      logs: [{
        user: userId,
        action: 'Candidate added',
        remarks: `New candidate added: ${employerName || 'N/A'} at ${companyName}`
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

router.put('/update-status/:id', isCollege, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      subStatus,
      remarks,
      followup,
      companyName,
      employerName,
      contactNumber,
      dateOfJoining,
      location,
      appliedCourseId: appliedCourseid
    } = req.body;

    const userId = req.user._id;
    const collegeId = req.user.college._id;

    
    let placement = null;
    let appliedCourse = null;
    let appliedCourseId = appliedCourseid;

    placement = await Placement.findById(id);
    
    if (placement) {
      appliedCourseId = placement.appliedCourse;
      
    if (placement.college.toString() !== collegeId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this placement' });
      }
      
      appliedCourse = await AppliedCourses.findById(appliedCourseId)
        .populate({
          path: '_course',
          select: 'college'
        });
    } else {
      appliedCourse = await AppliedCourses.findById(id)
        .populate({
          path: '_course',
          select: 'college'
        });

      if (!appliedCourse) {
        return res.status(404).json({ success: false, message: 'Applied course not found' });
      }

      if (appliedCourse._course && appliedCourse._course.college.toString() !== collegeId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this placement' });
      }

      placement = await Placement.findOne({ appliedCourse: id });
    }

    if (!placement) {
      const CandidateProfile = mongoose.model('CandidateProfile');
      const candidate = await CandidateProfile.findById(appliedCourse._candidate).select('name mobile').lean();

   
      const placementCompanyName = companyName ? String(companyName).trim() : (candidate?.name || 'Not Set');
      const placementEmployerName = employerName ? String(employerName).trim() : (candidate?.name || '');
      let placementContactNumber = contactNumber ? String(contactNumber) : (candidate?.mobile ? String(candidate.mobile) : '');
      

      if (placementContactNumber && placementContactNumber.trim() !== '') {
        placementContactNumber = placementContactNumber.replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(placementContactNumber)) {
          placementContactNumber = '';
        }
      } else {
        placementContactNumber = '';
      }

      placement = new Placement({
        companyName: placementCompanyName,
        employerName: placementEmployerName,
        contactNumber: placementContactNumber,
        dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
        location: location || 'Not Set',
        college: collegeId,
        appliedCourse: appliedCourseId,
        addedBy: userId,
        logs: [{
          user: userId,
          action: 'Placement record created from AppliedCourse',
          remarks: `Placement record created for student: ${candidate?.name || 'Unknown'}`
        }]
      });
    } else {
      if (companyName) placement.companyName = String(companyName).trim();
      if (employerName !== undefined) {
        placement.employerName = employerName ? String(employerName).trim() : '';
      }
      if (contactNumber !== undefined) {
        if (contactNumber && String(contactNumber).trim() !== '') {
          const cleanNumber = String(contactNumber).replace(/\D/g, '');
          if (/^[6-9]\d{9}$/.test(cleanNumber)) {
            placement.contactNumber = cleanNumber;
          } else {
            placement.contactNumber = '';
          }
        } else {
          placement.contactNumber = '';
        }
      }
      if (dateOfJoining) placement.dateOfJoining = new Date(dateOfJoining);
      if (location) placement.location = String(location).trim();
    }

    let actionParts = [];

    const oldStatusDoc = placement.status ? await PlacementStatus.findById(placement.status).lean() : null;
    const oldStatusTitle = oldStatusDoc ? oldStatusDoc.title : 'No Status';
    let oldSubStatusTitle = 'No Sub-Status';
    if (oldStatusDoc && placement.subStatus) {
      const oldSubStatus = oldStatusDoc.substatuses?.find(s => s._id.toString() === placement.subStatus.toString());
      oldSubStatusTitle = oldSubStatus ? oldSubStatus.title : 'No Sub-Status';
    }

    let newStatusTitle = 'No Status';
    let newSubStatusTitle = 'No Sub-Status';
    if (status) {
      const newStatusDoc = await PlacementStatus.findById(status).lean();
      newStatusTitle = newStatusDoc ? newStatusDoc.title : 'Unknown';
      if (newStatusDoc && subStatus) {
        const newSubStatus = newStatusDoc.substatuses?.find(s => s._id.toString() === subStatus);
        newSubStatusTitle = newSubStatus ? newSubStatus.title : 'No Sub-Status';
      }
    }

    if (status && (!placement.status || placement.status.toString() !== status)) {
      actionParts.push(`Status changed from "${oldStatusTitle}" to "${newStatusTitle}"`);
      placement.status = status;
    }

    if (subStatus && (!placement.subStatus || placement.subStatus.toString() !== subStatus)) {
      actionParts.push(`Sub-status changed from "${oldSubStatusTitle}" to "${newSubStatusTitle}"`);
      placement.subStatus = subStatus;
    }

    if (remarks !== undefined && placement.remark !== remarks) {
      if (placement.remark && remarks) {
        actionParts.push(`Remarks updated`);
      } else if (remarks) {
        actionParts.push(`Remarks added`);
      }
      placement.remark = remarks;
    }

    if (actionParts.length === 0) {
      actionParts.push('No changes made to status');
    }

    const newLogEntry = {
      user: userId,
      action: actionParts.join('; '),
      remarks: remarks || '',
      timestamp: new Date()
    };

    if (!placement.logs) {
      placement.logs = [];
    }
    placement.logs.push(newLogEntry);

    placement.updatedBy = userId;

    const updatedPlacement = await placement.save();

    return res.status(200).json({
      success: true,
      message: 'Placement status updated successfully',
      data: updatedPlacement
    });
  } catch (err) {
    console.error('Error updating placement status:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

router.get('/company-jobs', isCollege, async (req, res) => {
  try {
    const { companyName } = req.query;
    const college = req.user.college;
    
    const populate = [
      {
        path: '_company',
        select: "name logo stateId cityId displayCompanyName"
      },
      {
        path: "_industry",
        select: "name",
      },
      {
        path: "_jobCategory",
        select: "name",
      },
      {
        path: "_courses",
        select: "name"
      },
      {
        path: "_qualification",
        select: ["name"],
      },
      {
        path: "state"
      },
      {
        path: "city",
        select: "name",
      }
    ];

    let filter = { 
      status: true, 
      _company: { $ne: null },
      validity: { $gte: moment().utcOffset('+05:30') },
      verified: true
    };

    if (companyName && companyName.trim() !== '') {
      const searchName = companyName.trim();
      // console.log('Searching for company:', searchName);

      let company = await Company.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${searchName}$`, 'i') } },
          { displayCompanyName: { $regex: new RegExp(`^${searchName}$`, 'i') } },
          { name: { $regex: new RegExp(searchName, 'i') } },
          { displayCompanyName: { $regex: new RegExp(searchName, 'i') } }
        ],
        isDeleted: false,
        status: true
      });

      if (!company) {
        company = await Company.findOne({
          $or: [
            { name: { $regex: new RegExp(searchName.replace(/\s+/g, '.*'), 'i') } },
            { displayCompanyName: { $regex: new RegExp(searchName.replace(/\s+/g, '.*'), 'i') } }
          ],
          isDeleted: false,
          status: true
        });
      }

      if (company) {
        // console.log('Company found:', company.name, company._id);
        filter._company = company._id;
      } else {
        console.log('No company found for:', searchName, '- showing all jobs');
      }
    } else {
      console.log('No company name provided - showing all jobs');
    }

    const jobs = await Vacancy.find(filter)
      .populate(populate)
      .sort({ sequence: 1, createdAt: -1 })
      .lean();

    // console.log('Total active jobs found:', jobs.length);
    const jobsData = jobs.map(job => {
      const jobData = {
        ...job,
        displayCompanyName: job.displayCompanyName || job._company?.displayCompanyName || job._company?.name || 'N/A'
      };
      return jobData;
    });

    // console.log('Jobs data prepared:', jobsData.length);
    // console.log('job data:', jobsData.length > 0 ? JSON.stringify(jobsData[0], null, 2) : 'No jobs');

    return res.status(200).json({
      success: true,
      message: 'Company jobs fetched successfully',
      jobs: jobsData
    });
  } catch (err) {
    console.error('Error fetching company jobs:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

router.get('/:id/logs', isCollege, async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.college._id;
    const placement = await Placement.findById(id)
      .select('logs status subStatus')
      .populate({
        path: 'logs.user',
        select: 'name email role'
      })
      .populate({
        path: 'status',
        select: 'title'
      })
      .lean();

    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }

    const fullPlacement = await Placement.findById(id).lean();
    if (fullPlacement.college.toString() !== collegeId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this placement' });
    }
    let currentStatusTitle = 'No Status';
    let currentSubStatusTitle = 'No Sub-Status';
    
    if (placement.status) {
      currentStatusTitle = placement.status.title || 'Unknown';
      
      if (placement.subStatus) {
        const statusDoc = await PlacementStatus.findById(placement.status._id).lean();
        if (statusDoc && statusDoc.substatuses) {
          const subStatus = statusDoc.substatuses.find(s => s._id.toString() === placement.subStatus.toString());
          if (subStatus) {
            currentSubStatusTitle = subStatus.title || 'Unknown';
          }
        }
      }
    }

    const logsWithStatus = placement.logs.map(log => {
      let logStatus = null;
      let logSubStatus = null;
      
      if (log.action && typeof log.action === 'string') {
        const statusMatch = log.action.match(/Status changed from "([^"]+)" to "([^"]+)"/);
        const subStatusMatch = log.action.match(/Sub-status changed from "([^"]+)" to "([^"]+)"/);
        
        if (statusMatch) {
          logStatus = {
            from: statusMatch[1],
            to: statusMatch[2]
          };
        }
        
        if (subStatusMatch) {
          logSubStatus = {
            from: subStatusMatch[1],
            to: subStatusMatch[2]
          };
        }
      }

      return {
        _id: log._id,
        action: log.action,
        remarks: log.remarks,
        timestamp: log.timestamp,
        user: log.user,
        currentStatus: currentStatusTitle,
        currentSubStatus: currentSubStatusTitle,
        statusChange: logStatus,
        subStatusChange: logSubStatus
      };
    });

    logsWithStatus.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    return res.status(200).json({ 
      success: true, 
      data: logsWithStatus,
      currentStatus: currentStatusTitle,
      currentSubStatus: currentSubStatusTitle
    });

  } catch (err) {
    console.error('Error fetching placement logs:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: err.message 
    });
  }
});


router.get('/job-form-options', isCollege, async (req, res) => {
  try {
    const { stateId } = req.query;
    
    let cityQuery = { status: true };
    if (stateId) {
      const state = await State.findById(stateId);
      if (state && state.stateId) {
        // Match cities by stateId string
        cityQuery.stateId = state.stateId;
      }
    }
    
    const [qualifications, industries, cities, states, jobCategories] = await Promise.all([
      Qualification.find({ status: true }).select('name').sort({ name: 1 }),
      Industry.find({ status: true }).select('name').sort({ name: 1 }),
      City.find(cityQuery).select('name stateId').sort({ name: 1 }),
      State.find({ status: true }).select('name stateId').sort({ name: 1 }),
      JobCategory.find({ status: true }).select('name').sort({ name: 1 })
    ]);

    return res.status(200).json({
      success: true,
      qualifications,
      industries,
      cities,
      states,
      categories: jobCategories
    });
  } catch (err) {
    console.error('Error fetching job form options:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});


router.get('/job-offers', isCollege, async (req, res) => {
  try {
    const college = req.user.college;
    const { companyName } = req.query;

    const filter = {
      college: college._id,
      isActive: true
    };

    if (companyName && companyName.trim() !== '') {
      const searchName = companyName.trim();
      // console.log('Searching for company in job offers:', searchName);

      let company = await Company.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${searchName}$`, 'i') } },
          { displayCompanyName: { $regex: new RegExp(`^${searchName}$`, 'i') } },
          { name: { $regex: new RegExp(searchName, 'i') } },
          { displayCompanyName: { $regex: new RegExp(searchName, 'i') } }
        ],
        isDeleted: false,
        status: true
      });

      if (!company) {
        company = await Company.findOne({
          $or: [
            { name: { $regex: new RegExp(searchName.replace(/\s+/g, '.*'), 'i') } },
            { displayCompanyName: { $regex: new RegExp(searchName.replace(/\s+/g, '.*'), 'i') } }
          ],
          isDeleted: false,
          status: true
        });
      }

      if (company) {
        // console.log('Company found for job offers:', company.name, company._id);
        filter._company = company._id;
      } else {
        filter.$or = [
          { companyName: { $regex: new RegExp(searchName, 'i') } },
          { displayCompanyName: { $regex: new RegExp(searchName, 'i') } }
        ];
        console.log('Company not found, filtering by companyName field:', searchName);
      }
    }

    const offers = await JobOffer.find(filter)
      .populate([
        { path: '_company', select: 'name displayCompanyName' },
        { path: '_job', select: 'title' },
        { path: '_qualification', select: 'name' },
        { path: '_industry', select: 'name' },
        { path: '_jobCategory', select: 'name' },
        { path: 'state', select: 'name' },
        { path: 'city', select: 'name' }
      ])
      .sort({ createdAt: -1 })
      .lean();


    const offersData = offers.map(offer => ({
      ...offer,
      displayCompanyName: offer.displayCompanyName || offer._company?.displayCompanyName || offer._company?.name || offer.companyName || 'N/A',
      companyName: offer.companyName || offer._company?.name || offer.displayCompanyName || 'N/A'
    }));

    // console.log('Total job offers found:', offersData.length);

    return res.status(200).json({
      success: true,
      message: 'Job offers fetched successfully',
      data: offersData
    });
  } catch (err) {
    console.error('Error fetching job offers:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});


router.get('/job-offer-candidates/:jobOfferId', isCollege, async (req, res) => {
  try {
    const college = req.user.college;
    const { jobOfferId } = req.params;

    const jobOffer = await JobOffer.findById(jobOfferId).lean();
    
    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }

    if (jobOffer.college.toString() !== college._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    if (!jobOffer._course) {
      return res.status(400).json({
        success: false,
        message: 'Job offer does not have a course assigned'
      });
    }

    const candidates = await AppliedCourses.aggregate([
      {
        $match: {
          movetoplacementstatus: true,
          _course: new mongoose.Types.ObjectId(jobOffer._course)
        }
      },
      {
        $lookup: {
          from: 'candidateprofiles',
          localField: '_candidate',
          foreignField: '_id',
          as: '_candidate'
        }
      },
      {
        $unwind: {
          path: '$_candidate',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_course',
          foreignField: '_id',
          as: '_course'
        }
      },
      {
        $unwind: {
          path: '$_course',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          '_course.college': new mongoose.Types.ObjectId(college._id)
        }
      },
      {
        $project: {
          _id: 1,
          candidate: {
            _id: '$_candidate._id',
            name: '$_candidate.name',
            email: '$_candidate.email',
            mobile: '$_candidate.mobile'
          },
          course: {
            _id: '$_course._id',
            name: '$_course.name'
          }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Candidates fetched successfully',
      data: candidates
    });
  } catch (err) {
    console.error('Error fetching job offer candidates:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

router.post('/create-job-offer', isCollege, async (req, res) => {
  try {
    const college = req.user.college;
    const userId = req.user._id;
    const {
      title,
      companyName,
      displayCompanyName,
      _qualification,
      _industry,
      _course,
      state,
      city,
      validity,
      jobDescription,
      requirement,
      noOfPosition,
      _jobCategory,
      placement,
      _candidate,
      _job,
      _company,
      remarks
    } = req.body;

    if (!title || !companyName || !_course) {
      return res.status(400).json({
        success: false,
        message: 'Title, Company Name, and Course are required'
      });
    }

    const jobOfferPayload = {
      college: college._id,
      createdBy: userId,
      title: String(title).trim(),
      companyName: String(companyName).trim(),
      displayCompanyName: displayCompanyName ? String(displayCompanyName).trim() : undefined,
      _qualification: _qualification || undefined,
      _industry: _industry || undefined,
      _course: _course || undefined,
      state: state || undefined,
      city: city || undefined,
      validity: validity ? new Date(validity) : undefined,
      jobDescription: jobDescription || undefined,
      requirement: requirement || undefined,
      noOfPosition: noOfPosition ? Number(noOfPosition) : 1,
      _jobCategory: _jobCategory || undefined,
      placement: placement || undefined,
      _candidate: _candidate || undefined,
      _job: _job || undefined,
      _company: _company || undefined,
      remarks: remarks || undefined,
      logs: [{
        user: userId,
        action: 'Created',
        remarks: 'Job offer created from Create Job modal'
      }]
    };

    const jobOffer = await JobOffer.create(jobOfferPayload);

    return res.status(201).json({
      success: true,
      message: 'Job offer created successfully',
      data: jobOffer
    });
  } catch (err) {
    console.error('Error creating job offer:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});


router.post('/offer-job', isCollege, async (req, res) => {
  try {
    const college = req.user.college;
    const userId = req.user._id;
    const {
      placementId,
      jobId,
      dateOfJoining,
      remarks
    } = req.body;

    if (!placementId || !jobId) {
      return res.status(400).json({
        success: false,
        message: 'Placement ID and Job ID are required'
      });
    }

    const placement = await Placement.findById(placementId)
      .populate({
        path: 'appliedCourse',
        populate: {
          path: '_candidate',
          select: '_id name mobile'
        }
      });

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: 'Placement not found'
      });
    }

    if (placement.college.toString() !== college._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const job = await Vacancy.findById(jobId)
      .populate('_company')
      .populate('_qualification')
      .populate('_industry')
      .populate('state')
      .populate('city');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    placement.dateOfJoining = dateOfJoining ? new Date(dateOfJoining) : placement.dateOfJoining;
    if (remarks) placement.remark = remarks;

    placement.logs.push({
      user: userId,
      action: 'Job Offered',
      remarks: `Job "${job.title}" offered to candidate. ${remarks || ''}`
    });

    const placedStatus = await PlacementStatus.findOne({
      college: college._id,
      title: { $regex: /placed/i }
    });

    if (placedStatus) {
      placement.status = placedStatus._id;
    }

    await placement.save();

    let candidateId = null;
    if (placement.appliedCourse) {
      // Check if _candidate is already populated
      if (placement.appliedCourse._candidate) {
        candidateId = placement.appliedCourse._candidate;
      } else {
        // If appliedCourse exists but _candidate not populated, fetch it from AppliedCourses
        const appliedCourseId = typeof placement.appliedCourse === 'object' 
          ? (placement.appliedCourse._id || placement.appliedCourse)
          : placement.appliedCourse;
        
        if (appliedCourseId) {
          const appliedCourseDoc = await AppliedCourses.findById(appliedCourseId);
          if (appliedCourseDoc && appliedCourseDoc._candidate) {
            candidateId = appliedCourseDoc._candidate;
          }
        }
      }
    }

    // console.log('=== Creating Job Offer ===');
    // console.log('Placement ID:', placementId);
    // console.log('Job ID:', jobId);
    // console.log('Candidate ID:', candidateId);
    // console.log('Placement appliedCourse:', placement.appliedCourse ? 'exists' : 'null');
    // console.log('Placement appliedCourse type:', typeof placement.appliedCourse);

    // Get course from placement if available
    let courseId = null;
    if (placement.appliedCourse) {
      if (typeof placement.appliedCourse === 'object' && placement.appliedCourse._course) {
        courseId = placement.appliedCourse._course;
      } else {
        // Fetch from AppliedCourses if not populated
        const appliedCourseId = typeof placement.appliedCourse === 'object' 
          ? placement.appliedCourse._id 
          : placement.appliedCourse;
        const appliedCourseDoc = await AppliedCourses.findById(appliedCourseId);
        if (appliedCourseDoc && appliedCourseDoc._course) {
          courseId = appliedCourseDoc._course;
        }
      }
    }

    if (candidateId) {
      const AppliedJobs = mongoose.model('AppliedJobs');
      const existingApplication = await AppliedJobs.findOne({
        _candidate: candidateId,
        _job: jobId
      });

      if (!existingApplication) {
        await AppliedJobs.create({
          _candidate: candidateId,
          _job: jobId,
          _company: job._company,
          status: 'offered'
        });
      }
    }

    // Get company details
    const company = job._company || await Company.findById(job._company);
    const companyName = company?.name || '';
    const displayCompanyName = job.displayCompanyName || company?.displayCompanyName || companyName;

    // Create JobOffer with all job details
    const jobOfferData = {
      placement: placementId,
      _job: jobId,
      _company: job._company,
      college: college._id,
      createdBy: userId,
      status: 'offered',
      isActive: true,
      
      // Copy job details from Vacancy
      title: job.title || '',
      companyName: companyName,
      displayCompanyName: displayCompanyName,
      _qualification: job._qualification || null,
      _industry: job._industry || null,
      _jobCategory: job._jobCategory || null,
      state: job.state || null,
      city: job.city || null,
      validity: job.validity || null,
      jobDescription: job.jobDescription || '',
      requirement: job.requirement || '',
      noOfPosition: job.noOfPosition || 1
    };

    // Add candidate and course if available
    if (candidateId) {
      jobOfferData._candidate = candidateId;
      // console.log('JobOffer will have _candidate:', candidateId);
    } else {
      console.error('ERROR: candidateId is null! Cannot create job offer without candidate.');
      return res.status(400).json({
        success: false,
        message: 'Candidate ID not found in placement. Cannot send job offer without candidate link.'
      });
    }

    if (courseId) {
      jobOfferData._course = courseId;
    }

    if (dateOfJoining) {
      jobOfferData.dateOfJoining = new Date(dateOfJoining);
    }

    if (remarks) {
      jobOfferData.remarks = remarks;
    }

    jobOfferData.logs = [{
      user: userId,
      timestamp: new Date(),
      action: 'Offered',
      remarks: `Job "${job.title}" offered to candidate. ${remarks || ''}`
    }];

    // Check if job offer already exists for this candidate and job
    const existingJobOffer = await JobOffer.findOne({
      _candidate: candidateId,
      _job: jobId,
      isActive: true
    });

    let jobOffer;
    if (existingJobOffer) {
      // Update existing job offer
      // console.log('Updating existing job offer:', existingJobOffer._id);
      Object.assign(existingJobOffer, jobOfferData);
      await existingJobOffer.save();
      jobOffer = existingJobOffer;
    } else {
      // Create new job offer
      // console.log('Creating new job offer with data:', JSON.stringify(jobOfferData, null, 2));
      jobOffer = await JobOffer.create(jobOfferData);
      // console.log('JobOffer created successfully:', jobOffer._id);
      // console.log('JobOffer _candidate:', jobOffer._candidate);
      // console.log('JobOffer status:', jobOffer.status);
    }

    return res.status(200).json({
      success: true,
      message: 'Job offered successfully and candidate marked as placed',
      data: {
        placement: placement,
        jobOffer: jobOffer
      }
    });
  } catch (err) {
    console.error('Error offering job:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

module.exports = router;

