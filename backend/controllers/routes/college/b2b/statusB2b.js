// server.js
const express = require("express");
const mongoose = require('mongoose');
const cors = require('cors');
const router = express.Router();
const { isCollege, auth1, authenti } = require("../../../../helpers");

// Status Model
const Status = require('../../../models/statusB2b');
const AppliedCourses = require('../../../models/appliedCourses');
const B2bStatusAssignment = require('../../../models/b2bStatusAssignment');
const {
  resolveProjectSelection,
  getAssignmentState,
  saveAssignmentState,
  getStatusProjectScope,
  getAssignedForProjects,
} = require('../../../../helpers/b2bStatusAssignment');

// Admins see every status. Other users see only statuses, and substatuses,
// assigned to their B2B projects.
const filterStatusesForUser = async (req, statuses) => {
  const projectIds = await getStatusProjectScope(req.user);
  if (!projectIds) return statuses;
  const assigned = await getAssignedForProjects(req.user.college._id, projectIds);
  return statuses
    .filter((status) => assigned.has(String(status._id)))
    .map((status) => {
      const subIds = assigned.get(String(status._id));
      return { ...status, substatuses: (status.substatuses || []).filter((sub) => subIds.has(String(sub._id))) };
    });
};

const emptyState = () => ({ projects: new Set(), departments: new Set(), subProjects: new Map() });

// No departments and no projects means the status stays global (no assignment rows)
const resolveAlignment = (departments, projects) => {
  const hasSelection = (Array.isArray(departments) && departments.length)
    || (Array.isArray(projects) && projects.length);
  return hasSelection ? resolveProjectSelection(departments, projects) : { projectIds: [] };
};

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
    
    const allStatuses = await Status.find(query).sort({ index: 1 }).lean();
    const statuses = await filterStatusesForUser(req, allStatuses);
    const assignmentState = await getAssignmentState(collegeId, statuses.map((status) => status._id));

    // For each status, get count of AppliedCourses with _leadStatus = status._id

    const statusesWithCount = await Promise.all(
      statuses.map(async (status) => {
        const count = await AppliedCourses.countDocuments({ _leadStatus: status._id, kycStage: { $nin: [true] },
			kyc: { $nin: [true] },
			admissionDone: { $nin: [true] } });
        const assignment = assignmentState.get(String(status._id)) || emptyState();
        return {
          _id: status._id,
          title: status.title,
          description: status.description,
          milestone: status.milestone,
          index: status.index,
          count,          // yaha count add kar diya
          substatuses: (status.substatuses || []).map((sub) => ({
            ...sub,
            assignedProjects: [...(assignment.subProjects.get(String(sub._id)) || [])],
          })),
          assignedDepartments: [...assignment.departments],
          assignedProjects: [...assignment.projects],
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
    const { title, description, milestone, departments = [], projects = [] } = req.body;
    const college = req.user.college;

    const { projectIds, error } = await resolveAlignment(departments, projects);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    
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
    if (projectIds.length) {
      await saveAssignmentState({
        collegeId: college._id,
        statusId: data._id,
        projects: projectIds,
        subProjects: new Map(),
        createdBy: req.user._id,
      });
    }
    
	return res.status(201).json({ success: true, message: 'Status created successfully', data: data });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/statuses/:id
// @desc    Update A Status
// @access  Public
router.put('/edit/:id', isCollege, async (req, res) => {
  try {
    const { title, description, milestone, departments, projects } = req.body;
    
    // Find status by id
    const status = await Status.findById(req.params.id);
    
    if (!status) {
      return res.status(404).json({ msg: 'Status not found' });
    }

    let newProjectIds = null;
    if (departments !== undefined || projects !== undefined) {
      const { projectIds, error } = await resolveAlignment(departments, projects);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }
      newProjectIds = projectIds;
    }
    
    // Update fields
    status.title = title;
    status.description = description;
    if (milestone !== undefined) status.milestone = milestone;
    
    const data = await status.save();

    if (newProjectIds) {
      const previous = (await getAssignmentState(req.user.college._id, [status._id])).get(String(status._id)) || emptyState();
      const subProjects = new Map();
      (status.substatuses || []).forEach((sub) => {
        const before = previous.subProjects.get(String(sub._id)) || new Set();
        // Substatuses that covered every status project keep covering every project
        const followsStatus = before.size === previous.projects.size
          && [...previous.projects].every((id) => before.has(id));
        subProjects.set(String(sub._id), followsStatus ? new Set(newProjectIds) : before);
      });
      await saveAssignmentState({
        collegeId: req.user.college._id,
        statusId: status._id,
        projects: newProjectIds,
        subProjects,
        createdBy: req.user._id,
      });
    }
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
    await B2bStatusAssignment.deleteMany({ status: status._id });
    
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

// @route   POST /college/statusB2b/assign
// @desc    Assigns statuses to B2B projects (Switch / Shift all).
//          Body: { projects: [projectId], items: [{ statusId, substatusIds: [id] }] }
//          In each listed project the status gets exactly the listed substatuses;
//          other projects of the status are left as they are.
router.post('/assign', isCollege, async (req, res) => {
  try {
    const { projects = [], items = [] } = req.body;
    const collegeId = req.user.college._id;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Select at least one status' });
    }
    if (!Array.isArray(projects) || !projects.length) {
      return res.status(400).json({ success: false, message: 'Select at least one project' });
    }

    const { projectIds, error } = await resolveProjectSelection([], projects);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const statusIds = items.map((item) => String(item?.statusId || ''));
    if (statusIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: 'Invalid status id' });
    }
    const statuses = await Status.find({
      _id: { $in: statusIds },
      $or: [{ college: collegeId }, { college: null }, { college: { $exists: false } }],
    }).select('_id substatuses').lean();
    if (statuses.length !== new Set(statusIds).size) {
      return res.status(404).json({ success: false, message: 'One or more statuses were not found' });
    }

    const state = await getAssignmentState(collegeId, statusIds);
    for (const item of items) {
      const status = statuses.find((s) => String(s._id) === String(item.statusId));
      const validSubIds = new Set((status.substatuses || []).map((sub) => String(sub._id)));
      const current = state.get(String(status._id)) || emptyState();

      const ticked = new Set((item.substatusIds || []).map(String).filter((id) => validSubIds.has(id)));

      projectIds.forEach((id) => current.projects.add(id));
      validSubIds.forEach((subId) => {
        if (!current.subProjects.has(subId)) current.subProjects.set(subId, new Set());
        const subSet = current.subProjects.get(subId);
        projectIds.forEach((id) => (ticked.has(subId) ? subSet.add(id) : subSet.delete(id)));
      });

      await saveAssignmentState({
        collegeId,
        statusId: status._id,
        projects: [...current.projects],
        subProjects: current.subProjects,
        createdBy: req.user._id,
      });
    }

    return res.status(200).json({ success: true, message: 'Statuses assigned successfully' });
  } catch (err) {
    console.error('Error assigning B2B statuses:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
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
  

// Checks which of the status's projects a substatus shows in and returns `apply` to save it.
// Missing `projects` means all of the status's projects.
const prepareSubstatusProjects = async (req, status, projects) => {
  const state = (await getAssignmentState(req.user.college._id, [status._id])).get(String(status._id)) || emptyState();
  const requested = projects === undefined
    ? [...state.projects]
    : [...new Set((Array.isArray(projects) ? projects : []).map(String))];
  if (requested.some((id) => !state.projects.has(id))) {
    return { error: 'A substatus can only use projects that its status is assigned to' };
  }
  const apply = (substatusId) => {
    state.subProjects.set(String(substatusId), new Set(requested));
    return saveAssignmentState({
      collegeId: req.user.college._id,
      statusId: status._id,
      projects: [...state.projects],
      subProjects: state.subProjects,
      createdBy: req.user._id,
    });
  };
  return { apply };
};

// @route   POST api/statuses/:statusId/substatus
// @desc    Add a substatus to a status
// @access  Public
router.post('/:statusId/substatus', isCollege, async (req, res) => {
  try {
    const { title, description, hasRemarks, hasFollowup, hasAttachment, projects } = req.body;
    
    const status = await Status.findById(req.params.statusId);
    
    if (!status) {
      return res.status(404).json({ msg: 'Status not found' });
    }

    const { error, apply } = await prepareSubstatusProjects(req, status, projects);
    if (error) {
      return res.status(400).json({ success: false, message: error });
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
    await apply(data.substatuses[data.substatuses.length - 1]._id);
    return res.status(201).json({ success: true, message: 'Sub status created successfully', data: data });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:statusId/substatus', isCollege, async (req, res) => {
    try {
      const status = await Status.findById(req.params.statusId).lean();
  
      if (!status) {
        return res.status(404).json({ msg: 'Status not found' });
      }

      const [visibleStatus] = await filterStatusesForUser(req, [status]);
      return res.status(200).json({ success: true, data: visibleStatus ? visibleStatus.substatuses : [] });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  

// @route   PUT api/statuses/:statusId/substatus/:substatusId
// @desc    Update a substatus
// @access  Public
router.put('/:statusId/substatus/:substatusId', isCollege, async (req, res) => {
  try {
    const { title, description, hasRemarks, hasFollowup, hasAttachment, projects } = req.body;
    
    const status = await Status.findById(req.params.statusId);
    
    if (!status) {
      return res.status(404).json({ msg: 'Status not found' });
    }
    
    // Find the substatus
    const substatus = status.substatuses.id(req.params.substatusId);
    
    if (!substatus) {
      return res.status(404).json({ msg: 'Substatus not found' });
    }

    let applyProjects = null;
    if (projects !== undefined) {
      const { error, apply } = await prepareSubstatusProjects(req, status, projects);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }
      applyProjects = apply;
    }
    
    // Update substatus
    substatus.title = title;
    substatus.description = description;
    substatus.hasRemarks = hasRemarks;
    substatus.hasFollowup = hasFollowup;
    substatus.hasAttachment = hasAttachment;
    
    const data = await status.save();
    if (applyProjects) await applyProjects(substatus._id);
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
    await B2bStatusAssignment.updateMany(
      { status: status._id },
      { $pull: { substatuses: new mongoose.Types.ObjectId(req.params.substatusId) } }
    );
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
