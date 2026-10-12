const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const { isCollege } = require("../../../../helpers");

const B2bMilestone = require('../../../models/b2bMilestone');
const B2bMilestoneAssignment = require('../../../models/b2bMilestoneAssignment');
const { resolveProjectSelection: resolveB2bProjectSelection, getStatusProjectScope } = require('../../../../helpers/b2bStatusAssignment');
const {
  getMilestoneAssignmentState,
  saveMilestoneProjects,
  getMilestonesForProjects,
} = require('../../../../helpers/b2bMilestoneAssignment');

const isValidId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

// B2B departments and projects are not tied to a college
const resolveProjectSelection = (collegeId, departments, projects) => resolveB2bProjectSelection(departments, projects);

// No departments and no projects means the milestone stays global (no assignment rows)
const resolveAlignment = (collegeId, departments, projects) => {
  const hasSelection = (Array.isArray(departments) && departments.length)
    || (Array.isArray(projects) && projects.length);
  return hasSelection ? resolveProjectSelection(collegeId, departments, projects) : { projectIds: [] };
};

const renumber = async (collegeId) => {
  const milestones = await B2bMilestone.find({ college: collegeId }).sort({ index: 1, createdAt: 1 }).select('_id');
  if (!milestones.length) return;
  await B2bMilestone.bulkWrite(milestones.map((item, index) => ({
    updateOne: { filter: { _id: item._id }, update: { $set: { index } } },
  })));
};

// Admins see every milestone. Other users see only milestones assigned to their B2B projects.
router.get('/', isCollege, async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    let milestones = await B2bMilestone.find({ college: collegeId }).sort({ index: 1 }).lean();

    const projectIds = await getStatusProjectScope(req.user);
    if (projectIds) {
      const visible = await getMilestonesForProjects(collegeId, projectIds);
      milestones = milestones.filter((item) => visible.has(String(item._id)));
    }

    const state = await getMilestoneAssignmentState(collegeId, milestones.map((item) => item._id));
    const data = milestones.map((item) => {
      const assignment = state.get(String(item._id));
      return {
        _id: item._id,
        title: item.title,
        description: item.description,
        index: item.index,
        assignedDepartments: assignment ? [...assignment.departments] : [],
        assignedProjects: assignment ? [...assignment.projects] : [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    return res.status(200).json({ success: true, message: 'Milestones fetched successfully', data });
  } catch (err) {
    console.error('Error fetching milestones:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// New milestones are global; they are aligned to projects later through edit or assign.
router.post('/add', isCollege, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    if (!title) {
      return res.status(400).json({ success: false, message: 'Milestone name is required' });
    }

    const collegeId = req.user.college._id;
    const last = await B2bMilestone.findOne({ college: collegeId }).sort('-index').select('index').lean();
    const data = await B2bMilestone.create({
      title,
      description,
      index: last ? last.index + 1 : 0,
      college: collegeId,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, message: 'Milestone created successfully', data });
  } catch (err) {
    console.error('Error creating milestone:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Sending departments/projects realigns the milestone; empty lists make it global again.
router.put('/edit/:id', isCollege, async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid milestone id' });
    }
    const milestone = await B2bMilestone.findOne({ _id: req.params.id, college: collegeId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const { title, description, departments, projects } = req.body;
    let newProjectIds = null;
    if (departments !== undefined || projects !== undefined) {
      const { projectIds, error } = await resolveAlignment(collegeId, departments, projects);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }
      newProjectIds = projectIds;
    }

    if (title !== undefined) {
      const nextTitle = String(title).trim();
      if (!nextTitle) {
        return res.status(400).json({ success: false, message: 'Milestone name is required' });
      }
      milestone.title = nextTitle;
    }
    if (description !== undefined) milestone.description = String(description).trim();
    milestone.updatedBy = req.user._id;
    const data = await milestone.save();

    if (newProjectIds) {
      await saveMilestoneProjects({
        collegeId,
        milestoneId: milestone._id,
        projects: newProjectIds,
        createdBy: req.user._id,
      });
    }

    return res.status(200).json({ success: true, message: 'Milestone updated successfully', data });
  } catch (err) {
    console.error('Error updating milestone:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

router.delete('/delete/:id', isCollege, async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid milestone id' });
    }
    const milestone = await B2bMilestone.findOneAndDelete({ _id: req.params.id, college: collegeId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    await B2bMilestoneAssignment.deleteMany({ milestone: milestone._id });
    await renumber(collegeId);

    return res.status(200).json({ success: true, message: 'Milestone deleted successfully' });
  } catch (err) {
    console.error('Error deleting milestone:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

router.put('/reorder', isCollege, async (req, res) => {
  try {
    const { milestoneOrder } = req.body;
    if (!Array.isArray(milestoneOrder)) {
      return res.status(400).json({ success: false, message: 'milestoneOrder must be an array' });
    }
    const updates = milestoneOrder.filter((item) => isValidId(item?._id) && Number.isFinite(Number(item.index)));
    if (updates.length) {
      await B2bMilestone.bulkWrite(updates.map((item) => ({
        updateOne: {
          filter: { _id: item._id, college: req.user.college._id },
          update: { $set: { index: Number(item.index) } },
        },
      })));
    }
    return res.status(200).json({ success: true, message: 'Milestones reordered successfully' });
  } catch (err) {
    console.error('Error reordering milestones:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Switch: adds the milestones to the given projects. Their other projects are kept.
router.post('/assign', isCollege, async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    const { milestoneIds = [], departments = [], projects = [] } = req.body;
    const ids = [...new Set((Array.isArray(milestoneIds) ? milestoneIds : []).map(String).filter(isValidId))];
    if (!ids.length) {
      return res.status(400).json({ success: false, message: 'Select at least one milestone' });
    }

    const { projectIds, error } = await resolveProjectSelection(collegeId, departments, projects);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const found = await B2bMilestone.countDocuments({ _id: { $in: ids }, college: collegeId });
    if (found !== ids.length) {
      return res.status(404).json({ success: false, message: 'One or more milestones were not found' });
    }

    for (const milestoneId of ids) {
      await saveMilestoneProjects({
        collegeId,
        milestoneId,
        projects: projectIds,
        createdBy: req.user._id,
        replace: false,
      });
    }

    return res.status(200).json({ success: true, message: 'Milestones assigned successfully' });
  } catch (err) {
    console.error('Error assigning milestones:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
