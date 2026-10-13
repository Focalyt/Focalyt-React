const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const { isCollege, getAllTeamMembers } = require("../../../helpers");

const B2cMilestone = require('../../models/b2cMilestone');
const B2cMilestoneAssignment = require('../../models/b2cMilestoneAssignment');
const AppliedCourses = require('../../models/appliedCourses');
const Courses = require('../../models/courses');
const { resolveProjectSelection, getStatusProjectScope } = require('../../../helpers/b2cStatusAssignment');
const {
  ensureMilestonePositions,
  getMilestoneAssignmentState,
  saveMilestoneProjects,
  placeMilestonesAt,
  reorderMilestoneScope,
  getMilestonesForProjects,
} = require('../../../helpers/b2cMilestoneAssignment');

const isValidId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

// Same default as the admission list: admins and counsellors see leads they own or share.
const ownerIdsForMilestoneCounts = async (user) => {
  const isAdmin = user?.permissions?.permission_type === 'Admin';
  const ids = isAdmin
    ? (user?._id ? [user._id] : [])
    : await getAllTeamMembers(user._id);
  const list = Array.isArray(ids) && ids.length ? ids : (user?._id ? [user._id] : []);
  return list
    .filter((id) => isValidId(id))
    .map((id) => new mongoose.Types.ObjectId(String(id)));
};

// No departments and no projects means the milestone stays global (no assignment rows)
const resolveAlignment = (collegeId, departments, projects) => {
  const hasSelection = (Array.isArray(departments) && departments.length)
    || (Array.isArray(projects) && projects.length);
  return hasSelection ? resolveProjectSelection(collegeId, departments, projects) : { projectIds: [] };
};

const renumber = async (collegeId) => {
  const milestones = await B2cMilestone.find({ college: collegeId }).sort({ index: 1, createdAt: 1 }).select('_id');
  if (!milestones.length) return;
  await B2cMilestone.bulkWrite(milestones.map((item, index) => ({
    updateOne: { filter: { _id: item._id }, update: { $set: { index } } },
  })));
};

// Admins see every milestone. Other users see only milestones assigned to their B2C projects.
router.get('/', isCollege, async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    await ensureMilestonePositions(collegeId);
    let milestones = await B2cMilestone.find({ college: collegeId }).sort({ index: 1, createdAt: 1 }).lean();

    const projectIds = await getStatusProjectScope(req.user);
    if (projectIds) {
      const visible = await getMilestonesForProjects(collegeId, projectIds);
      milestones = milestones.filter((item) => visible.has(String(item._id)));
    }

    const state = await getMilestoneAssignmentState(collegeId, milestones.map((item) => item._id));
    const courseIds = await Courses.find({ college: collegeId }).distinct('_id');
    const ownerIds = await ownerIdsForMilestoneCounts(req.user);
    const counted = courseIds.length
      ? await AppliedCourses.aggregate([
        {
          $match: {
            _course: { $in: courseIds },
            admissionDone: true,
            ...(ownerIds.length ? {
              $or: [
                { registeredBy: { $in: ownerIds } },
                { counsellor: { $in: ownerIds } },
                { leadCoOwner: { $in: ownerIds } },
                { leadCoOwner2: { $in: ownerIds } },
              ],
            } : {}),
          },
        },
        {
          $project: {
            milestones: {
              $setUnion: [
                { $ifNull: ['$milestoneHistory.milestone', []] },
                {
                  $cond: [
                    { $ifNull: ['$_milestone', false] },
                    ['$_milestone'],
                    [],
                  ],
                },
              ],
            },
          },
        },
        { $match: { 'milestones.0': { $exists: true } } },
        {
          $facet: {
            byMilestone: [
              { $unwind: '$milestones' },
              { $group: { _id: '$milestones', count: { $sum: 1 } } },
            ],
            leads: [{ $count: 'count' }],
          },
        },
      ])
      : [];
    const countByMilestone = new Map(
      ((counted[0] && counted[0].byMilestone) || []).map((row) => [String(row._id), row.count])
    );
    const reachedLeadCount = counted[0]?.leads?.[0]?.count || 0;
    const data = milestones.map((item) => {
      const assignment = state.get(String(item._id));
      const projectPositions = {};
      const departmentPositions = {};
      if (assignment) {
        assignment.projectPositions.forEach((position, projectId) => {
          projectPositions[projectId] = position;
        });
        assignment.departmentPositions.forEach((position, departmentId) => {
          departmentPositions[departmentId] = position;
        });
      }
      return {
        _id: item._id,
        title: item.title,
        description: item.description,
        leadCount: countByMilestone.get(String(item._id)) || 0,
        assignedDepartments: assignment ? [...assignment.departments] : [],
        assignedProjects: assignment ? [...assignment.projects] : [],
        projectPositions,
        departmentPositions,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Milestones fetched successfully',
      reachedLeadCount,
      data,
    });
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
    const last = await B2cMilestone.findOne({ college: collegeId }).sort('-index').select('index').lean();
    const data = await B2cMilestone.create({
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
    const milestone = await B2cMilestone.findOne({ _id: req.params.id, college: collegeId });
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
    const milestone = await B2cMilestone.findOneAndDelete({ _id: req.params.id, college: collegeId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    await B2cMilestoneAssignment.deleteMany({ milestone: milestone._id });
    await renumber(collegeId);

    return res.status(200).json({ success: true, message: 'Milestone deleted successfully' });
  } catch (err) {
    console.error('Error deleting milestone:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Order belongs to a department, or to one project inside that department.
router.put('/reorder', isCollege, async (req, res) => {
  try {
    const { milestoneOrder, departmentId, projectId } = req.body;
    if (!Array.isArray(milestoneOrder)) {
      return res.status(400).json({ success: false, message: 'milestoneOrder must be an array' });
    }
    if (!departmentId) {
      return res.status(400).json({ success: false, message: 'Choose a department or project before changing milestone order' });
    }
    const { error } = await reorderMilestoneScope({
      collegeId: req.user.college._id,
      departmentId,
      projectId: projectId || '',
      orderedMilestoneIds: milestoneOrder.map((item) => item?._id),
    });
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    return res.status(200).json({ success: true, message: 'Milestone order updated' });
  } catch (err) {
    console.error('Error reordering milestones:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Switch: adds the milestones to the given projects. Their other projects are kept.
router.post('/assign', isCollege, async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    const { milestoneIds = [], departments = [], projects = [], placements = [] } = req.body;
    const ids = [...new Set((Array.isArray(milestoneIds) ? milestoneIds : []).map(String).filter(isValidId))];
    if (!ids.length) {
      return res.status(400).json({ success: false, message: 'Select at least one milestone' });
    }

    const found = await B2cMilestone.countDocuments({ _id: { $in: ids }, college: collegeId });
    if (found !== ids.length) {
      return res.status(404).json({ success: false, message: 'One or more milestones were not found' });
    }

    if (Array.isArray(placements) && placements.length) {
      const byProject = new Map();
      for (const item of placements) {
        const position = Number(item?.position);
        if (!isValidId(item?.projectId) || !Number.isInteger(position) || position < 1) {
          return res.status(400).json({ success: false, message: 'Each project needs a position of 1 or more' });
        }
        byProject.set(String(item.projectId), { position, customOrder: Boolean(item.customOrder) });
      }
      for (const [projectId, placement] of byProject) {
        const { error: placeError } = await placeMilestonesAt({
          collegeId,
          projectId,
          milestoneIds: ids,
          startIndex: placement.position - 1,
          customOrder: placement.customOrder,
          createdBy: req.user._id,
        });
        if (placeError) {
          return res.status(400).json({ success: false, message: placeError });
        }
      }
    } else {
      const { projectIds, error } = await resolveProjectSelection(collegeId, departments, projects);
      if (error) {
        return res.status(400).json({ success: false, message: error });
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
    }

    return res.status(200).json({ success: true, message: 'Milestones assigned successfully' });
  } catch (err) {
    console.error('Error assigning milestones:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
