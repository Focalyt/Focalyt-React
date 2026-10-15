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
  createMilestonesForProjects,
  copyMilestonesOntoProject,
  saveMilestoneProjects,
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
    milestones = milestones.filter((item) => state.get(String(item._id))?.projects?.size);
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

// One new milestone document per selected project. A department with no project uses every project in it.
router.post('/add', isCollege, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    if (!title) {
      return res.status(400).json({ success: false, message: 'Milestone name is required' });
    }

    const collegeId = req.user.college._id;
    const { projectIds, error } = await resolveProjectSelection(
      collegeId,
      req.body.departments,
      req.body.projects,
    );
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const { milestones, error: createError } = await createMilestonesForProjects({
      collegeId,
      title,
      description,
      projectIds,
      createdBy: req.user._id,
    });
    if (createError) {
      return res.status(400).json({ success: false, message: createError });
    }

    return res.status(201).json({
      success: true,
      message: milestones.length > 1
        ? `Milestone added to ${milestones.length} projects`
        : 'Milestone created successfully',
      data: milestones,
    });
  } catch (err) {
    console.error('Error creating milestone:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// This milestone stays on exactly one project. Empty selection is rejected.
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
    const { projectIds, error } = await resolveProjectSelection(collegeId, departments, projects);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    if (projectIds.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Select one project. Each milestone belongs to a single project.',
      });
    }
    const newProjectIds = projectIds;

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

// Switch copies each milestone onto the chosen projects as its own document.
router.post('/assign', isCollege, async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    const { milestoneIds = [], departments = [], projects = [], placements = [] } = req.body;
    const ids = [...new Set((Array.isArray(milestoneIds) ? milestoneIds : []).map(String).filter(isValidId))];
    if (!ids.length) {
      return res.status(400).json({ success: false, message: 'Select at least one milestone' });
    }

    const sources = await B2cMilestone.find({ _id: { $in: ids }, college: collegeId })
      .select('title description')
      .lean();
    if (sources.length !== ids.length) {
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
        const { error: placeError } = await copyMilestonesOntoProject({
          collegeId,
          sources,
          projectId,
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
      for (const projectId of projectIds) {
        const count = await B2cMilestoneAssignment.countDocuments({ college: collegeId, project: projectId });
        const { error: placeError } = await copyMilestonesOntoProject({
          collegeId,
          sources,
          projectId,
          startIndex: count,
          customOrder: false,
          createdBy: req.user._id,
          repositionExisting: false,
        });
        if (placeError) {
          return res.status(400).json({ success: false, message: placeError });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Milestones assigned successfully' });
  } catch (err) {
    console.error('Error assigning milestones:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
