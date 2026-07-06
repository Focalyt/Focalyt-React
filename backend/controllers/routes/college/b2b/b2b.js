const express = require("express");
const axios = require("axios");
const moment = require("moment");
const Anthropic = require("@anthropic-ai/sdk");
let fs = require("fs");
let path = require("path");
const { isCollege, getAllTeamMembers } = require("../../../../helpers");
const fileupload = require("express-fileupload");
const readXlsxFile = require("read-excel-file/node");
const mongoose = require("mongoose");
const uuid = require('uuid/v1');
const multer = require('multer');
const {
	bucketName,
	mimetypes,
} = require('../../../../config');

const s3 = require('../../../../helpers/objectStorage');

const destination = path.resolve(__dirname, '..', '..', '..', 'public', 'temp');
if (!fs.existsSync(destination)) fs.mkdirSync(destination);

const storage = multer.diskStorage({
	destination,
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		const basename = path.basename(file.originalname, ext);
		cb(null, `${basename}-${Date.now()}${ext}`);
	},
});

const upload = multer({ storage }).single('file');



const {
	Import,
	Qualification,
	Skill,
	Country,
	User,
	State,
	City,
	College,
	SubQualification,
	Courses,
	AppliedCourses

} = require("../../../models");
const TypeOfB2B = require("../../../models/b2b/typeOfB2B");
const B2BProject = require("../../../models/b2b/b2bProject");
const B2BDepartment = require("../../../models/b2b/b2bDepartment");
const LeadCategory = require("../../../models/b2b/leadCategory");
const defaultLeadModel = require("../../../models/b2b/lead");
const FollowUp = require("../../../models/b2b/followUp");
const StatusB2b = require("../../../models/statusB2b");
const Candidate = require("../../../models/candidateProfile");

const { generatePassword, sendMail } = require("../../../../helpers");

function createB2BRouter(LeadModel = defaultLeadModel) {
	const Lead = LeadModel;
	const router = express.Router();

	const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(String(id));

	const assertDifferentTarget = (sourceId, targetId, label) => {
		if (sourceId && targetId && String(sourceId) === String(targetId)) {
			const err = new Error(`Please choose a different ${label} to move records to`);
			err.statusCode = 400;
			throw err;
		}
	};

	const handleDeleteError = (res, error, fallbackMessage) => {
		const status = error.statusCode || 500;
		if (status >= 500) console.error(fallbackMessage, error);
		res.status(status).json({
			status: false,
			message: error.message || fallbackMessage,
			error: status >= 500 ? error.message : undefined
		});
	};

	const isAdminUser = (req) => req.user?.permissions?.permission_type === 'Admin';

	const isReferredByMeQuery = (value) =>
		value === true || value === 'true' || value === '1';

	const getReferredByMeFilter = (userId) => ({
		logs: {
			$elemMatch: {
				user: mongoose.Types.ObjectId.isValid(String(userId))
					? new mongoose.Types.ObjectId(String(userId))
					: userId,
				action: { $regex: /^Lead referred from/i }
			}
		}
	});

	const VALID_FOLLOWUP_BUCKETS = new Set(['done', 'planned', 'missed']);

	/** Match frontend getFollowupBucket — filter leads by call/visit follow-up bucket */
	const resolveFollowupBucketLeadFilter = async (type, bucket) => {
		const b = String(bucket || '').toLowerCase();
		if (!VALID_FOLLOWUP_BUCKETS.has(b)) return null;

		const isVisit = String(type || '').toLowerCase() === 'visit';
		const slotField = isVisit ? 'followUpVisit' : 'followUpCall';
		const legacyTypePattern = isVisit ? '^visit$' : '^call$';
		const now = new Date();

		const bucketExpr = (prefix) => {
			const statusLower = { $toLower: { $ifNull: [`${prefix}.status`, ''] } };
			const sched = `${prefix}.scheduledDate`;
			const hasSched = {
				$and: [
					{ $ne: [sched, null] },
					{ $ne: [{ $type: sched }, 'missing'] }
				]
			};
			if (b === 'done') {
				return { $eq: [statusLower, 'completed'] };
			}
			const notDone = { $ne: [statusLower, 'completed'] };
			if (b === 'planned') {
				return { $and: [notDone, hasSched, { $gte: [sched, now] }] };
			}
			return { $and: [notDone, hasSched, { $lt: [sched, now] }] };
		};

		const slotPipeline = [
			{ $match: { [slotField]: { $exists: true, $ne: null } } },
			{
				$lookup: {
					from: 'followups',
					localField: slotField,
					foreignField: '_id',
					as: 'fuArr'
				}
			},
			{ $unwind: '$fuArr' },
			{ $match: { $expr: bucketExpr('$fuArr') } },
			{ $project: { _id: 1 } }
		];

		const legacyPipeline = [
			{
				$match: {
					followUp: { $exists: true, $ne: null },
					$or: [{ [slotField]: null }, { [slotField]: { $exists: false } }]
				}
			},
			{
				$lookup: {
					from: 'followups',
					localField: 'followUp',
					foreignField: '_id',
					as: 'fuArr'
				}
			},
			{ $unwind: '$fuArr' },
			{
				$match: {
					$expr: {
						$and: [
							{ $regexMatch: { input: { $toLower: '$fuArr.followUpType' }, regex: legacyTypePattern, options: 'i' } },
							bucketExpr('$fuArr')
						]
					}
				}
			},
			{ $project: { _id: 1 } }
		];

		const [slotLeads, legacyLeads] = await Promise.all([
			Lead.aggregate(slotPipeline),
			Lead.aggregate(legacyPipeline)
		]);

		const ids = [
			...new Set(
				[...(slotLeads || []), ...(legacyLeads || [])]
					.map((row) => String(row._id))
					.filter(Boolean)
			)
		];

		if (!ids.length) {
			return { _id: { $in: [] } };
		}

		return {
			_id: {
				$in: ids
					.filter((id) => mongoose.Types.ObjectId.isValid(id))
					.map((id) => new mongoose.Types.ObjectId(id))
			}
		};
	};

	const buildLeadDateRangeCondition = (field, fromDate, toDate) => {
		if (!fromDate && !toDate) return null;
		return {
			[field]: {
				...(fromDate ? { $gte: new Date(fromDate) } : {}),
				...(toDate ? { $lte: new Date(toDate) } : {})
			}
		};
	};

	const resolveNextActionDateLeadFilter = async (fromDate, toDate) => {
		if (!fromDate && !toDate) return null;

		const scheduledDate = {};
		if (fromDate) scheduledDate.$gte = new Date(fromDate);
		if (toDate) scheduledDate.$lte = new Date(toDate);

		const followups = await FollowUp.find({ scheduledDate }).select('_id').lean();
		const fuIds = followups.map((row) => row._id).filter(Boolean);
		if (!fuIds.length) return { _id: { $in: [] } };

		return {
			$or: [
				{ followUpCall: { $in: fuIds } },
				{ followUpVisit: { $in: fuIds } },
				{ followUp: { $in: fuIds } }
			]
		};
	};

	const mergeLeadQuery = (baseQuery, extra) => {
		if (!extra) return baseQuery || {};
		if (!baseQuery || Object.keys(baseQuery).length === 0) return extra;
		if (baseQuery.$and) return { $and: [...baseQuery.$and, extra] };
		return { $and: [baseQuery, extra] };
	};

	const countLeadsInFollowupBucket = async (baseQuery, type, bucket) => {
		const bucketFilter = await resolveFollowupBucketLeadFilter(type, bucket);
		if (!bucketFilter) return 0;
		return Lead.countDocuments(mergeLeadQuery(baseQuery, bucketFilter));
	};

	const buildFollowupDashboardCounts = async (baseQuery) => {
		const [callDone, callPlanned, callMissed, visitDone, visitPlanned, visitMissed] = await Promise.all([
			countLeadsInFollowupBucket(baseQuery, 'call', 'done'),
			countLeadsInFollowupBucket(baseQuery, 'call', 'planned'),
			countLeadsInFollowupBucket(baseQuery, 'call', 'missed'),
			countLeadsInFollowupBucket(baseQuery, 'visit', 'done'),
			countLeadsInFollowupBucket(baseQuery, 'visit', 'planned'),
			countLeadsInFollowupBucket(baseQuery, 'visit', 'missed'),
		]);
		return {
			call: { done: callDone, planned: callPlanned, missed: callMissed },
			visit: { done: visitDone, planned: visitPlanned, missed: visitMissed },
		};
	};

	const getCrossSaleRootId = (lead) => {
		if (!lead) return null;
		if (lead.crossSaleRootId) return String(lead.crossSaleRootId);
		if (lead.parentLeadId) return String(lead.parentLeadId);
		return String(lead._id);
	};

	const buildCrossSaleGroupQuery = (rootId) => ({
		$or: [
			{ _id: rootId },
			{ crossSaleRootId: rootId },
			{ parentLeadId: rootId },
		],
	});

	const resolveB2BLeadPipelineStatus = async (req, requestedPipelineStatus, requestedPipelineSubStatus) => {
		const collegeIdForPipeline = req.user?.college?._id;
		const pipelineStatusScope = collegeIdForPipeline
			? {
				$or: [
					{ college: collegeIdForPipeline },
					{ college: null },
					{ college: { $exists: false } },
				],
			}
			: {
				$or: [{ college: null }, { college: { $exists: false } }],
			};

		const titleMatchExpr = (lowerTitle) => ({
			$expr: {
				$eq: [{ $toLower: { $trim: { input: '$title' } } }, lowerTitle],
			},
		});

		let resolvedStatusId = null;
		let resolvedSubStatusId = null;

		const rawStatus = requestedPipelineStatus != null ? String(requestedPipelineStatus).trim() : '';
		if (rawStatus) {
			let statusDoc = null;
			if (mongoose.Types.ObjectId.isValid(rawStatus)) {
				statusDoc = await StatusB2b.findOne({
					$and: [{ _id: rawStatus }, pipelineStatusScope],
				});
			}
			if (!statusDoc) {
				const norm = rawStatus.toLowerCase();
				statusDoc = await StatusB2b.findOne({
					$and: [titleMatchExpr(norm), pipelineStatusScope],
				});
			}
			if (statusDoc) {
				resolvedStatusId = statusDoc._id;
				const subs = statusDoc.substatuses || [];
				const rawSub = requestedPipelineSubStatus != null ? String(requestedPipelineSubStatus).trim() : '';
				if (rawSub && mongoose.Types.ObjectId.isValid(rawSub)) {
					const matchSub = subs.find((s) => String(s._id) === rawSub);
					if (matchSub) {
						resolvedSubStatusId = matchSub._id;
					}
				}
				if (!resolvedSubStatusId && subs.length > 0) {
					resolvedSubStatusId = subs[0]._id;
				}
			}
		}

		const college = await College.findOne({ '_concernPerson._id': req.user._id });
		let defaultStatusId = null;
		let defaultSubStatusId = null;

		if (!resolvedStatusId && college) {
			const untouchStatus = await StatusB2b.findOne({
				college: college._id,
				title: { $regex: /^Untouch Leads$/i },
			});
			if (untouchStatus) {
				defaultStatusId = untouchStatus._id;
				if (untouchStatus.substatuses?.length > 0) {
					const untouchSubStatus = untouchStatus.substatuses.find(
						(sub) => sub.title && /^Untouch Leads$/i.test(sub.title)
					);
					defaultSubStatusId = untouchSubStatus?._id || untouchStatus.substatuses[0]._id;
				}
			}
		}

		return {
			statusId: resolvedStatusId || defaultStatusId,
			subStatusId: resolvedSubStatusId || defaultSubStatusId,
		};
	};

	const applyLeadCorePopulates = (query) => query
		.populate({
			path: 'leadCategory',
			select: 'name documents questions isActive b2bDepartment b2bProject typeOfB2B',
			populate: [
				{ path: 'b2bDepartment', select: 'name isActive' },
				{
					path: 'b2bProject',
					select: 'name department isActive',
					populate: { path: 'department', select: 'name isActive' },
				},
				{
					path: 'typeOfB2B',
					select: 'name department isActive',
					populate: { path: 'department', select: 'name isActive' },
				},
			],
		})
		.populate('b2bProject', 'name')
		.populate('b2bDepartment', 'name')
		.populate({
			path: 'typeOfB2B',
			select: 'name department',
			populate: {
				path: 'department',
				select: 'name'
			}
		});

	// AI client (optional): used for supervision report narrative
	const getAnthropicClient = () => {
		const apiKey = process.env.ANTHROPIC_API_KEY;
		if (!apiKey || !apiKey.startsWith("sk-ant-")) return null;
		return new Anthropic({ apiKey });
	};

	const getAnthropicModel = () => {
		if (process.env.ANTHROPIC_MODEL) {
			return process.env.ANTHROPIC_MODEL.split(",").map((m) => m.trim())[0];
		}
		return "claude-3-haiku-20240307";
	};

	const parseJsonResponse = (rawText = "") => {
		let jsonText = rawText;
		const firstBrace = rawText.indexOf("{");
		const lastBrace = rawText.lastIndexOf("}");
		if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
			jsonText = rawText.slice(firstBrace, lastBrace + 1);
		}
		return JSON.parse(jsonText);
	};

	const getCollegeForUser = async (userId) => {
		return College.findOne({ '_concernPerson._id': userId });
	};

	const tryFindStatusByTitleOrMilestone = async ({ collegeId, title, milestone }) => {
		const query = {
			$or: [
				{ college: collegeId },
				{ college: null },
				{ college: { $exists: false } }
			]
		};
		const statuses = await StatusB2b.find(query).sort({ index: 1 }).lean();
		const t = (title || '').trim().toLowerCase();
		const m = (milestone || '').trim().toLowerCase();
		return statuses.find((s) => (t && String(s.title || '').toLowerCase() === t) || (m && String(s.milestone || '').toLowerCase() === m)) || null;
	};

	// ==================== TYPE OF B2B ROUTES ====================

// Get all Type of B2B
router.get('/type-of-b2b', isCollege, async (req, res) => {
	try {
		const { status, department, project } = req.query;
		const query = {};
		if (status !== undefined && status !== '') {
			query.isActive = status === 'true' || status === true;
		}
		if (department && mongoose.Types.ObjectId.isValid(department)) {
			query.department = department;
		} else if (project && mongoose.Types.ObjectId.isValid(project)) {
			const projectDoc = await B2BProject.findById(project).select('department');
			if (projectDoc?.department) {
				query.department = projectDoc.department;
			}
		}

		const types = await TypeOfB2B.find(query)
			.populate({
				path: 'department',
				select: 'name isActive'
			})
			.populate('addedBy', 'name email')
			.sort({ createdAt: -1 });

		res.json({
			status: true,
			data: types,
			message: 'Types of B2B retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting types of B2B:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve types of B2B',
			error: error.message
		});
	}
});

// Get Type of B2B by ID
router.get('/type-of-b2b/:id', isCollege, async (req, res) => {
	try {
		const type = await TypeOfB2B.findById(req.params.id)
			.populate({
				path: 'department',
				select: 'name isActive'
			})
			.populate('addedBy', 'name email');

		if (!type) {
			return res.status(404).json({
				status: false,
				message: 'Type of B2B not found'
			});
		}

		res.json({
			status: true,
			data: type,
			message: 'Type of B2B retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting type of B2B:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve type of B2B',
			error: error.message
		});
	}
});

// Create new Type of B2B
router.post('/type-of-b2b', isCollege, async (req, res) => {
	try {
		const { name, description, department } = req.body;

		if (!name || !String(name).trim()) {
			return res.status(400).json({
				status: false,
				message: 'Name is required'
			});
		}

		if (!department || !mongoose.Types.ObjectId.isValid(department)) {
			return res.status(400).json({
				status: false,
				message: 'Valid B2B department is required'
			});
		}

		const departmentDoc = await B2BDepartment.findById(department);
		if (!departmentDoc) {
			return res.status(400).json({
				status: false,
				message: 'B2B department not found'
			});
		}

		const trimmedName = String(name).trim();
		const existingType = await TypeOfB2B.findOne({ name: trimmedName, department });
		if (existingType) {
			return res.status(400).json({
				status: false,
				message: 'Type of B2B with this name already exists for the selected department'
			});
		}

		const newType = new TypeOfB2B({
			name: trimmedName,
			description,
			department,
			addedBy: req.user._id
		});

		const savedType = await newType.save();
		await savedType.populate([
			{
				path: 'department',
				select: 'name isActive'
			},
			{ path: 'addedBy', select: 'name email' }
		]);

		res.status(201).json({
			status: true,
			data: savedType,
			message: 'Type of B2B created successfully'
		});
	} catch (error) {
		console.error('Error creating type of B2B:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to create type of B2B',
			error: error.message
		});
	}
});

// Update Type of B2B
router.put('/type-of-b2b/:id', isCollege, async (req, res) => {
	try {
		const { name, description, isActive, department } = req.body;
		const typeId = req.params.id;

		const currentType = await TypeOfB2B.findById(typeId);
		if (!currentType) {
			return res.status(404).json({
				status: false,
				message: 'Type of B2B not found'
			});
		}

		const departmentId = department || currentType.department;

		if (department && !mongoose.Types.ObjectId.isValid(department)) {
			return res.status(400).json({
				status: false,
				message: 'Valid B2B department is required'
			});
		}

		if (department) {
			const departmentDoc = await B2BDepartment.findById(department);
			if (!departmentDoc) {
				return res.status(400).json({
					status: false,
					message: 'B2B department not found'
				});
			}
		}

		if (name && departmentId) {
			const trimmedName = String(name).trim();
			const existingType = await TypeOfB2B.findOne({
				name: trimmedName,
				department: departmentId,
				_id: { $ne: typeId }
			});
			if (existingType) {
				return res.status(400).json({
					status: false,
					message: 'Type of B2B with this name already exists for the selected department'
				});
			}
		}

		const updatePayload = {};
		if (name !== undefined) updatePayload.name = String(name).trim();
		if (description !== undefined) updatePayload.description = description;
		if (isActive !== undefined) updatePayload.isActive = isActive;
		if (department !== undefined) updatePayload.department = department;

		const updatedType = await TypeOfB2B.findByIdAndUpdate(
			typeId,
			updatePayload,
			{ new: true, runValidators: true }
		).populate([
			{
				path: 'department',
				select: 'name isActive'
			},
			{ path: 'addedBy', select: 'name email' }
		]);

		res.json({
			status: true,
			data: updatedType,
			message: 'Type of B2B updated successfully'
		});
	} catch (error) {
		console.error('Error updating type of B2B:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to update type of B2B',
			error: error.message
		});
	}
});

router.get('/type-of-b2b/:id/delete-impact', isCollege, async (req, res) => {
	try {
		const typeId = req.params.id;
		const typeDoc = await TypeOfB2B.findById(typeId).select('name department');
		if (!typeDoc) {
			return res.status(404).json({ status: false, message: 'Type of B2B not found' });
		}
		const leads = await Lead.countDocuments({ typeOfB2B: typeId });
		res.json({
			status: true,
			data: {
				entityType: 'type',
				entityId: typeId,
				entityName: typeDoc.name,
				departmentId: typeDoc.department ? String(typeDoc.department) : null,
				leads,
				projects: 0,
				types: 0,
				requiresMove: leads > 0
			}
		});
	} catch (error) {
		handleDeleteError(res, error, 'Failed to fetch delete impact');
	}
});

// Delete Type of B2B
router.delete('/type-of-b2b/:id', isCollege, async (req, res) => {
	try {
		const typeId = req.params.id;
		const { moveLeadsTo } = req.body || {};

		const linkedLeadsCount = await Lead.countDocuments({ typeOfB2B: typeId });

		if (linkedLeadsCount > 0) {
			if (!isValidId(moveLeadsTo?.typeOfB2B)) {
				return res.status(400).json({
					status: false,
					message: `This B2B type is used in ${linkedLeadsCount} lead(s). Select another type to move them before deleting.`,
					data: { leads: linkedLeadsCount, requiresMove: true }
				});
			}
			assertDifferentTarget(typeId, moveLeadsTo.typeOfB2B, 'B2B type');
			const targetType = await TypeOfB2B.findById(moveLeadsTo.typeOfB2B);
			if (!targetType) {
				return res.status(400).json({ status: false, message: 'Target B2B type not found' });
			}
			await Lead.updateMany({ typeOfB2B: typeId }, { $set: { typeOfB2B: targetType._id } });
		}

		const deletedType = await TypeOfB2B.findByIdAndDelete(typeId);

		if (!deletedType) {
			return res.status(404).json({
				status: false,
				message: 'Type of B2B not found'
			});
		}

		res.json({
			status: true,
			message: linkedLeadsCount > 0
				? `Moved ${linkedLeadsCount} lead(s) and deleted B2B type successfully`
				: 'Type of B2B deleted successfully'
		});
	} catch (error) {
		handleDeleteError(res, error, 'Failed to delete type of B2B');
	}
});

// ==================== B2B PROJECT ROUTES ====================

router.get('/b2b-projects', isCollege, async (req, res) => {
	try {
		const { status, department } = req.query;
		const query = {};
		if (status !== undefined && status !== '') {
			query.isActive = status === 'true' || status === true;
		}
		if (department && mongoose.Types.ObjectId.isValid(department)) {
			query.department = department;
		}
		const projects = await B2BProject.find(query)
			.populate('department', 'name isActive')
			.populate('addedBy', 'name email')
			.sort({ createdAt: -1 });

		res.json({
			status: true,
			data: projects,
			message: 'B2B projects retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting B2B projects:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve B2B projects',
			error: error.message
		});
	}
});

router.get('/b2b-projects/:id', isCollege, async (req, res) => {
	try {
		const project = await B2BProject.findById(req.params.id)
			.populate('department', 'name isActive')
			.populate('addedBy', 'name email');

		if (!project) {
			return res.status(404).json({
				status: false,
				message: 'B2B project not found'
			});
		}

		res.json({
			status: true,
			data: project,
			message: 'B2B project retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting B2B project:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve B2B project',
			error: error.message
		});
	}
});

router.post('/b2b-projects', isCollege, async (req, res) => {
	try {
		const { name, description, department } = req.body;

		if (!name || !String(name).trim()) {
			return res.status(400).json({
				status: false,
				message: 'Project name is required'
			});
		}

		if (!department || !mongoose.Types.ObjectId.isValid(department)) {
			return res.status(400).json({
				status: false,
				message: 'Valid B2B department is required'
			});
		}

		const departmentDoc = await B2BDepartment.findById(department);
		if (!departmentDoc) {
			return res.status(400).json({
				status: false,
				message: 'B2B department not found'
			});
		}

		const trimmedName = String(name).trim();
		const existingProject = await B2BProject.findOne({ name: trimmedName, department });
		if (existingProject) {
			return res.status(400).json({
				status: false,
				message: 'B2B project with this name already exists for the selected department'
			});
		}

		const newProject = new B2BProject({
			name: trimmedName,
			description,
			department,
			addedBy: req.user._id
		});

		const savedProject = await newProject.save();
		await savedProject.populate([
			{ path: 'department', select: 'name isActive' },
			{ path: 'addedBy', select: 'name email' }
		]);

		res.status(201).json({
			status: true,
			data: savedProject,
			message: 'B2B project created successfully'
		});
	} catch (error) {
		console.error('Error creating B2B project:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to create B2B project',
			error: error.message
		});
	}
});

router.put('/b2b-projects/:id', isCollege, async (req, res) => {
	try {
		const { name, description, isActive, department } = req.body;
		const projectId = req.params.id;

		const currentProject = await B2BProject.findById(projectId);
		if (!currentProject) {
			return res.status(404).json({
				status: false,
				message: 'B2B project not found'
			});
		}

		const departmentId = department || currentProject.department;

		if (department && !mongoose.Types.ObjectId.isValid(department)) {
			return res.status(400).json({
				status: false,
				message: 'Valid B2B department is required'
			});
		}

		if (department) {
			const departmentDoc = await B2BDepartment.findById(department);
			if (!departmentDoc) {
				return res.status(400).json({
					status: false,
					message: 'B2B department not found'
				});
			}
		}

		if (name) {
			const trimmedName = String(name).trim();
			const existingProject = await B2BProject.findOne({
				name: trimmedName,
				department: departmentId,
				_id: { $ne: projectId }
			});
			if (existingProject) {
				return res.status(400).json({
					status: false,
					message: 'B2B project with this name already exists for the selected department'
				});
			}
		}

		const updatePayload = {};
		if (name !== undefined) updatePayload.name = String(name).trim();
		if (description !== undefined) updatePayload.description = description;
		if (isActive !== undefined) updatePayload.isActive = isActive;
		if (department !== undefined) updatePayload.department = department;

		const updatedProject = await B2BProject.findByIdAndUpdate(
			projectId,
			updatePayload,
			{ new: true, runValidators: true }
		).populate([
			{ path: 'department', select: 'name isActive' },
			{ path: 'addedBy', select: 'name email' }
		]);

		if (!updatedProject) {
			return res.status(404).json({
				status: false,
				message: 'B2B project not found'
			});
		}

		res.json({
			status: true,
			data: updatedProject,
			message: 'B2B project updated successfully'
		});
	} catch (error) {
		console.error('Error updating B2B project:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to update B2B project',
			error: error.message
		});
	}
});

router.get('/b2b-projects/:id/delete-impact', isCollege, async (req, res) => {
	try {
		const projectId = req.params.id;
		const projectDoc = await B2BProject.findById(projectId).select('name department');
		if (!projectDoc) {
			return res.status(404).json({ status: false, message: 'B2B project not found' });
		}
		const leads = await Lead.countDocuments({ b2bProject: projectId });
		res.json({
			status: true,
			data: {
				entityType: 'project',
				entityId: projectId,
				entityName: projectDoc.name,
				departmentId: projectDoc.department ? String(projectDoc.department) : null,
				leads,
				projects: 0,
				types: 0,
				requiresMove: leads > 0
			}
		});
	} catch (error) {
		handleDeleteError(res, error, 'Failed to fetch delete impact');
	}
});

router.delete('/b2b-projects/:id', isCollege, async (req, res) => {
	try {
		const projectId = req.params.id;
		const { moveLeadsTo } = req.body || {};

		const linkedLeadsCount = await Lead.countDocuments({ b2bProject: projectId });

		if (linkedLeadsCount > 0) {
			if (!isValidId(moveLeadsTo?.b2bProject)) {
				return res.status(400).json({
					status: false,
					message: `This project is used in ${linkedLeadsCount} lead(s). Select another project to move them before deleting.`,
					data: { leads: linkedLeadsCount, requiresMove: true }
				});
			}
			assertDifferentTarget(projectId, moveLeadsTo.b2bProject, 'B2B project');
			const targetProject = await B2BProject.findById(moveLeadsTo.b2bProject);
			if (!targetProject) {
				return res.status(400).json({ status: false, message: 'Target B2B project not found' });
			}
			await Lead.updateMany(
				{ b2bProject: projectId },
				{
					$set: {
						b2bProject: targetProject._id,
						b2bDepartment: targetProject.department || null
					}
				}
			);
		}

		const deletedProject = await B2BProject.findByIdAndDelete(projectId);

		if (!deletedProject) {
			return res.status(404).json({
				status: false,
				message: 'B2B project not found'
			});
		}

		res.json({
			status: true,
			message: linkedLeadsCount > 0
				? `Moved ${linkedLeadsCount} lead(s) and deleted B2B project successfully`
				: 'B2B project deleted successfully'
		});
	} catch (error) {
		handleDeleteError(res, error, 'Failed to delete B2B project');
	}
});

// ==================== B2B DEPARTMENT ROUTES ====================

router.get('/b2b-departments', isCollege, async (req, res) => {
	try {
		const { status } = req.query;
		const query = {};

		if (status !== undefined && status !== '') {
			query.isActive = status === 'true' || status === true;
		}

		const departments = await B2BDepartment.find(query)
			.populate('addedBy', 'name email')
			.sort({ createdAt: -1 });

		res.json({
			status: true,
			data: departments,
			message: 'B2B departments retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting B2B departments:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve B2B departments',
			error: error.message
		});
	}
});

router.get('/b2b-departments/:id', isCollege, async (req, res) => {
	try {
		const department = await B2BDepartment.findById(req.params.id)
			.populate('addedBy', 'name email');

		if (!department) {
			return res.status(404).json({
				status: false,
				message: 'B2B department not found'
			});
		}

		res.json({
			status: true,
			data: department,
			message: 'B2B department retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting B2B department:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve B2B department',
			error: error.message
		});
	}
});

router.post('/b2b-departments', isCollege, async (req, res) => {
	try {
		const { name, description } = req.body;

		if (!name || !String(name).trim()) {
			return res.status(400).json({
				status: false,
				message: 'Department name is required'
			});
		}

		const trimmedName = String(name).trim();
		const existingDepartment = await B2BDepartment.findOne({ name: trimmedName });
		if (existingDepartment) {
			return res.status(400).json({
				status: false,
				message: 'Department with this name already exists'
			});
		}

		const newDepartment = new B2BDepartment({
			name: trimmedName,
			description,
			addedBy: req.user._id
		});

		const savedDepartment = await newDepartment.save();
		await savedDepartment.populate([
			{ path: 'addedBy', select: 'name email' }
		]);

		res.status(201).json({
			status: true,
			data: savedDepartment,
			message: 'B2B department created successfully'
		});
	} catch (error) {
		console.error('Error creating B2B department:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to create B2B department',
			error: error.message
		});
	}
});

router.put('/b2b-departments/:id', isCollege, async (req, res) => {
	try {
		const { name, description, isActive } = req.body;
		const departmentId = req.params.id;

		const currentDepartment = await B2BDepartment.findById(departmentId);
		if (!currentDepartment) {
			return res.status(404).json({
				status: false,
				message: 'B2B department not found'
			});
		}

		if (name) {
			const trimmedName = String(name).trim();
			const existingDepartment = await B2BDepartment.findOne({
				name: trimmedName,
				_id: { $ne: departmentId }
			});
			if (existingDepartment) {
				return res.status(400).json({
					status: false,
					message: 'Department with this name already exists'
				});
			}
		}

		const updatePayload = {};
		if (name !== undefined) updatePayload.name = String(name).trim();
		if (description !== undefined) updatePayload.description = description;
		if (isActive !== undefined) updatePayload.isActive = isActive;

		const updatedDepartment = await B2BDepartment.findByIdAndUpdate(
			departmentId,
			updatePayload,
			{ new: true, runValidators: true }
		).populate([
			{ path: 'addedBy', select: 'name email' }
		]);

		res.json({
			status: true,
			data: updatedDepartment,
			message: 'B2B department updated successfully'
		});
	} catch (error) {
		console.error('Error updating B2B department:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to update B2B department',
			error: error.message
		});
	}
});

router.get('/b2b-departments/:id/delete-impact', isCollege, async (req, res) => {
	try {
		const departmentId = req.params.id;
		const departmentDoc = await B2BDepartment.findById(departmentId).select('name');
		if (!departmentDoc) {
			return res.status(404).json({ status: false, message: 'B2B department not found' });
		}

		const deptObjectId = new mongoose.Types.ObjectId(departmentId);
		const [deptProjects, deptTypes, leadGroups, typeLeadGroups, totalLeads] = await Promise.all([
			B2BProject.find({ department: departmentId }).select('name').lean(),
			TypeOfB2B.find({ department: departmentId }).select('name').lean(),
			Lead.aggregate([
				{ $match: { b2bDepartment: deptObjectId } },
				{ $group: { _id: '$b2bProject', leadsCount: { $sum: 1 } } }
			]),
			Lead.aggregate([
				{ $match: { b2bDepartment: deptObjectId, typeOfB2B: { $ne: null } } },
				{ $group: { _id: '$typeOfB2B', leadsCount: { $sum: 1 } } }
			]),
			Lead.countDocuments({ b2bDepartment: departmentId })
		]);

		const leadCountByProject = new Map(
			leadGroups.map((g) => [g._id ? String(g._id) : '__none__', g.leadsCount])
		);
		const leadCountByType = new Map(
			typeLeadGroups.map((g) => [String(g._id), g.leadsCount])
		);

		const projectGroups = deptProjects.map((p) => ({
			projectId: p._id,
			projectName: p.name,
			leadsCount: leadCountByProject.get(String(p._id)) || 0
		}));

		const typeGroups = deptTypes.map((t) => ({
			typeId: t._id,
			typeName: t.name,
			leadsCount: leadCountByType.get(String(t._id)) || 0
		}));

		const orphanLeadsCount = leadCountByProject.get('__none__') || 0;

		res.json({
			status: true,
			data: {
				entityType: 'department',
				entityId: departmentId,
				entityName: departmentDoc.name,
				departmentId,
				leads: totalLeads,
				orphanLeadsCount,
				projects: deptProjects.length,
				types: deptTypes.length,
				projectGroups,
				typeGroups,
				requiresMove: deptProjects.length > 0 || deptTypes.length > 0
			}
		});
	} catch (error) {
		handleDeleteError(res, error, 'Failed to fetch delete impact');
	}
});

router.delete('/b2b-departments/:id', isCollege, async (req, res) => {
	try {
		const departmentId = req.params.id;
		const { moveProjects = [], moveTypes = [] } = req.body || {};

		const deptProjects = await B2BProject.find({ department: departmentId }).select('_id name').lean();
		const deptTypes = await TypeOfB2B.find({ department: departmentId }).select('_id name').lean();
		const linkedLeadsCount = await Lead.countDocuments({ b2bDepartment: departmentId });
		const moveProjectsList = Array.isArray(moveProjects) ? moveProjects : [];
		const moveTypesList = Array.isArray(moveTypes) ? moveTypes : [];

		const orphanLeadsCount = await Lead.countDocuments({
			b2bDepartment: departmentId,
			$or: [{ b2bProject: null }, { b2bProject: { $exists: false } }]
		});
		if (orphanLeadsCount > 0) {
			return res.status(400).json({
				status: false,
				message: `${orphanLeadsCount} lead(s) are not linked to any project in this department. Assign them to a project before deleting.`
			});
		}

		if (deptTypes.length > 0) {
			for (const typeDoc of deptTypes) {
				const mapping = moveTypesList.find(
					(m) => m?.typeId && String(m.typeId) === String(typeDoc._id)
				);
				if (!isValidId(mapping?.toDepartmentId)) {
					return res.status(400).json({
						status: false,
						message: `Select a department to move B2B type "${typeDoc.name}" before deleting.`,
						data: { requiresMove: true }
					});
				}
				assertDifferentTarget(departmentId, mapping.toDepartmentId, 'department');
			}
		}

		for (const mapping of moveTypesList) {
			if (!isValidId(mapping?.typeId) || !isValidId(mapping?.toDepartmentId)) continue;
			const targetDept = await B2BDepartment.findById(mapping.toDepartmentId);
			if (!targetDept) {
				return res.status(400).json({ status: false, message: 'Target department for B2B type not found' });
			}
			await TypeOfB2B.updateOne(
				{ _id: mapping.typeId, department: departmentId },
				{ $set: { department: targetDept._id } }
			);
		}

		if (deptProjects.length > 0) {
			for (const proj of deptProjects) {
				const mapping = moveProjectsList.find(
					(m) => m?.projectId && String(m.projectId) === String(proj._id)
				);
				if (!isValidId(mapping?.toDepartmentId)) {
					return res.status(400).json({
						status: false,
						message: `Select a department to move project "${proj.name}" before deleting.`,
						data: { requiresMove: true }
					});
				}
				assertDifferentTarget(departmentId, mapping.toDepartmentId, 'department');
			}
		}

		for (const mapping of moveProjectsList) {
			if (!isValidId(mapping?.projectId) || !isValidId(mapping?.toDepartmentId)) continue;
			const targetDept = await B2BDepartment.findById(mapping.toDepartmentId);
			if (!targetDept) {
				return res.status(400).json({ status: false, message: 'Target department for project not found' });
			}
			await B2BProject.updateOne(
				{ _id: mapping.projectId, department: departmentId },
				{ $set: { department: targetDept._id } }
			);
			await Lead.updateMany(
				{ b2bProject: mapping.projectId },
				{ $set: { b2bDepartment: targetDept._id } }
			);
		}

		const remainingTypes = await TypeOfB2B.countDocuments({ department: departmentId });
		if (remainingTypes > 0) {
			return res.status(400).json({
				status: false,
				message: `${remainingTypes} B2B type(s) are still linked to this department. Move all types first.`
			});
		}

		const remainingLeads = await Lead.countDocuments({ b2bDepartment: departmentId });
		if (remainingLeads > 0) {
			return res.status(400).json({
				status: false,
				message: `${remainingLeads} lead(s) are still linked to this department. Move all projects first.`
			});
		}

		const deletedDepartment = await B2BDepartment.findByIdAndDelete(departmentId);

		if (!deletedDepartment) {
			return res.status(404).json({
				status: false,
				message: 'B2B department not found'
			});
		}

		const movedParts = [];
		if (deptProjects.length > 0) movedParts.push(`${deptProjects.length} project(s)`);
		if (deptTypes.length > 0) movedParts.push(`${deptTypes.length} B2B type(s)`);
		if (linkedLeadsCount > 0) movedParts.push(`${linkedLeadsCount} lead(s) updated with project`);

		res.json({
			status: true,
			message: movedParts.length
				? `Shifted ${movedParts.join(', ')} and deleted B2B department successfully`
				: 'B2B department deleted successfully'
		});
	} catch (error) {
		handleDeleteError(res, error, 'Failed to delete B2B department');
	}
});

// ==================== LEAD CATEGORY ROUTES ====================

// Get all Lead Categories
router.get('/lead-categories', isCollege, async (req, res) => {
	try {
		const status = req.query.status;
		const query = {};
		if (status) {
			query.isActive = status;
		}
		const categories = await LeadCategory.find(query)
			.populate('addedBy', 'name email')
			.populate('b2bDepartment', 'name isActive')
			.populate('b2bProject', 'name isActive')
			.populate('typeOfB2B', 'name isActive')
			.sort({ createdAt: -1 });

		res.json({
			status: true,
			data: categories,
			message: 'Lead categories retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting lead categories:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve lead categories',
			error: error.message
		});
	}
});

// Get Lead Category by ID
router.get('/lead-categories/:id', isCollege, async (req, res) => {
	try {
		const category = await LeadCategory.findById(req.params.id)
			.populate('addedBy', 'name email')
			.populate('b2bDepartment', 'name isActive')
			.populate('b2bProject', 'name isActive')
			.populate('typeOfB2B', 'name isActive');

		if (!category) {
			return res.status(404).json({
				status: false,
				message: 'Lead category not found'
			});
		}

		res.json({
			status: true,
			data: category,
			message: 'Lead category retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting lead category:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve lead category',
			error: error.message
		});
	}
});

// Create new Lead Category
router.post('/lead-categories', isCollege, async (req, res) => {
	try {
		const { name, description, documents, questions, b2bDepartment, b2bProject, typeOfB2B } = req.body;

		// Validate required fields
		if (!name) {
			return res.status(400).json({
				status: false,
				message: 'Name is required'
			});
		}

		const safeDocuments = Array.isArray(documents)
			? documents
				.map((d) => ({
					name: String(d?.name || '').trim(),
					isMandatory: Boolean(d?.isMandatory)
				}))
				.filter((d) => d.name)
			: [];

		const safeQuestions = Array.isArray(questions)
			? questions.map((q) => {
				const t = q?.type;
				const type = ['text', 'number', 'radio', 'date'].includes(t) ? t : 'text';
				const options = Array.isArray(q?.options)
					? q.options.map((o) => String(o || '').trim()).filter(Boolean)
					: [];
				return {
					question: String(q?.question || '').trim(),
					type,
					required: Boolean(q?.required),
					options: type === 'radio' ? options : [],
					...(type === 'text' || type === 'number'
						? { placeholder: String(q?.placeholder || '').trim() }
						: {})
				};
			}).filter((q) => q.question)
			: [];

		// Check if name already exists
		const existingCategory = await LeadCategory.findOne({ name });
		if (existingCategory) {
			return res.status(400).json({
				status: false,
				message: 'Lead category with this name already exists'
			});
		}

		const newCategory = new LeadCategory({
			name,
			description,
			documents: safeDocuments,
			questions: safeQuestions,
			...(b2bDepartment && mongoose.Types.ObjectId.isValid(b2bDepartment) ? { b2bDepartment } : {}),
			...(b2bProject && mongoose.Types.ObjectId.isValid(b2bProject) ? { b2bProject } : {}),
			...(typeOfB2B && mongoose.Types.ObjectId.isValid(typeOfB2B) ? { typeOfB2B } : {}),
			addedBy: req.user._id
		});

		const savedCategory = await newCategory.save();
		await savedCategory.populate([
			{ path: 'addedBy', select: 'name email' },
			{ path: 'b2bDepartment', select: 'name isActive' },
			{ path: 'b2bProject', select: 'name isActive' },
			{ path: 'typeOfB2B', select: 'name isActive' },
		]);

		res.status(201).json({
			status: true,
			data: savedCategory,
			message: 'Lead category created successfully'
		});
	} catch (error) {
		console.error('Error creating lead category:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to create lead category',
			error: error.message
		});
	}
});

// Update Lead Category
router.put('/lead-categories/:id', isCollege, async (req, res) => {
	try {
		const { name, description, isActive, documents, questions, b2bDepartment, b2bProject, typeOfB2B } = req.body;

		// Check if name already exists (excluding current record)
		if (name) {
			const existingCategory = await LeadCategory.findOne({
				name,
				_id: { $ne: req.params.id }
			});
			if (existingCategory) {
				return res.status(400).json({
					status: false,
					message: 'Lead category with this name already exists'
				});
			}
		}

		const updatePayload = {};
		if (name !== undefined) updatePayload.name = name;
		if (description !== undefined) updatePayload.description = description;
		if (isActive !== undefined) updatePayload.isActive = isActive;
		if (documents !== undefined) {
			updatePayload.documents = Array.isArray(documents)
				? documents
					.map((d) => ({
						name: String(d?.name || '').trim(),
						isMandatory: Boolean(d?.isMandatory)
					}))
					.filter((d) => d.name)
				: [];
		}
		if (questions !== undefined) {
			updatePayload.questions = Array.isArray(questions)
				? questions.map((q) => {
					const t = q?.type;
					const type = ['text', 'number', 'radio', 'date'].includes(t) ? t : 'text';
					const options = Array.isArray(q?.options)
						? q.options.map((o) => String(o || '').trim()).filter(Boolean)
						: [];
					return {
						question: String(q?.question || '').trim(),
						type,
						required: Boolean(q?.required),
						options: type === 'radio' ? options : [],
						...(type === 'text' || type === 'number'
							? { placeholder: String(q?.placeholder || '').trim() }
							: {})
					};
				}).filter((q) => q.question)
				: [];
		}
		if (b2bDepartment !== undefined) {
			updatePayload.b2bDepartment =
				b2bDepartment && mongoose.Types.ObjectId.isValid(b2bDepartment) ? b2bDepartment : null;
		}
		if (b2bProject !== undefined) {
			updatePayload.b2bProject =
				b2bProject && mongoose.Types.ObjectId.isValid(b2bProject) ? b2bProject : null;
		}
		if (typeOfB2B !== undefined) {
			updatePayload.typeOfB2B =
				typeOfB2B && mongoose.Types.ObjectId.isValid(typeOfB2B) ? typeOfB2B : null;
		}

		const updatedCategory = await LeadCategory.findByIdAndUpdate(
			req.params.id,
			updatePayload,
			{ new: true, runValidators: true }
		)
			.populate('addedBy', 'name email')
			.populate('b2bDepartment', 'name isActive')
			.populate('b2bProject', 'name isActive')
			.populate('typeOfB2B', 'name isActive');

		if (!updatedCategory) {
			return res.status(404).json({
				status: false,
				message: 'Lead category not found'
			});
		}

		res.json({
			status: true,
			data: updatedCategory,
			message: 'Lead category updated successfully'
		});
	} catch (error) {
		console.error('Error updating lead category:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to update lead category',
			error: error.message
		});
	}
});

router.get('/lead-categories/:id/delete-impact', isCollege, async (req, res) => {
	try {
		const categoryId = req.params.id;
		const categoryDoc = await LeadCategory.findById(categoryId).select('name');
		if (!categoryDoc) {
			return res.status(404).json({ status: false, message: 'Lead category not found' });
		}
		const leads = await Lead.countDocuments({ leadCategory: categoryId });
		res.json({
			status: true,
			data: {
				entityType: 'source',
				entityId: categoryId,
				entityName: categoryDoc.name,
				leads,
				projects: 0,
				types: 0,
				requiresMove: leads > 0
			}
		});
	} catch (error) {
		handleDeleteError(res, error, 'Failed to fetch delete impact');
	}
});

// Delete Lead Category
router.delete('/lead-categories/:id', isCollege, async (req, res) => {
	try {
		const categoryId = req.params.id;
		const { moveLeadsTo } = req.body || {};

		const linkedLeadsCount = await Lead.countDocuments({ leadCategory: categoryId });

		if (linkedLeadsCount > 0) {
			if (!isValidId(moveLeadsTo?.leadCategory)) {
				return res.status(400).json({
					status: false,
					message: `This source is used in ${linkedLeadsCount} lead(s). Select another source to move them before deleting.`,
					data: { leads: linkedLeadsCount, requiresMove: true }
				});
			}
			assertDifferentTarget(categoryId, moveLeadsTo.leadCategory, 'lead source');
			const targetCategory = await LeadCategory.findById(moveLeadsTo.leadCategory);
			if (!targetCategory) {
				return res.status(400).json({ status: false, message: 'Target lead source not found' });
			}
			await Lead.updateMany({ leadCategory: categoryId }, { $set: { leadCategory: targetCategory._id } });
		}

		const deletedCategory = await LeadCategory.findByIdAndDelete(categoryId);

		if (!deletedCategory) {
			return res.status(404).json({
				status: false,
				message: 'Lead category not found'
			});
		}

		res.json({
			status: true,
			message: linkedLeadsCount > 0
				? `Moved ${linkedLeadsCount} lead(s) and deleted lead source successfully`
				: 'Lead category deleted successfully'
		});
	} catch (error) {
		handleDeleteError(res, error, 'Failed to delete lead category');
	}
});

// ==================== B2B LEAD MANAGEMENT ROUTES ====================

// Get all leads with filtering and pagination
// Get leads status count
router.get('/leads/status-count', isCollege, async (req, res) => {
	try {
		// Extract filter parameters from query
		const {
			leadCategory,
			leadCategoryIn,
			typeOfB2B,
			typeOfB2BIn,
			b2bProject,
			b2bProjectIn,
			b2bDepartment,
			b2bDepartmentIn,
			search,
			subStatus,
			subStatusIn,
			startDate,
			endDate,
			modifiedFromDate,
			modifiedToDate,
			nextActionFromDate,
			nextActionToDate,
			leadOwner,
			leadOwnerIn,
			statusIn,
			hasFollowUpCall,
			hasFollowUpVisit,
			followUpCallBucket,
			followUpVisitBucket,
			documentsStatusIn,
			approvalStatus,
			referredByMe
		} = req.query;

		const referredByMeActive = isReferredByMeQuery(referredByMe);

		// Check if user is Admin - only Admin can view all B2B leads
		const isAdmin = () => {
			const permissionType = req.user.permissions?.permission_type;
			return permissionType === 'Admin';
		};

		let ownershipConditions = [];

		// Only apply team member filter if user is not Admin
		// Admin can view all leads, others can only view their team members' leads
		if (!referredByMeActive && !isAdmin()) {
			let teamMembers = await getAllTeamMembers(req.user._id);
			// Ownership Conditions for team members
			ownershipConditions = teamMembers.map(member => ({
				$or: [{ leadAddedBy: member }, { leadOwner: member }]
			}));
		}

		// Convert string IDs to ObjectId for MongoDB query
		const convertToObjectId = (id) => {
			if (!id) return null;
			if (mongoose.Types.ObjectId.isValid(id)) {
				return new mongoose.Types.ObjectId(id);
			}
			return id;
		};

		const parseIdList = (csv) =>
			String(csv || '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.map((id) => convertToObjectId(id))
				.filter(Boolean);

		// Search functionality conditions
		const searchConditions = search
			? {
				$or: [
					{ concernPersonName: { $regex: search, $options: 'i' } },
					{ businessName: { $regex: search, $options: 'i' } },
					{ email: { $regex: search, $options: 'i' } },
					{ mobile: { $regex: search, $options: 'i' } }
				]
			}
			: {};

		// Build filter conditions (follow-up bucket filters applied separately)
		const filterConditions = [];
		const followupBucketFilters = [];

		if (referredByMeActive) {
			filterConditions.push(getReferredByMeFilter(req.user._id));
		}

		if (followUpCallBucket) {
			const bucketFilter = await resolveFollowupBucketLeadFilter('call', followUpCallBucket);
			if (bucketFilter) followupBucketFilters.push(bucketFilter);
		}
		if (followUpVisitBucket) {
			const bucketFilter = await resolveFollowupBucketLeadFilter('visit', followUpVisitBucket);
			if (bucketFilter) followupBucketFilters.push(bucketFilter);
		}
		const nextActionDateFilter = await resolveNextActionDateLeadFilter(nextActionFromDate, nextActionToDate);
		if (nextActionDateFilter) followupBucketFilters.push(nextActionDateFilter);

		// Other filters - Convert to ObjectId if valid
		if (leadCategoryIn) {
			const ids = parseIdList(leadCategoryIn);
			if (ids.length) filterConditions.push({ leadCategory: { $in: ids } });
		} else if (leadCategory) {
			filterConditions.push({ leadCategory: convertToObjectId(leadCategory) });
		}

		if (typeOfB2BIn) {
			const ids = parseIdList(typeOfB2BIn);
			if (ids.length) filterConditions.push({ typeOfB2B: { $in: ids } });
		} else if (typeOfB2B) {
			filterConditions.push({ typeOfB2B: convertToObjectId(typeOfB2B) });
		}

		if (b2bProjectIn) {
			const ids = parseIdList(b2bProjectIn);
			if (ids.length) filterConditions.push({ b2bProject: { $in: ids } });
		} else if (b2bProject) {
			filterConditions.push({ b2bProject: convertToObjectId(b2bProject) });
		}

		if (b2bDepartmentIn) {
			const ids = parseIdList(b2bDepartmentIn);
			if (ids.length) filterConditions.push({ b2bDepartment: { $in: ids } });
		} else if (b2bDepartment) {
			filterConditions.push({ b2bDepartment: convertToObjectId(b2bDepartment) });
		}

		if (subStatusIn) {
			const ids = parseIdList(subStatusIn);
			if (ids.length) filterConditions.push({ subStatus: { $in: ids } });
		} else if (subStatus) {
			filterConditions.push({ subStatus: convertToObjectId(subStatus) });
		}
		
		// Date range filters
		const createdAtFilter = buildLeadDateRangeCondition('createdAt', startDate, endDate);
		if (createdAtFilter) filterConditions.push(createdAtFilter);
		const updatedAtFilter = buildLeadDateRangeCondition('updatedAt', modifiedFromDate, modifiedToDate);
		if (updatedAtFilter) filterConditions.push(updatedAtFilter);
		
		// Lead owner filter - check both leadOwner and leadAddedBy
		if (leadOwnerIn) {
			const ids = parseIdList(leadOwnerIn);
			if (ids.length) {
				filterConditions.push({
					$or: [
						{ leadOwner: { $in: ids } },
						{ leadAddedBy: { $in: ids } }
					]
				});
			}
		} else if (leadOwner) {
			filterConditions.push({
				$or: [
					{ leadOwner: convertToObjectId(leadOwner) },
					{ leadAddedBy: convertToObjectId(leadOwner) }
				]
			});
		}

		// Approval filter (PENDING / APPROVED / REJECTED)
		if (approvalStatus) {
			filterConditions.push({ 'approval.status': String(approvalStatus).toUpperCase() });
		}

		// Status multi-filter (used by frontend filter modal "Status")
		if (statusIn) {
			const ids = parseIdList(statusIn);
			if (ids.length) filterConditions.push({ status: { $in: ids } });
		}

		// Follow-up existence filters
		if (String(hasFollowUpCall).toLowerCase() === 'true') {
			filterConditions.push({ followUpCall: { $exists: true, $ne: null } });
		}
		if (String(hasFollowUpVisit).toLowerCase() === 'true') {
			filterConditions.push({ followUpVisit: { $exists: true, $ne: null } });
		}

		// Documents status filter (done/pending)
		if (documentsStatusIn) {
			const list = String(documentsStatusIn).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
			const wantsDone = list.includes('done');
			const wantsPending = list.includes('pending');
			const doneCond = {
				'documents.0': { $exists: true },
				documents: { $not: { $elemMatch: { status: { $ne: 'APPROVED' } } } }
			};
			const pendingCond = {
				$or: [
					{ 'documents.0': { $exists: false } },
					{ documents: { $elemMatch: { status: { $ne: 'APPROVED' } } } }
				]
			};
			if (wantsDone && wantsPending) {
				// no-op (both selected means all)
			} else if (wantsDone) {
				filterConditions.push(doneCond);
			} else if (wantsPending) {
				filterConditions.push(pendingCond);
			}
		}

		// Base query without follow-up bucket (for dashboard card counts)
		const baseQueryCore = {
			$and: [
				...(ownershipConditions.length > 0 ? [{ $or: ownershipConditions.flatMap(c => c.$or || [c]) }] : []),
				...(search ? [searchConditions] : []),
				...filterConditions
			]
		};

		if (baseQueryCore.$and.length === 0) {
			delete baseQueryCore.$and;
		}

		const baseQuery = followupBucketFilters.length
			? mergeLeadQuery(baseQueryCore, followupBucketFilters.length === 1
				? followupBucketFilters[0]
				: { $and: followupBucketFilters })
			: baseQueryCore;

		const followupDashboardCounts = await buildFollowupDashboardCounts(baseQueryCore);

		// Get all statuses for the college
		const StatusB2b = require("../../../models/statusB2b");
		const College = require("../../../models/college");

		// Find the college that has this user as a concern person
		const college = await College.findOne({
			'_concernPerson._id': req.user._id
		});

		if (!college) {
			return res.status(400).json({
				status: false,
				message: 'College not found for this user'
			});
		}

		const statuses = await StatusB2b.find({ college: college._id }).sort({ index: 1 });

		// Get total count
		const totalLeads = await Lead.countDocuments(baseQuery);

		// Get count by status
		const statusCounts = await Promise.all(
			statuses.map(async (status) => {
				const count = await Lead.countDocuments({
					...baseQuery,
					status: status._id
				});
				return {
					statusId: status._id,
					statusName: status.title,
					statusIndex: status.index,
					count: count
				};
			})
		);

		// Get count for leads without status (null status)
		const nullStatusCount = await Lead.countDocuments({
			...baseQuery,
			status: null
		});

		// Add null status to the results if there are leads without status
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
				totalLeads,
				collegeId: college._id,
				followupDashboardCounts
			},
			message: 'Lead status counts retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting lead status counts:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve lead status counts',
			error: error.message
		});
	}
});

const generateSupervisionReportData = async (req) => {
	const {
		startDate,
		endDate,
		status,
		statusIn,
		typeOfB2B,
		typeOfB2BIn,
		leadCategory,
		leadCategoryIn,
		leadOwner,
		leadOwnerIn,
		approvalStatus,
		search,
		subStatus,
		subStatusIn
	} = req.query;

	// Admin can view all, others limited to team members
	const isAdmin = () => req.user.permissions?.permission_type === 'Admin';

	const convertToObjectId = (id) => {
		if (!id) return null;
		if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
		return id;
	};

	const parseIdList = (csv) =>
		String(csv || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.map((id) => convertToObjectId(id))
			.filter(Boolean);

	const filterAnd = [];

	// Date range filters (createdAt)
	if (startDate || endDate) {
		const created = {};
		if (startDate) created.$gte = new Date(startDate);
		if (endDate) created.$lte = new Date(endDate);
		filterAnd.push({ createdAt: created });
	}

	// Search (basic)
	if (search) {
		filterAnd.push({
			$or: [
				{ concernPersonName: { $regex: search, $options: 'i' } },
				{ businessName: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
				{ mobile: { $regex: search, $options: 'i' } }
			]
		});
	}

	// ID filters
	if (leadCategoryIn) {
		const ids = parseIdList(leadCategoryIn);
		if (ids.length) filterAnd.push({ leadCategory: { $in: ids } });
	} else if (leadCategory) {
		filterAnd.push({ leadCategory: convertToObjectId(leadCategory) });
	}

	if (typeOfB2BIn) {
		const ids = parseIdList(typeOfB2BIn);
		if (ids.length) filterAnd.push({ typeOfB2B: { $in: ids } });
	} else if (typeOfB2B) {
		filterAnd.push({ typeOfB2B: convertToObjectId(typeOfB2B) });
	}

	if (statusIn) {
		const ids = parseIdList(statusIn);
		if (ids.length) filterAnd.push({ status: { $in: ids } });
	} else if (status) {
		filterAnd.push({ status: convertToObjectId(status) });
	}

	if (subStatusIn) {
		const ids = parseIdList(subStatusIn);
		if (ids.length) filterAnd.push({ subStatus: { $in: ids } });
	} else if (subStatus) {
		filterAnd.push({ subStatus: convertToObjectId(subStatus) });
	}

	if (leadOwnerIn) {
		const ids = parseIdList(leadOwnerIn);
		if (ids.length) filterAnd.push({ leadOwner: { $in: ids } });
	} else if (leadOwner) {
		filterAnd.push({ leadOwner: convertToObjectId(leadOwner) });
	}

	if (approvalStatus) {
		filterAnd.push({ 'approval.status': String(approvalStatus).toUpperCase() });
	}

	// Ownership restriction for non-admin
	if (!isAdmin()) {
		const teamMembers = await getAllTeamMembers(req.user._id);
		const team = (teamMembers || []).filter(Boolean);
		filterAnd.push({
			$or: [
				{ leadAddedBy: { $in: team } },
				{ leadOwner: { $in: team } }
			]
		});
	}

	const matchStage = filterAnd.length ? { $and: filterAnd } : {};
	const now = new Date();

	const pipeline = [
		{ $match: matchStage },
		{
			$lookup: {
				from: 'followups',
				localField: 'followUpCall',
				foreignField: '_id',
				as: 'followUpCallObj'
			}
		},
		{ $unwind: { path: '$followUpCallObj', preserveNullAndEmptyArrays: true } },
		{
			$lookup: {
				from: 'followups',
				localField: 'followUpVisit',
				foreignField: '_id',
				as: 'followUpVisitObj'
			}
		},
		{ $unwind: { path: '$followUpVisitObj', preserveNullAndEmptyArrays: true } },
		{
			$addFields: {
				_counsellor: { $ifNull: ['$leadOwner', '$leadAddedBy'] },
				callStatus: { $ifNull: ['$followUpCallObj.status', null] },
				visitStatus: { $ifNull: ['$followUpVisitObj.status', null] },
				callScheduledDate: { $ifNull: ['$followUpCallObj.scheduledDate', null] },
				visitScheduledDate: { $ifNull: ['$followUpVisitObj.scheduledDate', null] },
				docsPendingCount: {
					$size: {
						$filter: {
							input: { $ifNull: ['$documents', []] },
							as: 'd',
							cond: { $in: ['$$d.status', ['PENDING', 'REJECTED']] }
						}
					}
				},
				docsApprovedCount: {
					$size: {
						$filter: {
							input: { $ifNull: ['$documents', []] },
							as: 'd',
							cond: { $eq: ['$$d.status', 'APPROVED'] }
						}
					}
				}
			}
		},
		{
			$facet: {
				overall: [
					{
						$group: {
							_id: null,
							totalLeads: { $sum: 1 },
							approvalPending: { $sum: { $cond: [{ $eq: ['$approval.status', 'PENDING'] }, 1, 0] } },
							approvalApproved: { $sum: { $cond: [{ $eq: ['$approval.status', 'APPROVED'] }, 1, 0] } },
							approvalRejected: { $sum: { $cond: [{ $eq: ['$approval.status', 'REJECTED'] }, 1, 0] } },
							callDone: { $sum: { $cond: [{ $eq: ['$callStatus', 'Completed'] }, 1, 0] } },
							callPending: { $sum: { $cond: [{ $eq: ['$callStatus', 'Pending'] }, 1, 0] } },
							visitDone: { $sum: { $cond: [{ $eq: ['$visitStatus', 'Completed'] }, 1, 0] } },
							visitPending: { $sum: { $cond: [{ $eq: ['$visitStatus', 'Pending'] }, 1, 0] } },
							overdueCall: {
								$sum: {
									$cond: [
										{
											$and: [
												{ $eq: ['$callStatus', 'Pending'] },
												{ $ne: ['$callScheduledDate', null] },
												{ $lt: ['$callScheduledDate', now] }
											]
										},
										1,
										0
									]
								}
							},
							overdueVisit: {
								$sum: {
									$cond: [
										{
											$and: [
												{ $eq: ['$visitStatus', 'Pending'] },
												{ $ne: ['$visitScheduledDate', null] },
												{ $lt: ['$visitScheduledDate', now] }
											]
										},
										1,
										0
									]
								}
							},
							docsPendingTotal: { $sum: '$docsPendingCount' },
							docsApprovedTotal: { $sum: '$docsApprovedCount' }
						}
					}
				],
				byCounsellor: [
					{
						$group: {
							_id: '$_counsellor',
							totalLeads: { $sum: 1 },
							addedByMe: { $sum: { $cond: [{ $eq: ['$leadAddedBy', '$_counsellor'] }, 1, 0] } },
							ownedByMe: { $sum: { $cond: [{ $eq: ['$leadOwner', '$_counsellor'] }, 1, 0] } },
							approvalPending: { $sum: { $cond: [{ $eq: ['$approval.status', 'PENDING'] }, 1, 0] } },
							approvalApproved: { $sum: { $cond: [{ $eq: ['$approval.status', 'APPROVED'] }, 1, 0] } },
							approvalRejected: { $sum: { $cond: [{ $eq: ['$approval.status', 'REJECTED'] }, 1, 0] } },
							callDone: { $sum: { $cond: [{ $eq: ['$callStatus', 'Completed'] }, 1, 0] } },
							callPending: { $sum: { $cond: [{ $eq: ['$callStatus', 'Pending'] }, 1, 0] } },
							visitDone: { $sum: { $cond: [{ $eq: ['$visitStatus', 'Completed'] }, 1, 0] } },
							visitPending: { $sum: { $cond: [{ $eq: ['$visitStatus', 'Pending'] }, 1, 0] } },
							overdueCall: {
								$sum: {
									$cond: [
										{
											$and: [
												{ $eq: ['$callStatus', 'Pending'] },
												{ $ne: ['$callScheduledDate', null] },
												{ $lt: ['$callScheduledDate', now] }
											]
										},
										1,
										0
									]
								}
							},
							overdueVisit: {
								$sum: {
									$cond: [
										{
											$and: [
												{ $eq: ['$visitStatus', 'Pending'] },
												{ $ne: ['$visitScheduledDate', null] },
												{ $lt: ['$visitScheduledDate', now] }
											]
										},
										1,
										0
									]
								}
							},
							docsPendingTotal: { $sum: '$docsPendingCount' },
							docsApprovedTotal: { $sum: '$docsApprovedCount' }
						}
					},
					{
						$lookup: {
							from: 'users',
							localField: '_id',
							foreignField: '_id',
							as: 'user'
						}
					},
					{ $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
					{
						$project: {
							_id: 0,
							counsellorId: '$_id',
							counsellorName: { $ifNull: ['$user.name', 'Unassigned'] },
							counsellorEmail: { $ifNull: ['$user.email', ''] },
							totalLeads: 1,
							addedByMe: 1,
							ownedByMe: 1,
							approvalPending: 1,
							approvalApproved: 1,
							approvalRejected: 1,
							callDone: 1,
							callPending: 1,
							visitDone: 1,
							visitPending: 1,
							overdueCall: 1,
							overdueVisit: 1,
							docsPendingTotal: 1,
							docsApprovedTotal: 1
						}
					},
					{ $sort: { totalLeads: -1 } }
				],
				byStatus: [
					{
						$group: {
							_id: '$status',
							totalLeads: { $sum: 1 },
							approvalPending: { $sum: { $cond: [{ $eq: ['$approval.status', 'PENDING'] }, 1, 0] } },
							overdueCall: {
								$sum: {
									$cond: [
										{
											$and: [
												{ $eq: ['$callStatus', 'Pending'] },
												{ $ne: ['$callScheduledDate', null] },
												{ $lt: ['$callScheduledDate', now] }
											]
										},
										1,
										0
									]
								}
							}
						}
					},
					{
						$lookup: {
							from: 'statusb2bs',
							localField: '_id',
							foreignField: '_id',
							as: 'st'
						}
					},
					{ $unwind: { path: '$st', preserveNullAndEmptyArrays: true } },
					{
						$project: {
							_id: 0,
							statusId: '$_id',
							statusName: { $ifNull: ['$st.title', 'Unknown'] },
							totalLeads: 1,
							approvalPending: 1,
							overdueCall: 1
						}
					},
					{ $sort: { totalLeads: -1 } }
				],
				byType: [
					{
						$group: {
							_id: '$typeOfB2B',
							totalLeads: { $sum: 1 },
							overdueCall: {
								$sum: {
									$cond: [
										{
											$and: [
												{ $eq: ['$callStatus', 'Pending'] },
												{ $ne: ['$callScheduledDate', null] },
												{ $lt: ['$callScheduledDate', now] }
											]
										},
										1,
										0
									]
								}
							}
						}
					},
					{
						$lookup: {
							from: 'typeofb2bs',
							localField: '_id',
							foreignField: '_id',
							as: 'tp'
						}
					},
					{ $unwind: { path: '$tp', preserveNullAndEmptyArrays: true } },
					{
						$project: {
							_id: 0,
							typeId: '$_id',
							typeName: { $ifNull: ['$tp.name', 'Unknown'] },
							totalLeads: 1,
							overdueCall: 1
						}
					},
					{ $sort: { totalLeads: -1 } }
				]
			}
		}
	];

	const [result] = await Lead.aggregate(pipeline);
	const overall = (result?.overall || [])[0] || {
		totalLeads: 0,
		approvalPending: 0,
		approvalApproved: 0,
		approvalRejected: 0,
		callDone: 0,
		callPending: 0,
		visitDone: 0,
		visitPending: 0,
		overdueCall: 0,
		overdueVisit: 0,
		docsPendingTotal: 0,
		docsApprovedTotal: 0
	};

	return {
		filtersApplied: {
			startDate: startDate || null,
			endDate: endDate || null,
			status: status || null,
			statusIn: statusIn || null,
			typeOfB2B: typeOfB2B || null,
			typeOfB2BIn: typeOfB2BIn || null,
			leadCategory: leadCategory || null,
			leadCategoryIn: leadCategoryIn || null,
			leadOwner: leadOwner || null,
			leadOwnerIn: leadOwnerIn || null,
			approvalStatus: approvalStatus || null
		},
		overall,
		byCounsellor: result?.byCounsellor || [],
		byStatus: result?.byStatus || [],
		byType: result?.byType || []
	};
};

// Supervision report: counsellor/team performance + pipeline gaps (filters supported)
router.get('/leads/supervision-report', isCollege, async (req, res) => {
	try {
		const data = await generateSupervisionReportData(req);
		return res.json({
			status: true,
			data,
			message: 'Supervision report generated successfully'
		});
	} catch (error) {
		console.error('Error generating supervision report:', error);
		return res.status(500).json({
			status: false,
			message: 'Failed to generate supervision report',
			error: error.message
		});
	}
});

// AI Supervision report (full detailed narrative + coaching actions)
router.get('/leads/supervision-report-ai', isCollege, async (req, res) => {
	try {
		const anthropic = getAnthropicClient();
		if (!anthropic) {
			return res.status(500).json({
				status: false,
				message: "AI service not configured. Please set ANTHROPIC_API_KEY on server."
			});
		}

		const metrics = await generateSupervisionReportData(req);

		const systemPrompt = `
You are an AI supervisor for a B2B sales CRM team.
You will receive supervision metrics for leads (approvals, follow-ups, overdue, documents) grouped by counsellor/status/type.
Your job is to generate a detailed management report that highlights:
- where counsellors are lacking
- where pipeline is stuck
- what improvements are needed
- an action plan for the next 7 days

Return ONLY valid JSON. No extra text.`;

		const userPrompt = `
Supervision metrics JSON:
${JSON.stringify(metrics, null, 2)}

Return JSON in exactly this shape:
{
  "title": string,
  "dateRange": string,
  "executiveSummary": string,            // 6-12 bullets as ONE string (\\n separated)
  "topRisks": string[],                  // 3-8
  "wins": string[],                      // 2-8
  "kpiSnapshot": {
    "totalLeads": number,
    "approvalPending": number,
    "overdueCall": number,
    "overdueVisit": number,
    "docsPendingTotal": number
  },
  "counsellorInsights": [
    {
      "counsellorName": string,
      "summary": string,                 // 3-6 bullets as ONE string
      "gaps": string[],                  // 2-6
      "recommendedActions": string[],    // 3-8
      "focusKpis": {
        "approvalPending": number,
        "overdueCall": number,
        "overdueVisit": number,
        "docsPendingTotal": number
      }
    }
  ],
  "statusInsights": string[],            // bullets
  "typeInsights": string[],              // bullets
  "next7DaysPlan": string[]              // 6-12 concrete actions
}`;

		const message = await anthropic.messages.create({
			model: getAnthropicModel(),
			max_tokens: 900,
			temperature: 0.2,
			system: systemPrompt,
			messages: [{ role: "user", content: userPrompt }]
		});

		const raw = message?.content?.[0]?.text || "";
		let parsed;
		try {
			parsed = parseJsonResponse(raw);
		} catch (e) {
			console.warn("[AI supervision-report-ai] Failed to parse JSON:", e.message);
			return res.status(500).json({
				status: false,
				message: "Failed to parse AI response",
				raw
			});
		}

		return res.json({
			status: true,
			data: {
				metrics,
				aiReport: parsed
			},
			message: "AI supervision report generated successfully"
		});
	} catch (error) {
		console.error('Error generating AI supervision report:', error);
		return res.status(500).json({
			status: false,
			message: 'Failed to generate AI supervision report',
			error: error.message
		});
	}
});

router.get('/leads', isCollege, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			status,
			statusIn,
			leadCategory,
			leadCategoryIn,
			typeOfB2B,
			typeOfB2BIn,
			b2bProject,
			b2bProjectIn,
			b2bDepartment,
			b2bDepartmentIn,
			search,
			sortBy = 'updatedAt',
			sortOrder = 'desc',
			subStatus,
			subStatusIn,
			startDate,
			endDate,
			modifiedFromDate,
			modifiedToDate,
			nextActionFromDate,
			nextActionToDate,
			leadOwner,
			leadOwnerIn,
			hasFollowUpCall,
			hasFollowUpVisit,
			followUpCallBucket,
			followUpVisitBucket,
			documentsStatusIn,
			approvalStatus,
			referredByMe
		} = req.query;

		const referredByMeActive = isReferredByMeQuery(referredByMe);

		// Check if user is Admin - only Admin can view all B2B leads
		const isAdmin = () => {
			const permissionType = req.user.permissions?.permission_type;
			return permissionType === 'Admin';
		};

		const query = {};
		let ownershipConditions = [];

		const followupBucketFilters = [];
		if (followUpCallBucket) {
			const bucketFilter = await resolveFollowupBucketLeadFilter('call', followUpCallBucket);
			if (bucketFilter) followupBucketFilters.push(bucketFilter);
		}
		if (followUpVisitBucket) {
			const bucketFilter = await resolveFollowupBucketLeadFilter('visit', followUpVisitBucket);
			if (bucketFilter) followupBucketFilters.push(bucketFilter);
		}
		const nextActionDateFilter = await resolveNextActionDateLeadFilter(nextActionFromDate, nextActionToDate);
		if (nextActionDateFilter) followupBucketFilters.push(nextActionDateFilter);

		// Only apply team member filter if user is not Admin
		// Admin can view all leads, others can only view their team members' leads
		if (!referredByMeActive && !isAdmin()) {
			let teamMembers = await getAllTeamMembers(req.user._id);
			// Ownership Conditions for team members
			ownershipConditions = teamMembers.map(member => ({
				$or: [{ leadAddedBy: member }, { leadOwner: member }]
			}));
		}

		// Search functionality conditions
		const searchConditions = search
			? {
				$or: [
					{ concernPersonName: { $regex: search, $options: 'i' } },
					{ businessName: { $regex: search, $options: 'i' } },
					{ email: { $regex: search, $options: 'i' } },
					{ mobile: { $regex: search, $options: 'i' } }
				]
			}
			: {};

		// Convert string IDs to ObjectId for MongoDB query
		const convertToObjectId = (id) => {
			if (!id) return null;
			if (mongoose.Types.ObjectId.isValid(id)) {
				return new mongoose.Types.ObjectId(id);
			}
			return id;
		};

		const parseIdList = (csv) =>
			String(csv || '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.map((id) => convertToObjectId(id))
				.filter(Boolean);

		// Build the final query
		const finalQuery = {
			$and: [
				// Ownership condition (only if user doesn't have view all permission)
				...(ownershipConditions.length > 0 ? [{ $or: ownershipConditions.flatMap(c => c.$or) }] : []),
				...(referredByMeActive ? [getReferredByMeFilter(req.user._id)] : []),
				...followupBucketFilters,
				// Search condition (if search is provided)
				...(search ? [searchConditions] : []),
				// Other filters - Convert to ObjectId if valid
				...(statusIn ? [{ status: { $in: parseIdList(statusIn) } }] : []),
				...(!statusIn && status ? [{ status: convertToObjectId(status) }] : []),

				...(leadCategoryIn ? [{ leadCategory: { $in: parseIdList(leadCategoryIn) } }] : []),
				...(!leadCategoryIn && leadCategory ? [{ leadCategory: convertToObjectId(leadCategory) }] : []),

				...(typeOfB2BIn ? [{ typeOfB2B: { $in: parseIdList(typeOfB2BIn) } }] : []),
				...(!typeOfB2BIn && typeOfB2B ? [{ typeOfB2B: convertToObjectId(typeOfB2B) }] : []),

				...(b2bProjectIn ? [{ b2bProject: { $in: parseIdList(b2bProjectIn) } }] : []),
				...(!b2bProjectIn && b2bProject ? [{ b2bProject: convertToObjectId(b2bProject) }] : []),

				...(b2bDepartmentIn ? [{ b2bDepartment: { $in: parseIdList(b2bDepartmentIn) } }] : []),
				...(!b2bDepartmentIn && b2bDepartment ? [{ b2bDepartment: convertToObjectId(b2bDepartment) }] : []),

				...(subStatusIn ? [{ subStatus: { $in: parseIdList(subStatusIn) } }] : []),
				...(!subStatusIn && subStatus ? [{ subStatus: convertToObjectId(subStatus) }] : []),
			// Date range filters
			...(function () {
				const createdAtFilter = buildLeadDateRangeCondition('createdAt', startDate, endDate);
				const updatedAtFilter = buildLeadDateRangeCondition('updatedAt', modifiedFromDate, modifiedToDate);
				return [createdAtFilter, updatedAtFilter].filter(Boolean);
			})(),
			// Lead owner filter - Convert to ObjectId
			// If leadOwner filter is applied, check both leadOwner field AND leadAddedBy field
			// (because many existing leads have leadOwner set to a different user but leadAddedBy is the actual owner)
			...(leadOwnerIn ? [{
				$or: [
					{ leadOwner: { $in: parseIdList(leadOwnerIn) } },
					{ leadAddedBy: { $in: parseIdList(leadOwnerIn) } }
				]
			}] : []),
			...(!leadOwnerIn && leadOwner ? [{
				$or: [
					{ leadOwner: convertToObjectId(leadOwner) },
					{ leadAddedBy: convertToObjectId(leadOwner) }
				]
			}] : []),
			// Approval status filter
			...(approvalStatus ? [{ 'approval.status': String(approvalStatus).toUpperCase() }] : []),

			// Follow-up existence filters
			...(String(hasFollowUpCall).toLowerCase() === 'true'
				? [{ followUpCall: { $exists: true, $ne: null } }]
				: []),
			...(String(hasFollowUpVisit).toLowerCase() === 'true'
				? [{ followUpVisit: { $exists: true, $ne: null } }]
				: []),
		]
	};

		// Documents status filter (done/pending)
		if (documentsStatusIn) {
			const list = String(documentsStatusIn).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
			const wantsDone = list.includes('done');
			const wantsPending = list.includes('pending');
			const doneCond = {
				'documents.0': { $exists: true },
				documents: { $not: { $elemMatch: { status: { $ne: 'APPROVED' } } } }
			};
			const pendingCond = {
				$or: [
					{ 'documents.0': { $exists: false } },
					{ documents: { $elemMatch: { status: { $ne: 'APPROVED' } } } }
				]
			};
			if (wantsDone && wantsPending) {
				// no-op
			} else if (wantsDone) {
				finalQuery.$and.push(doneCond);
			} else if (wantsPending) {
				finalQuery.$and.push(pendingCond);
			}
		}

		// Remove empty $and array if no conditions
		if (finalQuery.$and.length === 0) {
			delete finalQuery.$and;
		}

		// Console logs for filter debugging
		// console.log('🔍 [BACKEND] Filter Debug - GET /leads endpoint called');
		// console.log('📋 [BACKEND] Raw Query Parameters:', {
		// 	page,
		// 	limit,
		// 	status,
		// 	leadCategory,
		// 	typeOfB2B,
		// 	search,
		// 	sortBy,
		// 	sortOrder,
		// 	subStatus,
		// 	startDate,
		// 	endDate,
		// 	leadOwner
		// });
		// console.log('👤 [BACKEND] User Info:', {
		// 	userId: req.user._id,
		// 	userName: req.user.name,
		// 	permissionType: req.user.permissions?.permission_type
		// });

		// Log each filter being applied
		const appliedFilters = [];
		if (status) appliedFilters.push(`status: ${status} (${mongoose.Types.ObjectId.isValid(status) ? 'Valid ObjectId' : 'Invalid'})`);
		if (leadCategory) appliedFilters.push(`leadCategory: ${leadCategory} (${mongoose.Types.ObjectId.isValid(leadCategory) ? 'Valid ObjectId' : 'Invalid'})`);
		if (typeOfB2B) appliedFilters.push(`typeOfB2B: ${typeOfB2B} (${mongoose.Types.ObjectId.isValid(typeOfB2B) ? 'Valid ObjectId' : 'Invalid'})`);
		if (subStatus) appliedFilters.push(`subStatus: ${subStatus} (${mongoose.Types.ObjectId.isValid(subStatus) ? 'Valid ObjectId' : 'Invalid'})`);
		if (leadOwner) {
			appliedFilters.push(`leadOwner: ${leadOwner} (${mongoose.Types.ObjectId.isValid(leadOwner) ? 'Valid ObjectId' : 'Invalid'})`);
			const convertedLeadOwner = convertToObjectId(leadOwner);
			// console.log('🔄 [BACKEND] leadOwner conversion:', {
			// 	original: leadOwner,
			// 	converted: convertedLeadOwner,
			// 	type: typeof convertedLeadOwner,
			// 	isObjectId: convertedLeadOwner instanceof mongoose.Types.ObjectId
			// });
		}
		if (startDate) appliedFilters.push(`startDate: ${startDate}`);
		if (endDate) appliedFilters.push(`endDate: ${endDate}`);
		if (search) appliedFilters.push(`search: ${search}`);
		
		// if (appliedFilters.length > 0) {
		// 	console.log('🎯 [BACKEND] Applied Filters:', appliedFilters.join(', '));
		// } else {
		// 	console.log('⚠️ [BACKEND] No filters applied - showing all leads');
		// }

		// Better logging for final query (handle ObjectId serialization)
		// const queryForLogging = JSON.parse(JSON.stringify(finalQuery, (key, value) => {
		// 	if (value instanceof mongoose.Types.ObjectId) {
		// 		return value.toString();
		// 	}
		// 	return value;
		// }));
		// console.log('🔧 [BACKEND] Final Query Built:', JSON.stringify(queryForLogging, null, 2));
		
		// Log actual query structure for leadOwner
		// if (leadOwner) {
		// 	const leadOwnerCondition = finalQuery.$and?.find(cond => cond.leadOwner);
		// 	if (leadOwnerCondition) {
		// 		console.log('🔍 [BACKEND] leadOwner condition in query:', {
		// 			leadOwner: leadOwnerCondition.leadOwner,
		// 			type: leadOwnerCondition.leadOwner?.constructor?.name,
		// 			isObjectId: leadOwnerCondition.leadOwner instanceof mongoose.Types.ObjectId,
		// 			toString: leadOwnerCondition.leadOwner?.toString()
		// 		});
		// 	}
		// }

		// Verify leadOwner exists if filter is applied
		// if (leadOwner) {
		// 	const leadOwnerId = convertToObjectId(leadOwner);
		// 	const ownerExists = await User.findById(leadOwnerId);
		// 	
		// 	// Check leads with this owner (without other filters)
		// 	const totalLeadsWithOwner = await Lead.countDocuments({ leadOwner: leadOwnerId });
		// 	
		// 	// Also check with the actual finalQuery to see if query is correct
		// 	const testQuery = { leadOwner: leadOwnerId };
		// 	const testCount = await Lead.countDocuments(testQuery);
		// 	
		// 	// Debug: Check if leads exist with leadAddedBy = this owner (maybe leadOwner is not set)
		// 	const totalLeadsAddedByOwner = await Lead.countDocuments({ leadAddedBy: leadOwnerId });
		// 	
		// 	// Debug: Check total leads with null leadOwner
		// 	const totalLeadsWithNullOwner = await Lead.countDocuments({ leadOwner: null });
		// 	
		// 	// Debug: Get sample leads to check their leadOwner field
		// 	const sampleLeads = await Lead.find({ leadAddedBy: leadOwnerId })
		// 		.select('_id businessName leadOwner leadAddedBy')
		// 		.limit(5)
		// 		.lean();
		// 	
		// 	console.log('👤 [BACKEND] Lead Owner Verification:', {
		// 		leadOwnerId: leadOwnerId.toString(),
		// 		ownerExists: ownerExists ? {
		// 			id: ownerExists._id.toString(),
		// 			name: ownerExists.name,
		// 			email: ownerExists.email
		// 		} : 'NOT FOUND',
		// 		totalLeadsWithOwner: totalLeadsWithOwner,
		// 		testQueryCount: testCount,
		// 		totalLeadsAddedByOwner: totalLeadsAddedByOwner,
		// 		totalLeadsWithNullOwner: totalLeadsWithNullOwner,
		// 		sampleLeads: sampleLeads.map(lead => ({
		// 			id: lead._id.toString(),
		// 			businessName: lead.businessName,
		// 			leadOwner: lead.leadOwner ? lead.leadOwner.toString() : 'NULL',
		// 			leadAddedBy: lead.leadAddedBy ? lead.leadAddedBy.toString() : 'NULL'
		// 		})),
		// 		'note': 'totalLeadsWithOwner = leads with leadOwner filter, totalLeadsAddedByOwner = leads added by this owner (maybe leadOwner is null)'
		// 	});
		// }

		// Sorting options
		const sortOptions = {};
		sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

		// Pagination logic
		const skip = (page - 1) * limit;

		// Get total lead count for pagination
		const totalLeads = await Lead.countDocuments(finalQuery);
		const totalPages = Math.ceil(totalLeads / limit);

		// console.log('📊 [BACKEND] Query Results:', {
		// 	totalLeads,
		// 	totalPages,
		// 	currentPage: parseInt(page),
		// 	limit: Number(limit),
		// 	skip
		// });



		// Fetch leads based on the query, sorted and paginated
		const leads = await applyLeadCorePopulates(Lead.find(finalQuery))
			.populate('status', 'name title substatuses')
			.populate('followUp', 'followUpType scheduledDate status')
			.populate('followUpCall', 'followUpType description status scheduledDate completedDate')
			.populate('followUpVisit', 'followUpType description status scheduledDate completedDate')
			.populate('leadAddedBy', 'name email')
			.populate('leadOwner', 'name email')
			.sort(sortOptions)
			.skip(skip)
			.limit(Number(limit));

		// Debug: Log leadOwner data for first few leads
		// if (leads.length > 0) {
		// 	console.log('👤 [BACKEND] Lead Owner Data in Response:');
		// 	leads.slice(0, 3).forEach((lead, index) => {
		// 		console.log(`  Lead ${index + 1}:`, {
		// 			businessName: lead.businessName,
		// 			leadOwnerId: lead.leadOwner?._id?.toString() || lead.leadOwner?.toString() || 'null',
		// 			leadOwnerName: lead.leadOwner?.name || 'No Owner',
		// 			leadOwnerEmail: lead.leadOwner?.email || 'N/A',
		// 			leadOwnerType: typeof lead.leadOwner,
		// 			leadOwnerIsObject: lead.leadOwner && typeof lead.leadOwner === 'object',
		// 			leadAddedById: lead.leadAddedBy?._id?.toString() || lead.leadAddedBy?.toString() || 'null',
		// 			leadAddedByName: lead.leadAddedBy?.name || 'No Added By'
		// 		});
		// 	});
		// } else {
		// 	console.log('⚠️ [BACKEND] No leads found with current filters');
		// }

		// console.log('✅ [BACKEND] Leads fetched successfully:', {
		// 	leadsCount: leads.length,
		// 	firstLeadId: leads[0]?._id || 'No leads',
		// 	firstLeadOwner: leads[0]?.leadOwner?.name || leads[0]?.leadOwner?._id?.toString() || 'No owner'
		// });


		// console.log('📤 [BACKEND] Response sent to frontend');

		res.json({
			status: true,
			data: {
				leads,
				pagination: {
					currentPage: parseInt(page),
					totalPages,
					totalLeads,
					hasNextPage: page < totalPages,
					hasPrevPage: page > 1
				}
			},
			message: 'Leads retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting leads:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve leads',
			error: error.message
		});
	}
});

// Cross-sale: all project engagements for one business (same root)
router.get('/leads/:id/cross-sales', isCollege, async (req, res) => {
	try {
		const source = await Lead.findById(req.params.id).select('_id parentLeadId crossSaleRootId');
		if (!source) {
			return res.status(404).json({ status: false, message: 'Lead not found' });
		}

		const rootId = getCrossSaleRootId(source);
		const groupLeads = await applyLeadCorePopulates(
			Lead.find(buildCrossSaleGroupQuery(rootId))
		)
			.populate('status', 'name title substatuses')
			.populate('followUp', 'followUpType scheduledDate status')
			.populate('followUpCall', 'followUpType description status scheduledDate completedDate')
			.populate('followUpVisit', 'followUpType description status scheduledDate completedDate')
			.populate('leadOwner', 'name email')
			.populate('leadAddedBy', 'name email')
			.sort({ createdAt: 1 })
			.lean();

		res.json({
			status: true,
			data: { rootId, leads: groupLeads },
			message: 'Cross-sale leads retrieved successfully',
		});
	} catch (error) {
		console.error('Error getting cross-sale leads:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve cross-sale leads',
			error: error.message,
		});
	}
});

// Cross-sale: add same business to another B2B project
router.post('/leads/:id/cross-sale', isCollege, async (req, res) => {
	try {
		const {
			b2bDepartment,
			b2bProject,
			typeOfB2B,
			leadCategory,
			leadOwner,
			remark,
			status: requestedPipelineStatus,
			subStatus: requestedPipelineSubStatus,
		} = req.body || {};
		const source = await Lead.findById(req.params.id);
		if (!source) {
			return res.status(404).json({ status: false, message: 'Lead not found' });
		}

		if (!b2bProject || !mongoose.Types.ObjectId.isValid(b2bProject)) {
			return res.status(400).json({ status: false, message: 'Valid B2B project is required' });
		}
		if (!b2bDepartment || !mongoose.Types.ObjectId.isValid(b2bDepartment)) {
			return res.status(400).json({ status: false, message: 'Valid B2B department is required' });
		}
		if (!typeOfB2B || !mongoose.Types.ObjectId.isValid(typeOfB2B)) {
			return res.status(400).json({ status: false, message: 'Valid B2B type is required' });
		}

		const projectDoc = await B2BProject.findById(b2bProject);
		if (!projectDoc) {
			return res.status(400).json({ status: false, message: 'B2B project not found' });
		}
		const departmentDoc = await B2BDepartment.findById(b2bDepartment);
		if (!departmentDoc) {
			return res.status(400).json({ status: false, message: 'B2B department not found' });
		}
		if (String(projectDoc.department) !== String(b2bDepartment)) {
			return res.status(400).json({
				status: false,
				message: 'Selected project does not belong to the selected department',
			});
		}

		const typeDoc = await TypeOfB2B.findById(typeOfB2B);
		if (!typeDoc) {
			return res.status(400).json({ status: false, message: 'B2B type not found' });
		}
		if (typeDoc.department && String(typeDoc.department) !== String(b2bDepartment)) {
			return res.status(400).json({
				status: false,
				message: 'Selected B2B type does not belong to the selected department',
			});
		}

		const rootId = getCrossSaleRootId(source);
		const existingInProject = await Lead.findOne({
			...buildCrossSaleGroupQuery(rootId),
			b2bProject,
		}).select('_id');

		if (existingInProject) {
			return res.status(400).json({
				status: false,
				message: 'This business already exists in the selected project',
			});
		}

		if (!source.crossSaleRootId) {
			source.crossSaleRootId = source._id;
			await source.save();
		}

		let leadOwnerId = source.leadOwner || null;
		if (leadOwner && String(leadOwner).trim()) {
			const ownerVal = String(leadOwner).trim();
			if (mongoose.Types.ObjectId.isValid(ownerVal)) {
				const owner = await User.findById(ownerVal);
				if (owner) leadOwnerId = owner._id;
			}
		}

		const { statusId: finalStatusId, subStatusId: finalSubStatusId } = await resolveB2BLeadPipelineStatus(
			req,
			requestedPipelineStatus,
			requestedPipelineSubStatus
		);

		if (requestedPipelineStatus && !finalStatusId) {
			return res.status(400).json({ status: false, message: 'Invalid lead status' });
		}
		if (requestedPipelineSubStatus && !finalSubStatusId) {
			return res.status(400).json({ status: false, message: 'Invalid sub-status for selected status' });
		}

		const crossSaleLead = new Lead({
			leadCategory: leadCategory || source.leadCategory,
			b2bProject,
			b2bDepartment,
			typeOfB2B,
			businessName: source.businessName,
			address: source.address,
			city: source.city,
			state: source.state,
			coordinates: source.coordinates,
			concernPersonName: source.concernPersonName,
			designation: source.designation,
			email: source.email,
			mobile: source.mobile,
			whatsapp: source.whatsapp,
			landlineNumber: source.landlineNumber,
			leadOwner: leadOwnerId,
			leadAddedBy: req.user._id,
			remark: remark || source.remark,
			parentLeadId: rootId,
			crossSaleRootId: rootId,
			approval: { status: 'PENDING' },
			logs: [{
				user: req.user._id,
				timestamp: new Date(),
				action: `Cross-sale added to project "${projectDoc.name}"`,
				remarks: remark || `Linked from lead ${source._id}`,
			}],
		});

		if (finalStatusId) {
			crossSaleLead.status = finalStatusId;
			if (finalSubStatusId) {
				crossSaleLead.subStatus = finalSubStatusId;
			}
		}

		const savedLead = await crossSaleLead.save();

		if (savedLead && finalStatusId) {
			const statusDoc = await StatusB2b.findById(finalStatusId).select('title name');
			const statusLabel = statusDoc?.title || statusDoc?.name || 'pipeline status';
			let subLabel = '';
			if (finalSubStatusId && statusDoc?.substatuses?.length) {
				const sub = statusDoc.substatuses.find((s) => String(s._id) === String(finalSubStatusId));
				subLabel = sub?.title ? ` (${sub.title})` : '';
			}
			savedLead.logs.push({
				user: req.user._id,
				timestamp: new Date(),
				action: `Lead added with ${statusLabel}${subLabel} (Cross-sale)`,
				remarks: remark || `Cross-sale in project "${projectDoc.name}"`,
			});
			await savedLead.save();
		}

		source.logs = source.logs || [];
		source.logs.push({
			user: req.user._id,
			timestamp: new Date(),
			action: `Cross-sale created in project "${projectDoc.name}"`,
			remarks: `New lead id ${savedLead._id}`,
		});
		await source.save();

		const populated = await applyLeadCorePopulates(Lead.findById(savedLead._id))
			.populate('status', 'name title substatuses')
			.populate('leadOwner', 'name email')
			.populate('leadAddedBy', 'name email');

		res.status(201).json({
			status: true,
			data: populated,
			message: 'Cross-sale lead added successfully',
		});
	} catch (error) {
		console.error('Error creating cross-sale lead:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to create cross-sale lead',
			error: error.message,
		});
	}
});

// Get lead by ID
router.get('/leads/:id', isCollege, async (req, res) => {
	try {
		const isAdminUser = (req) => req.user?.permissions?.permission_type === 'Admin';
		const lead = await applyLeadCorePopulates(Lead.findById(req.params.id))
			.populate('status', 'name')
			.populate('followUp', 'followUpType description status scheduledDate completedDate')
			.populate('followUpCall', 'followUpType description status scheduledDate completedDate')
			.populate('followUpVisit', 'followUpType description status scheduledDate completedDate')
			.populate('leadAddedBy', 'name email')
			.populate('remark.addedBy', 'name email');

		if (!lead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		// Permission: Admin OR leadAddedBy OR leadOwner can view
		const userId = String(req.user?._id || '');
		const leadAddedById = lead.leadAddedBy ? String(lead.leadAddedBy?._id || lead.leadAddedBy) : '';
		const leadOwnerId = lead.leadOwner ? String(lead.leadOwner?._id || lead.leadOwner) : '';
		const canView = isAdminUser(req) || leadAddedById === userId || leadOwnerId === userId;

		if (!canView) {
			return res.status(403).json({
				status: false,
				message: 'You do not have permission to view this lead'
			});
		}

		res.json({
			status: true,
			data: lead,
			message: 'Lead retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting lead:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve lead',
			error: error.message
		});
	}
});

//get lead logs by id
router.get('/leads/:id/logs', isCollege, async (req, res) => {
	try {

		const logs = await Lead.aggregate([
			{
				$match: {
					_id: new mongoose.Types.ObjectId(req.params.id),
				}
			}, { $project: { logs: 1 } },

			// work per-log
			{ $unwind: "$logs" },

			// join the user for this log
			{
				$lookup: {
					from: "users",                 // <-- your users collection name
					localField: "logs.user",
					foreignField: "_id",
					as: "u"
				}

			},
			{ $unwind: "$u" },
			{
				$set: {
					"logs.user": "$u.name"
				}
			},
			{
				$group: {
					_id: "$_id",
					logs: { $push: "$logs" }
				}
			}
		])


		if (!logs) {
			return res.status(404).json({
				status: false,
				message: 'No logs found'
			});
		}



		res.json({
			status: true,
			data: logs[0],
			message: 'Lead logs retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting lead:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve lead',
			error: error.message
		});
	}
});

// Create new lead
router.post('/add-lead', isCollege, async (req, res) => {
	try {
		const {
			leadCategory,
			b2bProject,
			b2bDepartment,
			typeOfB2B,
			businessName,
			address,
			city,
			state,
			coordinates,
			concernPersonName,
			designation,
			email,
			mobile,
			whatsapp,
			leadOwner,
			remark,
			landlineNumber,
			status: requestedPipelineStatus,
			subStatus: requestedPipelineSubStatus,
		} = req.body;
// console.log(req.body);
		const missingFields = [];
		if (!leadCategory) missingFields.push("leadCategory");
		if (!b2bProject) missingFields.push("b2bProject");
		if (!b2bDepartment) missingFields.push("b2bDepartment");
		if (!typeOfB2B) missingFields.push("typeOfB2B");
		if (!businessName) missingFields.push("businessName");
		if (!concernPersonName) missingFields.push("concernPersonName");
		if (!mobile) missingFields.push("mobile");

		if (missingFields.length) {
			return res.status(400).json({
				status: false,
				message: `Required fields missing: ${missingFields.join(", ")}`
			});
		}

		if (!mongoose.Types.ObjectId.isValid(b2bProject)) {
			return res.status(400).json({ status: false, message: 'Invalid B2B project' });
		}
		if (!mongoose.Types.ObjectId.isValid(b2bDepartment)) {
			return res.status(400).json({ status: false, message: 'Invalid B2B department' });
		}
		if (!mongoose.Types.ObjectId.isValid(typeOfB2B)) {
			return res.status(400).json({ status: false, message: 'Invalid B2B type' });
		}

		const projectDoc = await B2BProject.findById(b2bProject);
		if (!projectDoc) {
			return res.status(400).json({ status: false, message: 'B2B project not found' });
		}

		const departmentDoc = await B2BDepartment.findById(b2bDepartment);
		if (!departmentDoc) {
			return res.status(400).json({ status: false, message: 'B2B department not found' });
		}
		if (String(projectDoc.department) !== String(b2bDepartment)) {
			return res.status(400).json({
				status: false,
				message: 'Selected project does not belong to the selected department'
			});
		}

		const typeDoc = await TypeOfB2B.findById(typeOfB2B);
		if (!typeDoc) {
			return res.status(400).json({ status: false, message: 'B2B type not found' });
		}
		if (typeDoc.department && String(typeDoc.department) !== String(b2bDepartment)) {
			return res.status(400).json({
				status: false,
				message: 'Selected B2B type does not belong to the selected department'
			});
		}

		const normalizedEmail = typeof email === "string" ? email.trim() : "";
		if (normalizedEmail) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(normalizedEmail)) {
				return res.status(400).json({
					status: false,
					message: "Please enter a valid email address"
				});
			}

			// Check if email already exists (only when email is provided)
			const existingLead = await Lead.findOne({
				email: normalizedEmail,
				leadAddedBy: req.user._id
			});

			if (existingLead) {
				return res.status(400).json({
					status: false,
					message: "Lead with this email already exists"
				});
			}
		}

		// Handle leadOwner - convert name to ObjectId if needed, or skip if empty
		let leadOwnerId = null;
		if (leadOwner && leadOwner.trim()) {
			const ownerName = leadOwner.trim();
			
			// Check if it's a valid ObjectId first
			let owner = null;
			if (mongoose.Types.ObjectId.isValid(ownerName)) {
				owner = await User.findById(ownerName);
			}
			
			// If not found by ID, search by name (case-insensitive)
			if (!owner) {
				owner = await User.findOne({
					name: { $regex: new RegExp(`^${ownerName}$`, 'i') }
				});
			}
			
			if (owner) {
				leadOwnerId = owner._id;
			}
			// If owner not found, leadOwnerId remains null (optional field)
		}

		const collegeIdForPipeline = req.user?.college?._id;
		const pipelineStatusScope = collegeIdForPipeline
			? {
					$or: [
						{ college: collegeIdForPipeline },
						{ college: null },
						{ college: { $exists: false } },
					],
			  }
			: {
					$or: [{ college: null }, { college: { $exists: false } }],
			  };

		const titleMatchExpr = (lowerTitle) => ({
			$expr: {
				$eq: [{ $toLower: { $trim: { input: '$title' } } }, lowerTitle],
			},
		});

		let resolvedStatusId = null;
		let resolvedSubStatusId = null;

		const rawStatus = requestedPipelineStatus != null ? String(requestedPipelineStatus).trim() : '';
		if (rawStatus) {
			let statusDoc = null;
			if (mongoose.Types.ObjectId.isValid(rawStatus)) {
				statusDoc = await StatusB2b.findOne({
					$and: [{ _id: rawStatus }, pipelineStatusScope],
				});
			}
			if (!statusDoc) {
				const norm = rawStatus.toLowerCase();
				statusDoc = await StatusB2b.findOne({
					$and: [titleMatchExpr(norm), pipelineStatusScope],
				});
			}
			if (statusDoc) {
				resolvedStatusId = statusDoc._id;
				const subs = statusDoc.substatuses || [];
				const rawSub = requestedPipelineSubStatus != null ? String(requestedPipelineSubStatus).trim() : '';
				if (rawSub && mongoose.Types.ObjectId.isValid(rawSub)) {
					const matchSub = subs.find((s) => String(s._id) === rawSub);
					if (matchSub) {
						resolvedSubStatusId = matchSub._id;
					}
				}
				if (!resolvedSubStatusId && subs.length > 0) {
					resolvedSubStatusId = subs[0]._id;
				}
			}
		}

		// Find "Untouch Leads" status as default status
		const College = require("../../../models/college");
		const college = await College.findOne({
			'_concernPerson._id': req.user._id
		});

		let defaultStatusId = null;
		let defaultSubStatusId = null;

		if (!resolvedStatusId && college) {
			const untouchStatus = await StatusB2b.findOne({
				college: college._id,
				title: { $regex: /^Untouch Leads$/i }
			});

			if (untouchStatus) {
				defaultStatusId = untouchStatus._id;
				// If there's a substatus with same name, use it
				if (untouchStatus.substatuses && untouchStatus.substatuses.length > 0) {
					const untouchSubStatus = untouchStatus.substatuses.find(
						sub => sub.title && /^Untouch Leads$/i.test(sub.title)
					);
					if (untouchSubStatus) {
						defaultSubStatusId = untouchSubStatus._id;
					} else {
						// Use first substatus if exact match not found
						defaultSubStatusId = untouchStatus.substatuses[0]._id;
					}
				}
			}
		}

		const finalStatusId = resolvedStatusId || defaultStatusId;
		const finalSubStatusId = resolvedSubStatusId || defaultSubStatusId;

	
		const leadData = {
			leadCategory,
			b2bProject,
			b2bDepartment,
			typeOfB2B,
			businessName,
			address,
			city,
			state,
			coordinates,
			concernPersonName,
			designation,
			email: normalizedEmail || undefined,
			mobile,
			whatsapp,
			leadAddedBy: req.user._id,
			remark,
			landlineNumber,
			approval: { status: 'PENDING' }
		};

		if (finalStatusId) {
			leadData.status = finalStatusId;
			if (finalSubStatusId) {
				leadData.subStatus = finalSubStatusId;
			}
		}

		// Only add leadOwner if we have a valid ObjectId
		if (leadOwnerId) {
			leadData.leadOwner = leadOwnerId;
		}

		const newLead = new Lead(leadData);



		let savedLead = await newLead.save();

		if (savedLead) {
			let statusMessage = 'default status';
			if (finalStatusId) {
				const sd = await StatusB2b.findById(finalStatusId).select('title');
				statusMessage = sd?.title || 'pipeline status';
			}
			savedLead.logs.push({
				user: req.user._id,
				timestamp: new Date(),
				action: `Lead added with ${statusMessage} (Approval: PENDING)`,
				remarks: remark || `Lead created with ${statusMessage}`
			});

			await savedLead.save();
		}
		else {
			return res.status(400).json({
				status: false,
				message: 'Failed to create lead'
			});
		}



		res.status(201).json({
			status: true,
			data: savedLead,
			message: 'Lead created successfully'
		});
	} catch (error) {
		console.error('Error creating lead:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to create lead',
			error: error.message
		});
	}
});

// Lead Approval (Approve / Reject)
// Body: { status: "APPROVED"|"REJECTED", rejectionReason?, moveToProspect?: boolean }
router.put('/leads/:id/approval', isCollege, async (req, res) => {
	try {
		if (!isAdminUser(req)) {
			return res.status(403).json({ status: false, message: 'Only Admin can approve/reject leads' });
		}

		const { status, rejectionReason, moveToProspect = true } = req.body || {};
		const normalized = String(status || '').toUpperCase();
		if (!['APPROVED', 'REJECTED'].includes(normalized)) {
			return res.status(400).json({ status: false, message: 'status must be APPROVED or REJECTED' });
		}

		const lead = await Lead.findById(req.params.id);
		if (!lead) return res.status(404).json({ status: false, message: 'Lead not found' });

		const now = new Date();

		if (normalized === 'APPROVED') {
			lead.approval = {
				...(lead.approval || {}),
				status: 'APPROVED',
				approvedBy: req.user._id,
				approvedAt: now,
				rejectedBy: undefined,
				rejectedAt: undefined,
				rejectionReason: undefined,
			};
		} else {
			lead.approval = {
				...(lead.approval || {}),
				status: 'REJECTED',
				rejectedBy: req.user._id,
				rejectedAt: now,
				rejectionReason: rejectionReason ? String(rejectionReason).trim() : '',
				approvedBy: undefined,
				approvedAt: undefined,
			};
		}

		// Optional: auto move approved leads into Performance/Prospect status
		if (normalized === 'APPROVED' && moveToProspect) {
			const college = await getCollegeForUser(req.user._id);
			if (college?._id) {
				const statusDoc =
					(await tryFindStatusByTitleOrMilestone({ collegeId: college._id, title: 'Prospect' })) ||
					(await tryFindStatusByTitleOrMilestone({ collegeId: college._id, milestone: 'Performance' })) ||
					null;

				if (statusDoc?._id) {
					lead.status = statusDoc._id;
					const sub = Array.isArray(statusDoc.substatuses)
						? statusDoc.substatuses.find((s) => {
							const t = String(s?.title || '').trim().toLowerCase();
							return t === 'untouch leads' || t === 'untouch leads' || t === 'untouch';
						})
						: null;
					if (sub?._id) lead.subStatus = sub._id;
				}
			}
		}

		lead.updatedBy = req.user._id;
		lead.logs.push({
			user: req.user._id,
			timestamp: now,
			action: `Lead approval set to ${lead.approval.status}`,
			remarks: normalized === 'REJECTED' ? (lead.approval.rejectionReason || '') : '',
		});

		await lead.save();

		const updatedLead = await applyLeadCorePopulates(Lead.findById(lead._id))
			.populate('status', 'name title substatuses')
			.populate('leadAddedBy', 'name email')
			.populate('leadOwner', 'name email');

		return res.json({ status: true, data: updatedLead, message: 'Lead approval updated successfully' });
	} catch (error) {
		console.error('Error updating lead approval:', error);
		return res.status(500).json({ status: false, message: 'Failed to update lead approval', error: error.message });
	}
});

// Upload a lead document (S3)
// Form-data: file, optional: docType, name, remarks
router.post('/leads/:id/documents', isCollege, async (req, res) => {
	try {
		const lead = await Lead.findById(req.params.id);
		if (!lead) return res.status(404).json({ status: false, message: 'Lead not found' });

		if (!req.files?.file) {
			return res.status(400).json({ status: false, message: 'file is required' });
		}

		const file = req.files.file;
		const originalName = String(file.name || 'document');
		const ext = originalName.split('.').pop().toLowerCase();
		if (ext && Array.isArray(mimetypes) && !mimetypes.includes(ext)) {
			return res.status(400).json({ status: false, message: 'File type not supported' });
		}

		const ContentType = file.mimetype;
		const key = `uploads/b2b/${lead._id}/${uuid()}.${ext || 'bin'}`;
		const params = { Bucket: bucketName, Body: file.data, Key: key, ContentType };
		const uploaded = await s3.upload(params).promise();

		const doc = {
			name: req.body?.name ? String(req.body.name).trim() : originalName,
			docType: req.body?.docType ? String(req.body.docType).trim() : '',
			url: key,
			key,
			status: 'PENDING',
			remarks: req.body?.remarks ? String(req.body.remarks).trim() : '',
			uploadedBy: req.user._id,
			uploadedAt: new Date(),
		};

		lead.documents = Array.isArray(lead.documents) ? lead.documents : [];
		lead.documents.push(doc);
		lead.updatedBy = req.user._id;
		lead.logs.push({
			user: req.user._id,
			timestamp: new Date(),
			action: `Document uploaded${doc.docType ? ` (${doc.docType})` : ''}`,
			remarks: doc.name,
		});

		await lead.save();

		return res.status(201).json({
			status: true,
			data: lead.documents[lead.documents.length - 1],
			message: 'Document uploaded successfully',
		});
	} catch (error) {
		console.error('Error uploading B2B lead document:', error);
		return res.status(500).json({ status: false, message: 'Failed to upload document', error: error.message });
	}
});

// List lead documents
router.get('/leads/:id/documents', isCollege, async (req, res) => {
	try {
		const lead = await Lead.findById(req.params.id).select('documents').lean();
		if (!lead) return res.status(404).json({ status: false, message: 'Lead not found' });
		return res.json({ status: true, data: lead.documents || [], message: 'Documents fetched successfully' });
	} catch (error) {
		console.error('Error fetching B2B lead documents:', error);
		return res.status(500).json({ status: false, message: 'Failed to fetch documents', error: error.message });
	}
});

// Update document status (approve/reject)
router.put('/leads/:id/documents/:docId/status', isCollege, async (req, res) => {
	try {
		if (!isAdminUser(req)) {
			return res.status(403).json({ status: false, message: 'Only Admin can update document status' });
		}
		const { status, remarks } = req.body || {};
		const normalized = String(status || '').toUpperCase();
		if (!['APPROVED', 'REJECTED', 'PENDING'].includes(normalized)) {
			return res.status(400).json({ status: false, message: 'Invalid status' });
		}

		const lead = await Lead.findById(req.params.id);
		if (!lead) return res.status(404).json({ status: false, message: 'Lead not found' });

		const doc = (lead.documents || []).id(req.params.docId);
		if (!doc) return res.status(404).json({ status: false, message: 'Document not found' });

		doc.status = normalized;
		if (remarks !== undefined) doc.remarks = String(remarks || '').trim();

		lead.updatedBy = req.user._id;
		lead.logs.push({
			user: req.user._id,
			timestamp: new Date(),
			action: `Document status set to ${normalized}${doc.docType ? ` (${doc.docType})` : ''}`,
			remarks: doc.name || '',
		});

		await lead.save();
		return res.json({ status: true, data: doc, message: 'Document status updated successfully' });
	} catch (error) {
		console.error('Error updating document status:', error);
		return res.status(500).json({ status: false, message: 'Failed to update document status', error: error.message });
	}
});

// Update lead status
router.put('/leads/:id/status', isCollege, async (req, res) => {
	try {
		console.log('[B2B Update Status] Step 1: Request received', { method: req.method, path: req.path });
		const { id } = req.params;
		const {
			status,
			subStatus,
			remarks,
			followUpDate,
			followUpTime,
			followUpType = 'Call',
			googleCalendarEvent = false
		} = req.body;
		// console.log('[B2B Update Status] Step 2: Params & body', {
		// 	leadId: id,
		// 	status,
		// 	subStatus,
		// 	hasRemarks: !!remarks,
		// 	hasFollowUp: !!(followUpDate && followUpTime)
		// });

		// Validate required fields
		if (!status) {
			console.log('[B2B Update Status] Step 3: Validation failed - status is required');
			return res.status(400).json({
				status: false,
				message: 'Status is required'
			});
		}

		// Find the lead
		const lead = await Lead.findById(id);
		console.log('[B2B Update Status] Step 4: Lead lookup', { leadFound: !!lead, leadId: id });

		if (!lead) {
			console.log('[B2B Update Status] Step 5: Exiting - lead not found');
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		if (typeof Lead.normalizeApproval === 'function') {
			lead.approval = Lead.normalizeApproval(lead.approval);
		}
		// Check if user is Admin - Admin can update any lead
		const isAdmin = () => {
			const permissionType = req.user.permissions?.permission_type;
			return permissionType === 'Admin';
		};

		console.log('[B2B Update Status] Step 6: User & permission check', {
			userId: req.user?._id?.toString(),
			userName: req.user?.name,
			permissionType: req.user?.permissions?.permission_type,
			isAdminResult: isAdmin()
		});

		// If not Admin, check ownership
		if (!isAdmin()) {
			let teamMembers = await getAllTeamMembers(req.user._id);
			const isOwner = teamMembers.some(member =>
				lead.leadAddedBy.toString() === member.toString() ||
				lead.leadOwner.toString() === member.toString()
			);
			console.log('[B2B Update Status] Step 7: Ownership check (non-admin)', {
				leadAddedBy: lead.leadAddedBy?.toString(),
				leadOwner: lead.leadOwner?.toString(),
				teamMembersCount: teamMembers?.length,
				isOwner
			});

			if (!isOwner) {
				console.log('[B2B Update Status] Step 8: Exiting - permission denied (not owner)');
				return res.status(403).json({
					status: false,
					message: 'You do not have permission to update this lead'
				});
			}
		} else {
			console.log('[B2B Update Status] Step 7: Skipped ownership check (admin)');
		}

		// Get old status for logging
		const oldStatus = lead.status;
		const oldSubStatus = lead.subStatus;

		// Get status names for better logging
		let oldStatusName = 'No Status';
		let oldSubStatusName = 'No Sub-Status';
		let newStatusName = 'Unknown';
		let newSubStatusName = 'No Sub-Status';

		if (oldStatus) {
			const oldStatusDoc = await StatusB2b.findById(oldStatus);
			oldStatusName = oldStatusDoc ? oldStatusDoc.title : 'Unknown Status';
		}

		if (oldSubStatus) {
			// Find substatus within the old status
			if (oldStatus) {
				const oldStatusDoc = await StatusB2b.findById(oldStatus);
				if (oldStatusDoc && oldStatusDoc.substatuses) {
					const oldSubStatusDoc = oldStatusDoc.substatuses.find(sub => sub._id.toString() === oldSubStatus.toString());
					oldSubStatusName = oldSubStatusDoc ? oldSubStatusDoc.title : 'Unknown Sub-Status';
				}
			}
		}

		// Get new status names
		const newStatusDoc = await StatusB2b.findById(status);
		newStatusName = newStatusDoc ? newStatusDoc.title : 'Unknown Status';

		if (subStatus) {
			// Find substatus within the new status
			if (newStatusDoc && newStatusDoc.substatuses) {
				const newSubStatusDoc = newStatusDoc.substatuses.find(sub => sub._id.toString() === subStatus.toString());
				newSubStatusName = newSubStatusDoc ? newSubStatusDoc.title : 'Unknown Sub-Status';
			}
		}

		// Update the lead
		lead.status = status;
		lead.subStatus = subStatus;
		lead.updatedBy = req.user._id;

		if (remarks) {
			lead.remark = remarks;
		}

		const statusChanged =
			String(oldStatus || '') !== String(status || '') ||
			String(oldSubStatus || '') !== String(subStatus || '');

		if (statusChanged) {
			lead.logs.push({
				user: req.user._id,
				timestamp: new Date(),
				action: `Status changed from ${oldStatusName} (${oldSubStatusName}) to ${newStatusName} (${newSubStatusName})`,
				remarks: remarks || `Status updated from ${oldStatusName} to ${newStatusName}`
			});
		} else if (remarks) {
			lead.logs.push({
				user: req.user._id,
				timestamp: new Date(),
				action: `Remarks updated for ${newStatusName} (${newSubStatusName})`,
				remarks
			});
		}

		let savedFollowUp = null;
		let scheduledDateTime = null;
		if (followUpDate && followUpTime) {
			const [hours, minutes] = String(followUpTime).split(':');
			scheduledDateTime = /^\d{4}-\d{2}-\d{2}$/.test(String(followUpDate))
				? new Date(`${followUpDate}T00:00:00`)
				: new Date(followUpDate);
			scheduledDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

			const normalizedType = String(followUpType || 'Call').trim();
			savedFollowUp = new FollowUp({
				leadId: id,
				followUpType: normalizedType,
				description: `Status changed to ${newStatusName}`,
				scheduledDate: scheduledDateTime,
				remarks: remarks || '',
				addedBy: req.user._id
			});
			await savedFollowUp.save();

			lead.followUp = savedFollowUp._id;
			if (normalizedType.toLowerCase() === 'visit') {
				lead.followUpVisit = savedFollowUp._id;
			} else {
				lead.followUpCall = savedFollowUp._id;
			}

			lead.logs.push({
				user: req.user._id,
				timestamp: new Date(),
				action: `${normalizedType} follow-up scheduled for ${scheduledDateTime.toLocaleDateString()} at ${followUpTime}`,
				remarks: remarks || ''
			});
		}

		await lead.save();
		// console.log('[B2B Update Status] Step 9: Lead saved', {
		// 	leadId: id,
		// 	newStatus: status,
		// 	newSubStatus: subStatus || '(none)',
		// 	followUpSet: !!savedFollowUp
		// });

		if (googleCalendarEvent && savedFollowUp && scheduledDateTime && req.user.googleAuthToken?.accessToken) {
			try {
				const { createGoogleCalendarEvent } = require('../../services/googleservice');
				const googleEvent = await createGoogleCalendarEvent({
					user: req.user,
					event: {
						summary: `B2B Follow-up: ${lead.businessName}`,
						description: `Status Change Follow-up with ${lead.concernPersonName} (${lead.designation || 'N/A'})\n\nBusiness: ${lead.businessName}\nContact: ${lead.mobile}\nEmail: ${lead.email}\nStatus: ${newStatusName}\n\nRemarks: ${remarks || 'No remarks'}`,
						start: {
							dateTime: scheduledDateTime.toISOString(),
							timeZone: 'Asia/Kolkata',
						},
						end: {
							dateTime: new Date(scheduledDateTime.getTime() + 30 * 60000).toISOString(),
							timeZone: 'Asia/Kolkata',
						},
						reminders: {
							useDefault: false,
							overrides: [
								{ method: 'email', minutes: 24 * 60 },
								{ method: 'popup', minutes: 15 },
							],
						},
					}
				});
				const eventId = googleEvent?.event?.id || googleEvent?.data?.id;
				if (eventId) {
					savedFollowUp.googleCalendarEventId = eventId;
					await savedFollowUp.save();
				}
			} catch (googleError) {
				console.error('Google Calendar Error (status update):', googleError);
			}
		}

		// Populate the updated lead
		const updatedLead = await applyLeadCorePopulates(Lead.findById(id))
			.populate('status', 'name title substatuses')
			.populate('followUp', 'followUpType scheduledDate status')
			.populate('followUpCall', 'followUpType description status scheduledDate completedDate')
			.populate('followUpVisit', 'followUpType description status scheduledDate completedDate')
			.populate('leadAddedBy', 'name email')
			.populate('leadOwner', 'name email');

		console.log('[B2B Update Status] Step 10: Success - sending response');
		res.json({
			status: true,
			data: updatedLead,
			message: 'Lead status updated successfully'
		});
	} catch (error) {
		console.error('[B2B Update Status] Error:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to update lead status',
			error: error.message
		});
	}
});

// router.put('/leads/:id/status', isCollege, async (req, res) => {
// 	try {
// 		console.log('[B2B Update Status] Step 1: Request received', { method: req.method, path: req.path });
// 		const { id } = req.params;
// 		const {
// 			status,
// 			subStatus,
// 			remarks,
// 			followUpDate,
// 			followUpTime,
// 			followUpType = 'Call',
// 			googleCalendarEvent = false
// 		} = req.body;
// 		console.log('[B2B Update Status] Step 2: Params & body', {
// 			leadId: id,
// 			status,
// 			subStatus,
// 			hasRemarks: !!remarks,
// 			hasFollowUp: !!(followUpDate && followUpTime)
// 		});

// 		// Validate required fields
// 		if (!status) {
// 			console.log('[B2B Update Status] Step 3: Validation failed - status is required');
// 			return res.status(400).json({
// 				status: false,
// 				message: 'Status is required'
// 			});
// 		}

// 		// Find the lead
// 		const lead = await Lead.findById(id);
// 		console.log('[B2B Update Status] Step 4: Lead lookup', { leadFound: !!lead, leadId: id });

// 		if (!lead) {
// 			console.log('[B2B Update Status] Step 5: Exiting - lead not found');
// 			return res.status(404).json({
// 				status: false,
// 				message: 'Lead not found'
// 			});
// 		}

// 		if (typeof Lead.normalizeApproval === 'function') {
// 			lead.approval = Lead.normalizeApproval(lead.approval);
// 		}
// 		// Check if user is Admin - Admin can update any lead
// 		const isAdmin = () => {
// 			const permissionType = req.user.permissions?.permission_type;
// 			return permissionType === 'Admin';
// 		};

// 		console.log('[B2B Update Status] Step 6: User & permission check', {
// 			userId: req.user?._id?.toString(),
// 			userName: req.user?.name,
// 			permissionType: req.user?.permissions?.permission_type,
// 			isAdminResult: isAdmin()
// 		});

// 		// If not Admin, check ownership
// 		if (!isAdmin()) {
// 			let teamMembers = await getAllTeamMembers(req.user._id);
// 			const isOwner = teamMembers.some(member =>
// 				lead.leadAddedBy.toString() === member.toString() ||
// 				lead.leadOwner.toString() === member.toString()
// 			);
// 			console.log('[B2B Update Status] Step 7: Ownership check (non-admin)', {
// 				leadAddedBy: lead.leadAddedBy?.toString(),
// 				leadOwner: lead.leadOwner?.toString(),
// 				teamMembersCount: teamMembers?.length,
// 				isOwner
// 			});

// 			if (!isOwner) {
// 				console.log('[B2B Update Status] Step 8: Exiting - permission denied (not owner)');
// 				return res.status(403).json({
// 					status: false,
// 					message: 'You do not have permission to update this lead'
// 				});
// 			}
// 		} else {
// 			console.log('[B2B Update Status] Step 7: Skipped ownership check (admin)');
// 		}

// 		// Get old status for logging
// 		const oldStatus = lead.status;
// 		const oldSubStatus = lead.subStatus;

// 		// Get status names for better logging
// 		let oldStatusName = 'No Status';
// 		let oldSubStatusName = 'No Sub-Status';
// 		let newStatusName = 'Unknown';
// 		let newSubStatusName = 'No Sub-Status';

// 		if (oldStatus) {
// 			const oldStatusDoc = await StatusB2b.findById(oldStatus);
// 			oldStatusName = oldStatusDoc ? oldStatusDoc.title : 'Unknown Status';
// 		}

// 		if (oldSubStatus) {
// 			// Find substatus within the old status
// 			if (oldStatus) {
// 				const oldStatusDoc = await StatusB2b.findById(oldStatus);
// 				if (oldStatusDoc && oldStatusDoc.substatuses) {
// 					const oldSubStatusDoc = oldStatusDoc.substatuses.find(sub => sub._id.toString() === oldSubStatus.toString());
// 					oldSubStatusName = oldSubStatusDoc ? oldSubStatusDoc.title : 'Unknown Sub-Status';
// 				}
// 			}
// 		}

// 		// Get new status names
// 		const newStatusDoc = await StatusB2b.findById(status);
// 		newStatusName = newStatusDoc ? newStatusDoc.title : 'Unknown Status';

// 		if (subStatus) {
// 			// Find substatus within the new status
// 			if (newStatusDoc && newStatusDoc.substatuses) {
// 				const newSubStatusDoc = newStatusDoc.substatuses.find(sub => sub._id.toString() === subStatus.toString());
// 				newSubStatusName = newSubStatusDoc ? newSubStatusDoc.title : 'Unknown Sub-Status';
// 			}
// 		}

// 		// Update the lead
// 		lead.status = status;
// 		lead.subStatus = subStatus;
// 		lead.updatedBy = req.user._id;

// 		if (remarks) {
// 			lead.remark = remarks;
// 		}

// 		// Add to logs with detailed status change information
// 		lead.logs.push({
// 			user: req.user._id,
// 			timestamp: new Date(),
// 			action: `Status changed from ${oldStatusName} (${oldSubStatusName}) to ${newStatusName} (${newSubStatusName})`,
// 			remarks: remarks || `Status updated from ${oldStatusName} to ${newStatusName}`
// 		});

// 		let savedFollowUp = null;
// 		let scheduledDateTime = null;
// 		if (followUpDate && followUpTime) {
// 			const [hours, minutes] = String(followUpTime).split(':');
// 			scheduledDateTime = /^\d{4}-\d{2}-\d{2}$/.test(String(followUpDate))
// 				? new Date(`${followUpDate}T00:00:00`)
// 				: new Date(followUpDate);
// 			scheduledDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

// 			const normalizedType = String(followUpType || 'Call').trim();
// 			savedFollowUp = new FollowUp({
// 				leadId: id,
// 				followUpType: normalizedType,
// 				description: `Status changed to ${newStatusName}`,
// 				scheduledDate: scheduledDateTime,
// 				addedBy: req.user._id
// 			});
// 			await savedFollowUp.save();

// 			lead.followUp = savedFollowUp._id;
// 			if (normalizedType.toLowerCase() === 'visit') {
// 				lead.followUpVisit = savedFollowUp._id;
// 			} else {
// 				lead.followUpCall = savedFollowUp._id;
// 			}

// 			lead.logs.push({
// 				user: req.user._id,
// 				timestamp: new Date(),
// 				action: `${normalizedType} follow-up scheduled for ${scheduledDateTime.toLocaleDateString()} at ${followUpTime}`,
// 				remarks: remarks || ''
// 			});
// 		}

// 		await lead.save();
// 		console.log('[B2B Update Status] Step 9: Lead saved', {
// 			leadId: id,
// 			newStatus: status,
// 			newSubStatus: subStatus || '(none)',
// 			followUpSet: !!savedFollowUp
// 		});

// 		if (googleCalendarEvent && savedFollowUp && scheduledDateTime && req.user.googleAuthToken?.accessToken) {
// 			try {
// 				const { createGoogleCalendarEvent } = require('../../services/googleservice');
// 				const googleEvent = await createGoogleCalendarEvent({
// 					user: req.user,
// 					event: {
// 						summary: `B2B Follow-up: ${lead.businessName}`,
// 						description: `Status Change Follow-up with ${lead.concernPersonName} (${lead.designation || 'N/A'})\n\nBusiness: ${lead.businessName}\nContact: ${lead.mobile}\nEmail: ${lead.email}\nStatus: ${newStatusName}\n\nRemarks: ${remarks || 'No remarks'}`,
// 						start: {
// 							dateTime: scheduledDateTime.toISOString(),
// 							timeZone: 'Asia/Kolkata',
// 						},
// 						end: {
// 							dateTime: new Date(scheduledDateTime.getTime() + 30 * 60000).toISOString(),
// 							timeZone: 'Asia/Kolkata',
// 						},
// 						reminders: {
// 							useDefault: false,
// 							overrides: [
// 								{ method: 'email', minutes: 24 * 60 },
// 								{ method: 'popup', minutes: 15 },
// 							],
// 						},
// 					}
// 				});
// 				const eventId = googleEvent?.event?.id || googleEvent?.data?.id;
// 				if (eventId) {
// 					savedFollowUp.googleCalendarEventId = eventId;
// 					await savedFollowUp.save();
// 				}
// 			} catch (googleError) {
// 				console.error('Google Calendar Error (status update):', googleError);
// 			}
// 		}

// 		// Populate the updated lead
// 		const updatedLead = await applyLeadCorePopulates(Lead.findById(id))
// 			.populate('status', 'name title substatuses')
// 			.populate('followUp', 'followUpType scheduledDate status')
// 			.populate('followUpCall', 'followUpType description status scheduledDate completedDate')
// 			.populate('followUpVisit', 'followUpType description status scheduledDate completedDate')
// 			.populate('leadAddedBy', 'name email')
// 			.populate('leadOwner', 'name email');

// 		console.log('[B2B Update Status] Step 10: Success - sending response');
// 		res.json({
// 			status: true,
// 			data: updatedLead,
// 			message: 'Lead status updated successfully' + (savedFollowUp ? ' with follow-up scheduled' : '')
// 		});
// 	} catch (error) {
// 		console.error('[B2B Update Status] Error:', error);
// 		res.status(500).json({
// 			status: false,
// 			message: 'Failed to update lead status',
// 			error: error.message
// 		});
// 	}
// });

// Update lead
router.put('/leads/:id', isCollege, async (req, res) => {
	try {
		const {
			leadCategory,
			b2bProject,
			b2bDepartment,
			typeOfB2B,
			businessName,
			address,
			city,
			state,
			coordinates,
			concernPersonName,
			designation,
			email,
			mobile,
			whatsapp,
			leadOwner,
			landlineNumber,
			remark
		} = req.body;

		const user = req.user;
		const isAdminUser = (req) => req.user?.permissions?.permission_type === 'Admin';
		const hasEditLeadsPermission = () => {
			const permissionType = req.user?.permissions?.permission_type;
			if (permissionType === 'Admin') return true;
			if (permissionType === 'Custom' && req.user?.permissions?.custom_permissions?.can_edit_leads_b2b) {
				return true;
			}
			return false;
		};

		// Check if lead exists
		const existingLead = await Lead.findById(req.params.id);

		if (!existingLead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		// Permission: Admin OR leadAddedBy OR leadOwner can update
		const userId = String(req.user?._id || '');
		const leadAddedById = existingLead.leadAddedBy ? String(existingLead.leadAddedBy) : '';
		const leadOwnerId = existingLead.leadOwner ? String(existingLead.leadOwner) : '';
		const canEdit =
			isAdminUser(req) ||
			hasEditLeadsPermission() ||
			leadAddedById === userId ||
			leadOwnerId === userId;

		if (!canEdit) {
			return res.status(403).json({
				status: false,
				message: 'You do not have permission to update this lead'
			});
		}

		// Check if email already exists (excluding current lead)
		const normalizedEmail = typeof email === "string" ? email.trim() : "";
		if (normalizedEmail && normalizedEmail !== (existingLead.email || "")) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(normalizedEmail)) {
				return res.status(400).json({
					status: false,
					message: "Please enter a valid email address"
				});
			}

			const emailExists = await Lead.findOne({
				email: normalizedEmail,
				leadAddedBy: existingLead.leadAddedBy,
				_id: { $ne: req.params.id }
			});

			if (emailExists) {
				return res.status(400).json({
					status: false,
					message: 'Lead with this email already exists'
				});
			}
		}

		const updatePayload = {
			leadCategory,
			typeOfB2B,
			businessName,
			address,
			city,
			state,
			coordinates,
			concernPersonName,
			designation,
			email: normalizedEmail || undefined,
			mobile,
			whatsapp,
			landlineNumber,
			remark,
		};

		if (leadOwner !== undefined) {
			const ownerRaw = leadOwner != null ? String(leadOwner).trim() : '';
			if (!ownerRaw) {
				updatePayload.leadOwner = null;
			} else if (mongoose.Types.ObjectId.isValid(ownerRaw)) {
				const owner = await User.findById(ownerRaw);
				if (!owner) {
					return res.status(400).json({ status: false, message: 'Lead owner not found' });
				}
				updatePayload.leadOwner = owner._id;
			} else {
				const owner = await User.findOne({
					name: { $regex: new RegExp(`^${ownerRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
				});
				if (!owner) {
					return res.status(400).json({ status: false, message: 'Lead owner not found' });
				}
				updatePayload.leadOwner = owner._id;
			}
		}

		if (b2bProject !== undefined) {
			if (!b2bProject || !mongoose.Types.ObjectId.isValid(b2bProject)) {
				return res.status(400).json({ status: false, message: 'Invalid B2B project' });
			}
			const projectDoc = await B2BProject.findById(b2bProject);
			if (!projectDoc) {
				return res.status(400).json({ status: false, message: 'B2B project not found' });
			}
			const departmentId = updatePayload.b2bDepartment || existingLead.b2bDepartment;
			if (departmentId && String(projectDoc.department) !== String(departmentId)) {
				return res.status(400).json({
					status: false,
					message: 'Selected project does not belong to the selected department'
				});
			}
			updatePayload.b2bProject = b2bProject;
		}

		if (b2bDepartment !== undefined) {
			if (!b2bDepartment || !mongoose.Types.ObjectId.isValid(b2bDepartment)) {
				return res.status(400).json({ status: false, message: 'Invalid B2B department' });
			}
			const departmentDoc = await B2BDepartment.findById(b2bDepartment);
			if (!departmentDoc) {
				return res.status(400).json({ status: false, message: 'B2B department not found' });
			}
			const projectId = updatePayload.b2bProject || existingLead.b2bProject;
			if (projectId) {
				const projectDoc = await B2BProject.findById(projectId);
				if (!projectDoc) {
					return res.status(400).json({ status: false, message: 'B2B project not found' });
				}
				if (String(projectDoc.department) !== String(b2bDepartment)) {
					return res.status(400).json({
						status: false,
						message: 'Selected project does not belong to the selected department'
					});
				}
			}
			updatePayload.b2bDepartment = b2bDepartment;
		}

		if (typeOfB2B !== undefined) {
			const typeDoc = await TypeOfB2B.findById(typeOfB2B);
			if (!typeDoc) {
				return res.status(400).json({ status: false, message: 'B2B type not found' });
			}
			const departmentId = updatePayload.b2bDepartment || existingLead.b2bDepartment;
			if (typeDoc.department && departmentId && String(typeDoc.department) !== String(departmentId)) {
				return res.status(400).json({
					status: false,
					message: 'Selected B2B type does not belong to the selected department'
				});
			}
			updatePayload.typeOfB2B = typeOfB2B;
		}

		// Update lead
		const updatedLead = await Lead.findByIdAndUpdate(
			req.params.id,
			updatePayload,
			{ new: true, runValidators: true }
		).populate([
			{ path: 'leadCategory', select: 'name' },
			{ path: 'b2bProject', select: 'name' },
			{ path: 'b2bDepartment', select: 'name' },
			{ path: 'typeOfB2B', select: 'name' },
			{ path: 'leadAddedBy', select: 'name email' },
			{ path: 'leadOwner', select: 'name email' },
		]);

		res.json({
			status: true,
			data: updatedLead,
			message: 'Lead updated successfully'
		});
	} catch (error) {
		console.error('Error updating lead:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to update lead',
			error: error.message
		});
	}
});

// Delete lead
router.delete('/leads/:id', isCollege, async (req, res) => {
	try {
		const isAdminUser = (req) => req.user?.permissions?.permission_type === 'Admin';
		const lead = await Lead.findById(req.params.id);

		if (!lead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		// Permission: Admin OR leadAddedBy OR leadOwner can delete
		const userId = String(req.user?._id || '');
		const leadAddedById = lead.leadAddedBy ? String(lead.leadAddedBy) : '';
		const leadOwnerId = lead.leadOwner ? String(lead.leadOwner) : '';
		const canDelete = isAdminUser(req) || leadAddedById === userId || leadOwnerId === userId;
		if (!canDelete) {
			return res.status(403).json({
				status: false,
				message: 'You do not have permission to delete this lead'
			});
		}

		await Lead.deleteOne({ _id: req.params.id });

		// Also delete associated follow-ups
		await FollowUp.deleteMany({ leadId: req.params.id });

		res.json({
			status: true,
			message: 'Lead deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting lead:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to delete lead',
			error: error.message
		});
	}
});

// Add remark to lead
router.post('/leads/:id/remarks', isCollege, async (req, res) => {
	try {
		const { remark } = req.body;

		if (!remark) {
			return res.status(400).json({
				status: false,
				message: 'Remark content is required'
			});
		}

		const lead = await Lead.findOne({
			_id: req.params.id,
			leadAddedBy: req.user._id
		});

		if (!lead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		lead.remark.push({
			remark,
			addedBy: req.user._id
		});

		await lead.save();
		await lead.populate('remark.addedBy', 'name email');

		res.json({
			status: true,
			data: lead.remark[lead.remark.length - 1],
			message: 'Remark added successfully'
		});
	} catch (error) {
		console.error('Error adding remark:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to add remark',
			error: error.message
		});
	}
});

// Set follow-up for lead with Google Calendar integration
router.post('/leads/:id/followup', isCollege, async (req, res) => {
	try {
		const {
			followUpType,
			description,
			scheduledDate,
			scheduledTime,
			remarks,
			googleCalendarEvent = false
		} = req.body;

		if (!scheduledDate || !scheduledTime) {
			return res.status(400).json({
				status: false,
				message: 'scheduledDate and scheduledTime are required'
			});
		}

		// Check if lead exists (allow any visible lead; permission already handled elsewhere)
		const lead = await Lead.findById(req.params.id);

		if (!lead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		if (typeof Lead.normalizeApproval === 'function') {
			lead.approval = Lead.normalizeApproval(lead.approval);
		}
		// Combine date and time
		const [hours, minutes] = scheduledTime.split(':');
		// If scheduledDate is yyyy-mm-dd, treat it as local date (avoid UTC shift)
		const scheduledDateTime = /^\d{4}-\d{2}-\d{2}$/.test(String(scheduledDate))
			? new Date(`${scheduledDate}T00:00:00`)
			: new Date(scheduledDate);
		scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

		// Create new follow-up
		const newFollowUp = new FollowUp({
			leadId: req.params.id,
			followUpType: followUpType || 'Call',
			description: description || (String(followUpType || 'Call').toLowerCase() === 'visit' ? 'Followup Visit' : 'Followup Calling'),
			scheduledDate: scheduledDateTime,
			remarks: remarks,
			addedBy: req.user._id
		});

		const savedFollowUp = await newFollowUp.save();

		// Update lead with follow-up reference and add to logs
		const normalizedType = String(followUpType || 'Call').trim();
		lead.followUp = savedFollowUp._id; // keep legacy "last follow-up"
		if (normalizedType.toLowerCase() === 'visit') {
			lead.followUpVisit = savedFollowUp._id;
		} else {
			lead.followUpCall = savedFollowUp._id;
		}
		lead.logs.push({
			user: req.user._id,
			timestamp: new Date(),
			action: `${normalizedType} follow-up scheduled for ${scheduledDateTime.toLocaleDateString()} at ${scheduledTime}`,
			remarks: remarks
		});
		await lead.save();

		// Create Google Calendar event if requested (optional)
		let googleEvent = null;
		if (googleCalendarEvent && req.user.googleAuthToken?.accessToken) {
			try {
				const { createGoogleCalendarEvent } = require('../../services/googleservice');

				const event = {
					summary: `B2B Follow-up: ${lead.businessName}`,
					description: `Follow-up with ${lead.concernPersonName} (${lead.designation || 'N/A'})\n\nBusiness: ${lead.businessName}\nContact: ${lead.mobile}\nEmail: ${lead.email}\n\nRemarks: ${remarks || 'No remarks'}`,
					start: {
						dateTime: scheduledDateTime.toISOString(),
						timeZone: 'Asia/Kolkata',
					},
					end: {
						dateTime: new Date(scheduledDateTime.getTime() + 30 * 60000).toISOString(), // 30 minutes duration
						timeZone: 'Asia/Kolkata',
					},
					reminders: {
						useDefault: false,
						overrides: [
							{ method: 'email', minutes: 24 * 60 }, // 1 day before
							{ method: 'popup', minutes: 15 }, // 15 minutes before
						],
					},
				};

				googleEvent = await createGoogleCalendarEvent({
					user: req.user,
					event: event
				});

				// Update follow-up with Google Calendar event ID (only if present)
				const eventId = googleEvent?.event?.id || googleEvent?.data?.id;
				if (eventId) {
					savedFollowUp.googleCalendarEventId = eventId;
					await savedFollowUp.save();
				} else {
					console.warn('Google Calendar event created but no ID returned:', googleEvent);
				}

			} catch (googleError) {
				console.error('Google Calendar Error:', googleError);
				// Don't fail the entire request if Google Calendar fails
			}
		}

		await savedFollowUp.populate('addedBy', 'name email');

		res.status(201).json({
			status: true,
			data: {
				followUp: savedFollowUp,
				googleEvent: googleEvent?.data || null
			},
			message: 'Follow-up scheduled successfully' + (googleEvent ? ' and added to Google Calendar' : '')
		});
	} catch (error) {
		console.error('Error setting follow-up:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to set follow-up',
			error: error.message
		});
	}
});

// Update follow-up status
router.put('/leads/:id/followup/:followUpId', isCollege, async (req, res) => {
	try {
		const { status, completedDate } = req.body;

		// Check if lead exists (allow any visible lead; permission already handled elsewhere)
		const lead = await Lead.findById(req.params.id);

		if (!lead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		// Update follow-up
		const updatedFollowUp = await FollowUp.findByIdAndUpdate(
			req.params.followUpId,
			{
				status,
				completedDate: status === 'Completed' ? new Date() : completedDate
			},
			{ new: true }
		).populate('addedBy', 'name email');

		if (!updatedFollowUp) {
			return res.status(404).json({
				status: false,
				message: 'Follow-up not found'
			});
		}

		res.json({
			status: true,
			data: updatedFollowUp,
			message: 'Follow-up status updated successfully'
		});
	} catch (error) {
		console.error('Error updating follow-up:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to update follow-up',
			error: error.message
		});
	}
});

// Bulk import leads from CSV/Excel
router.post('/leads/import', isCollege, async (req, res) => {
	try {
		// Default status for bulk upload should be PROSPECT (fallback: Untouch Leads)
		const College = require("../../../models/college");
		const college = await College.findOne({
			'_concernPerson._id': req.user._id
		});

		let defaultStatusId = null;
		let defaultSubStatusId = null;
		
		if (college) {
			// Prefer PROSPECT if configured for this college
			let defaultStatus = await StatusB2b.findOne({
				college: college._id,
				title: { $regex: /^PROSPECT$/i }
			});

			// Fallback to Untouch Leads
			if (!defaultStatus) {
				defaultStatus = await StatusB2b.findOne({
					college: college._id,
					title: { $regex: /^Untouch Leads$/i }
				});
			}

			if (!defaultStatus) {
				defaultStatusId = null;
				defaultSubStatusId = null;
			} else {
				defaultStatusId = defaultStatus._id;
				// If there's a substatus with same name, use it; otherwise use first substatus
				if (defaultStatus.substatuses && defaultStatus.substatuses.length > 0) {
					const titleRx = new RegExp(`^${String(defaultStatus.title).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
					const exactSub = defaultStatus.substatuses.find((sub) => sub.title && titleRx.test(sub.title));
					defaultSubStatusId = (exactSub || defaultStatus.substatuses[0])._id;
				}
			}
		}

		const collegeIdForPipeline = req.user?.college?._id;
		const pipelineStatusScope = collegeIdForPipeline
			? {
					$or: [
						{ college: collegeIdForPipeline },
						{ college: null },
						{ college: { $exists: false } },
					],
			  }
			: {
					$or: [{ college: null }, { college: { $exists: false } }],
			  };

		const resolveBulkPipelineStatus = async (cellValue) => {
			const raw = cellValue != null ? String(cellValue).trim() : '';
			if (!raw) return { statusId: null, subStatusId: null };

			const titleMatch = (lowerTitle) => ({
				$expr: {
					$eq: [
						{ $toLower: { $trim: { input: '$title' } } },
						lowerTitle,
					],
				},
			});

			if (mongoose.Types.ObjectId.isValid(raw)) {
				const byId = await StatusB2b.findOne({
					$and: [{ _id: raw }, pipelineStatusScope],
				});
				if (byId) {
					const subId =
						byId.substatuses?.length > 0 ? byId.substatuses[0]._id : null;
					return { statusId: byId._id, subStatusId: subId };
				}
			}

			const norm = raw.toLowerCase();
			const byTitle = await StatusB2b.findOne({
				$and: [titleMatch(norm), pipelineStatusScope],
			});
			if (byTitle) {
				const subId =
					byTitle.substatuses?.length > 0 ? byTitle.substatuses[0]._id : null;
				return { statusId: byTitle._id, subStatusId: subId };
			}

			return { notFound: raw };
		};

		// Debug: Log request details
		// console.log('Import request received');
		// console.log('req.file:', req.file);
		// console.log('req.files:', req.files);
		// console.log('req.body:', req.body);
		// console.log('Content-Type:', req.headers['content-type']);
		
		// Check for file in req.files (express-fileupload) or req.file (multer)
		let uploadedFile;
		let filePath;
		let fileExtension;
		
		if (req.files && req.files.file) {
			// File uploaded via express-fileupload
			uploadedFile = req.files.file;
			fileExtension = path.extname(uploadedFile.name).toLowerCase();
			
			// Save file to temp directory
			const tempFileName = `${path.basename(uploadedFile.name, fileExtension)}-${Date.now()}${fileExtension}`;
			filePath = path.join(destination, tempFileName);
			
			// Use mv method from express-fileupload to save file
			await new Promise((resolve, reject) => {
				uploadedFile.mv(filePath, (err) => {
					if (err) {
						// console.error('Error saving file:', err);
						reject(err);
					} else {
						resolve();
					}
				});
			});
		} else if (req.file) {
			// File uploaded via multer
			uploadedFile = req.file;
			filePath = req.file.path;
			fileExtension = path.extname(req.file.originalname).toLowerCase();
		} else {
			// console.log('No file found in request');
			return res.status(400).json({
				status: false,
				message: 'Please upload a file'
			});
		}

		let leads = [];

		const headerMap = {
			'businessname': 'businessName',
			'concernpersonname': 'concernPersonName',
			'mobile': 'mobile',
			'email': 'email',
			'leadcategory': 'leadCategory',
			'leadsource': 'leadCategory',
			'b2bdepartment': 'b2bDepartment',
			'b2bdept': 'b2bDepartment',
			'department': 'b2bDepartment',
			'b2bproject': 'b2bProject',
			'project': 'b2bProject',
			'b2bproj': 'b2bProject',
			'typeofb2b': 'typeOfB2B',
			'address': 'address',
			'city': 'city',
			'state': 'state',
			'designation': 'designation',
			'whatsapp': 'whatsapp',
			'landlinenumber': 'landlineNumber',
			'leadowner': 'leadOwner',
			'counsellor': 'leadOwner',
			'counselor': 'leadOwner',
			'leadstatus': 'leadStatus',
			'performance': 'leadStatus',
			'performancestatus': 'leadStatus',
			'pipelinestatus': 'leadStatus',
			'b2bstatus': 'leadStatus',
			'status': 'leadStatus',
			'pipelinesubstatus': 'pipelineSubStatus',
			'substatus': 'pipelineSubStatus',
			'leadsubstatus': 'pipelineSubStatus',
			'b2bsubstatus': 'pipelineSubStatus',
			'substatusname': 'pipelineSubStatus',
			'remark': 'remark',
			'latitude': 'latitude',
			'longitude': 'longitude',
			
			'business': 'businessName',
			'companyname': 'businessName',
			'company': 'businessName',
			'concernperson': 'concernPersonName',
			'concernp': 'concernPersonName',
			'contactperson': 'concernPersonName',
			'contactpersonname': 'concernPersonName',
			'mobilenumber': 'mobile',
			'phone': 'mobile',
			'phonenumber': 'mobile',
			'emailaddress': 'email',
			'leadcate': 'leadCategory',
			'category': 'leadCategory',
			'source': 'leadCategory',
			'leadsrc': 'leadCategory',
			'leadsourcecategory': 'leadCategory',
			'typeofb2': 'typeOfB2B',
			'typeofb': 'typeOfB2B',
			'b2btype': 'typeOfB2B',
			'businessaddress': 'address',
			'designati': 'designation',
			'whatsappnumber': 'whatsapp',
			'landline': 'landlineNumber',
			'leadown': 'leadOwner',
			'owner': 'leadOwner',
			'remarks': 'remark',
			'notes': 'remark',
			'lat': 'latitude',
			'lng': 'longitude',
			'lon': 'longitude'
		};

		if (fileExtension === '.xlsx' || fileExtension === '.xls') {
			// Parse Excel
			const excelData = await readXlsxFile(filePath);
			const headers = excelData[0];
			
			// console.log('Excel headers:', headers);
			// console.log('First data row:', excelData[1]);
			
			// Normalize headers (trim, lowercase for matching)
			const normalizedHeaders = headers.map(h => h ? String(h).trim() : '');
			
			// headerMap already defined above for both CSV and Excel
			
			// Process rows
			leads = excelData.slice(1).map((row, rowIndex) => {
				const obj = {};
				normalizedHeaders.forEach((header, index) => {
					if (!header) return;
					
					// Normalize header: lowercase, remove spaces, remove special chars
					const normalizedKey = header.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
					
					// Try exact match first
					let mappedKey = headerMap[normalizedKey];
					
					// If no exact match, try partial matching
					if (!mappedKey) {
						// Try to find a key that starts with normalizedKey or vice versa
						for (const [key, value] of Object.entries(headerMap)) {
							if (normalizedKey.startsWith(key) || key.startsWith(normalizedKey)) {
								mappedKey = value;
								break;
							}
						}
					}
					
					// If still no match, use original header
					if (!mappedKey) {
						mappedKey = header.trim();
					}
					
					let value = row[index];
					
					if (value === null || value === undefined) {
						return;
					}
					
					if (mappedKey === 'mobile' || mappedKey === 'whatsapp' || mappedKey === 'landlineNumber') {
						if (typeof value === 'number') {
							
							if (value >= 1e9 || value < -1e9) {
								value = value.toFixed(0);
							} else {
								value = value.toString();
							}
							value = value.replace(/\.0+$/, '').replace('.', '');
						} else if (typeof value === 'string') {
							if (value.includes('E+') || value.includes('e+') || value.includes('E-') || value.includes('e-')) {
								const numValue = parseFloat(value);
								if (!isNaN(numValue)) {
									value = numValue.toFixed(0);
								}
							}
						}
					}
					
					const stringValue = String(value).trim();
					
					if (stringValue !== 'undefined' && stringValue !== 'null') {
						obj[mappedKey] = stringValue;
					}
				});				
				return obj;
			});
		} else {
			return res.status(400).json({
				status: false,
				message: 'Unsupported file format. Please upload an Excel file (.xlsx or .xls)'
			});
		}

		let defaultLeadCategoryDoc = null;
		let defaultB2bDepartmentDoc = null;
		let defaultB2bProjectDoc = null;
		let defaultTypeOfB2BDoc = null;
		let modalStatusId = null;
		let modalSubStatusId = null;

		const bodyLeadCategory = req.body?.leadCategory ? String(req.body.leadCategory).trim() : '';
		const bodyB2bDepartment = req.body?.b2bDepartment ? String(req.body.b2bDepartment).trim() : '';
		const bodyB2bProject = req.body?.b2bProject ? String(req.body.b2bProject).trim() : '';
		const bodyTypeOfB2B = req.body?.typeOfB2B ? String(req.body.typeOfB2B).trim() : '';
		const bodyLeadStatus = req.body?.leadStatus ? String(req.body.leadStatus).trim() : '';
		const bodyLeadSubStatus = req.body?.leadSubStatus ? String(req.body.leadSubStatus).trim() : '';
		const bodyLeadOwner = req.body?.leadOwner ? String(req.body.leadOwner).trim() : '';

		if (bodyLeadCategory && mongoose.Types.ObjectId.isValid(bodyLeadCategory)) {
			defaultLeadCategoryDoc = await LeadCategory.findById(bodyLeadCategory);
		}
		if (bodyB2bDepartment && mongoose.Types.ObjectId.isValid(bodyB2bDepartment)) {
			defaultB2bDepartmentDoc = await B2BDepartment.findById(bodyB2bDepartment);
		}
		if (bodyB2bProject && mongoose.Types.ObjectId.isValid(bodyB2bProject)) {
			defaultB2bProjectDoc = await B2BProject.findById(bodyB2bProject);
		}
		if (bodyTypeOfB2B && mongoose.Types.ObjectId.isValid(bodyTypeOfB2B)) {
			defaultTypeOfB2BDoc = await TypeOfB2B.findById(bodyTypeOfB2B);
		}
		if (bodyLeadStatus) {
			const resolvedModal = await resolveBulkPipelineStatus(bodyLeadStatus);
			if (resolvedModal.statusId) {
				modalStatusId = resolvedModal.statusId;
				modalSubStatusId = resolvedModal.subStatusId;
			}
		}
		if (bodyLeadSubStatus && mongoose.Types.ObjectId.isValid(bodyLeadSubStatus) && modalStatusId) {
			const stDoc = await StatusB2b.findById(modalStatusId).select('substatuses');
			const matched = (stDoc?.substatuses || []).find((s) => String(s._id) === bodyLeadSubStatus);
			if (matched) modalSubStatusId = matched._id;
		}

		let modalLeadOwnerId = null;
		if (bodyLeadOwner) {
			if (mongoose.Types.ObjectId.isValid(bodyLeadOwner)) {
				const owner = await User.findById(bodyLeadOwner);
				if (owner) modalLeadOwnerId = owner._id;
			}
			if (!modalLeadOwnerId) {
				return res.status(400).json({
					status: false,
					message: 'Invalid Counsellor selected in the upload form. Please choose again.'
				});
			}
		}

		if (!defaultLeadCategoryDoc || !defaultB2bDepartmentDoc || !defaultB2bProjectDoc || !defaultTypeOfB2BDoc) {
			return res.status(400).json({
				status: false,
				message: 'Please select Lead Source, B2B Department, B2B Project, and Type of B2B in the upload form before importing.'
			});
		}

		if (String(defaultB2bProjectDoc.department) !== String(defaultB2bDepartmentDoc._id)) {
			return res.status(400).json({
				status: false,
				message: 'Selected B2B project does not belong to the selected department.'
			});
		}

		if (
			defaultTypeOfB2BDoc.department &&
			String(defaultTypeOfB2BDoc.department) !== String(defaultB2bDepartmentDoc._id)
		) {
			return res.status(400).json({
				status: false,
				message: 'Selected B2B type does not belong to the selected department.'
			});
		}

		if (bodyLeadStatus && !modalStatusId) {
			return res.status(400).json({
				status: false,
				message: 'Invalid Lead Status selected in the upload form. Please choose again.'
			});
		}

		const useModalLeadSource = Boolean(defaultLeadCategoryDoc);
		const useModalB2bType = Boolean(defaultTypeOfB2BDoc);
		const useModalPipeline = Boolean(modalStatusId);
		const useModalLeadOwner = Boolean(modalLeadOwnerId);

		leads = leads.filter((row) => {
			if (!row || typeof row !== 'object') return false;
			const hasBusiness = row.businessName != null && String(row.businessName).trim() !== '';
			const hasPerson = row.concernPersonName != null && String(row.concernPersonName).trim() !== '';
			const hasMobile = row.mobile != null && String(row.mobile).trim() !== '';
			return hasBusiness || hasPerson || hasMobile;
		});

		// Process and validate leads
		const processedLeads = [];
		const errors = [];

		// Bulk-only duplicate restriction:
		// - Reject duplicates inside the same upload file (mobile/email)
		// - Reject duplicates against existing leads for the same leadAddedBy (mobile/email)
		const normalizeEmail = (v) => String(v || '').trim().toLowerCase();
		const normalizeMobile = (v) => String(v || '').replace(/\D/g, '');

		const fileMobiles = [];
		const fileEmails = [];
		for (let i = 0; i < leads.length; i++) {
			const row = leads[i];
			if (!row || typeof row !== 'object') continue;
			const m = normalizeMobile(row.mobile);
			if (m) fileMobiles.push(m);
			const e = normalizeEmail(row.email);
			if (e) fileEmails.push(e);
		}

		const existingMobileSet = new Set();
		const existingEmailSet = new Set();
		if (fileMobiles.length || fileEmails.length) {
			const existing = await Lead.find({
				leadAddedBy: req.user._id,
				$or: [
					...(fileMobiles.length ? [{ mobile: { $in: fileMobiles } }] : []),
					...(fileEmails.length ? [{ email: { $in: fileEmails } }] : []),
				],
			})
				.select('mobile email')
				.lean();

			for (const doc of existing || []) {
				if (doc?.mobile) existingMobileSet.add(String(doc.mobile));
				if (doc?.email) existingEmailSet.add(normalizeEmail(doc.email));
			}
		}

		const seenMobileInFile = new Set();
		const seenEmailInFile = new Set();

		for (let i = 0; i < leads.length; i++) {
			const row = leads[i];
			try {
				// Validate required fields
				if (!row.businessName || !row.concernPersonName || !row.mobile) {
					errors.push(`Row ${i + 2}: Missing required fields (Business Name, Concern Person Name, Mobile are required)`);
					continue;
				}

				// Validate phone number format (10 digits — mobile or landline)
				const phoneRegex = /^\d{10}$/;
				const cleanMobile = normalizeMobile(row.mobile);
				if (!phoneRegex.test(cleanMobile)) {
					errors.push(`Row ${i + 2}: Invalid phone number format (should be 10 digits)`);
					continue;
				}

				const rowEmailNorm = normalizeEmail(row.email);

				// Restrict duplicates within the same uploaded file
				if (seenMobileInFile.has(cleanMobile)) {
					errors.push(`Row ${i + 2}: Mobile ${cleanMobile} is duplicate in the uploaded file`);
					continue;
				}
				seenMobileInFile.add(cleanMobile);

				if (rowEmailNorm) {
					if (seenEmailInFile.has(rowEmailNorm)) {
						errors.push(`Row ${i + 2}: Email ${rowEmailNorm} is duplicate in the uploaded file`);
						continue;
					}
					seenEmailInFile.add(rowEmailNorm);
				}

				// Restrict duplicates against existing leads in DB (bulk only)
				if (existingMobileSet.has(cleanMobile)) {
					errors.push(`Row ${i + 2}: Mobile ${cleanMobile} already exists`);
					continue;
				}
				if (rowEmailNorm && existingEmailSet.has(rowEmailNorm)) {
					errors.push(`Row ${i + 2}: Email ${rowEmailNorm} already exists`);
					continue;
				}

				// Lead Source: modal selection applies to all rows when set on upload form
				let leadCategory = defaultLeadCategoryDoc;
				const rowLeadSource =
					!useModalLeadSource &&
					row.leadCategory != null &&
					String(row.leadCategory).trim() !== ''
						? String(row.leadCategory).trim()
						: '';

				if (rowLeadSource) {
					const leadSourceNorm = rowLeadSource.toLowerCase();
					const leadCatNameLowerMatch = {
						$expr: {
							$eq: [
								{ $toLower: { $trim: { input: '$name' } } },
								leadSourceNorm
							]
						}
					};

					let rowLeadCategory = await LeadCategory.findOne({
						...leadCatNameLowerMatch,
						isActive: true
					});
					if (!rowLeadCategory) {
						rowLeadCategory = await LeadCategory.findOne(leadCatNameLowerMatch);
					}
					if (!rowLeadCategory && mongoose.Types.ObjectId.isValid(rowLeadSource)) {
						rowLeadCategory = await LeadCategory.findById(rowLeadSource);
					}
					if (!rowLeadCategory) {
						let availableCategories = await LeadCategory.find({ isActive: true }).select('name').limit(10);
						if (availableCategories.length === 0) {
							availableCategories = await LeadCategory.find({}).select('name').limit(10);
						}
						const categoryNames = availableCategories.map((c) => c.name).join(', ');
						errors.push(`Row ${i + 2}: Lead Source "${rowLeadSource}" not found. Available sources: ${categoryNames || 'None'}`);
						continue;
					}
					leadCategory = rowLeadCategory;
				}

				// Type of B2B: modal selection applies to all rows when set on upload form
				let typeOfB2B = defaultTypeOfB2BDoc;
				const rowB2bType =
					!useModalB2bType &&
					row.typeOfB2B != null &&
					String(row.typeOfB2B).trim() !== ''
						? String(row.typeOfB2B).trim()
						: '';

				if (rowB2bType) {
					const b2bTypeNorm = rowB2bType.toLowerCase();
					const b2bTypeNameLowerMatch = {
						$expr: {
							$eq: [
								{ $toLower: { $trim: { input: '$name' } } },
								b2bTypeNorm
							]
						}
					};

					let rowTypeOfB2B = await TypeOfB2B.findOne({
						...b2bTypeNameLowerMatch,
						isActive: true
					});
					if (!rowTypeOfB2B) {
						rowTypeOfB2B = await TypeOfB2B.findOne(b2bTypeNameLowerMatch);
					}
					if (!rowTypeOfB2B && mongoose.Types.ObjectId.isValid(rowB2bType)) {
						rowTypeOfB2B = await TypeOfB2B.findById(rowB2bType);
					}
					if (!rowTypeOfB2B) {
						let availableTypes = await TypeOfB2B.find({ isActive: true }).select('name').limit(10);
						if (availableTypes.length === 0) {
							availableTypes = await TypeOfB2B.find({}).select('name').limit(10);
						}
						const typeNames = availableTypes.map((t) => t.name).join(', ');
						errors.push(`Row ${i + 2}: Type of B2B "${rowB2bType}" not found. Available types: ${typeNames || 'None'}`);
						continue;
					}
					typeOfB2B = rowTypeOfB2B;
				}

				let rowPipelineStatusId = null;
				let rowPipelineSubStatusId = null;
				if (useModalPipeline) {
					rowPipelineStatusId = modalStatusId;
					rowPipelineSubStatusId = modalSubStatusId;
				} else if (row.leadStatus != null && String(row.leadStatus).trim() !== '') {
					const resolved = await resolveBulkPipelineStatus(row.leadStatus);
					if (resolved.notFound != null) {
						const avail = await StatusB2b.find(pipelineStatusScope)
							.select('title')
							.sort({ index: 1 })
							.limit(40);
						const names = avail.map((s) => s.title).filter(Boolean).join(', ');
						errors.push(
							`Row ${i + 2}: Lead Status "${resolved.notFound}" not found. Available: ${names || 'None'}`
						);
						continue;
					}
					rowPipelineStatusId = resolved.statusId;
					rowPipelineSubStatusId = resolved.subStatusId;
				}

				const rawPipelineSub =
					!useModalPipeline &&
					row.pipelineSubStatus != null &&
					String(row.pipelineSubStatus).trim() !== ''
						? String(row.pipelineSubStatus).trim()
						: '';
				if (rawPipelineSub) {
					const parentId = rowPipelineStatusId || defaultStatusId;
					if (!parentId) {
						errors.push(
							`Row ${i + 2}: Sub Status "${rawPipelineSub}" cannot be used without a resolvable pipeline status (set Lead Status or rely on import default).`
						);
						continue;
					}
					const stDoc = await StatusB2b.findById(parentId).select('substatuses');
					const subs = stDoc?.substatuses || [];
					let matchedSub = null;
					if (mongoose.Types.ObjectId.isValid(rawPipelineSub)) {
						matchedSub = subs.find((s) => String(s._id) === rawPipelineSub);
					}
					if (!matchedSub) {
						const norm = rawPipelineSub.toLowerCase();
						matchedSub = subs.find((s) => (s.title || '').trim().toLowerCase() === norm);
					}
					if (!matchedSub) {
						const titles = subs.map((s) => s.title).filter(Boolean).join(', ');
						errors.push(
							`Row ${i + 2}: Sub Status "${rawPipelineSub}" not found for this pipeline status. Available: ${titles || 'None'}`
						);
						continue;
					}
					rowPipelineSubStatusId = matchedSub._id;
				} else if (!rawPipelineSub && modalSubStatusId && rowPipelineStatusId) {
					rowPipelineSubStatusId = modalSubStatusId;
				}

				// Create lead object
				const leadData = {
					leadCategory: leadCategory._id,
					b2bDepartment: defaultB2bDepartmentDoc._id,
					b2bProject: defaultB2bProjectDoc._id,
					typeOfB2B: typeOfB2B._id,
					businessName: row.businessName.trim(),
					concernPersonName: row.concernPersonName.trim(),
					mobile: cleanMobile,
					address: row.address || row.businessAddress || '',
					city: row.city || '',
					state: row.state || '',
					designation: row.designation || '',
					email: row.email || '',
					whatsapp: row.whatsapp ? row.whatsapp.replace(/\D/g, '') : '',
					landlineNumber: row.landlineNumber || row.landline || '',
					remark: row.remark || row.remarks || '',
					leadAddedBy: req.user._id
				};

				if (rowPipelineStatusId) {
					leadData.status = rowPipelineStatusId;
					if (rowPipelineSubStatusId) {
						leadData.subStatus = rowPipelineSubStatusId;
					}
				} else if (defaultStatusId) {
					leadData.status = defaultStatusId;
					if (rowPipelineSubStatusId) {
						leadData.subStatus = rowPipelineSubStatusId;
					} else if (defaultSubStatusId) {
						leadData.subStatus = defaultSubStatusId;
					}
				}

				if (useModalLeadOwner) {
					leadData.leadOwner = modalLeadOwnerId;
				} else if (row.leadOwner && row.leadOwner.trim()) {
					const ownerName = row.leadOwner.trim();

					let owner = null;
					if (mongoose.Types.ObjectId.isValid(ownerName)) {
						owner = await User.findById(ownerName);
					}

					if (!owner) {
						const ownerNorm = ownerName.toLowerCase();
						owner = await User.findOne({
							$expr: {
								$eq: [
									{ $toLower: { $trim: { input: '$name' } } },
									ownerNorm
								]
							}
						});
					}
					
					if (owner) {
						leadData.leadOwner = owner._id;
					} else {
						// console.log(`Row ${i + 2}: Lead Owner "${ownerName}" not found. Continuing without owner.`);
					}
				}

				// Add coordinates if provided
				if (row.latitude && row.longitude) {
					leadData.coordinates = {
						type: "Point",
						coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)]
					};
				}

				processedLeads.push(leadData);
			} catch (error) {
				errors.push(`Row ${i + 2}: ${error.message}`);
			}
		}

		// Insert leads
		let insertedLeads = [];
		if (processedLeads.length > 0) {
			insertedLeads = await Lead.insertMany(processedLeads);
		}

		// Group similar errors together
		const groupedErrors = [];
		const errorGroups = {
			'typeOfB2B': { rows: [], values: new Set(), availableTypes: '' },
			'leadCategory': { rows: [], values: new Set(), availableCategories: '' },
			'other': []
		};

		errors.forEach(error => {
			// Extract row number from error message
			const rowMatch = error.match(/Row (\d+):/);
			const rowNum = rowMatch ? parseInt(rowMatch[1]) : null;

			// Group Type of B2B errors
			if (error.includes('Type of B2B') && error.includes('not found')) {
				const valueMatch = error.match(/Type of B2B "([^"]+)" not found/);
				const availableMatch = error.match(/Available types: (.+)$/);
				if (valueMatch) {
					errorGroups.typeOfB2B.values.add(valueMatch[1]);
					if (rowNum) errorGroups.typeOfB2B.rows.push(rowNum);
					if (availableMatch) {
						errorGroups.typeOfB2B.availableTypes = availableMatch[1];
					}
				}
			}
			// Group Lead Source errors
			else if (error.includes('Lead Source') && error.includes('not found')) {
				const valueMatch = error.match(/Lead Source "([^"]+)" not found/);
				const availableMatch = error.match(/Available sources: (.+)$/);
				if (valueMatch) {
					errorGroups.leadCategory.values.add(valueMatch[1]);
					if (rowNum) errorGroups.leadCategory.rows.push(rowNum);
					if (availableMatch) {
						errorGroups.leadCategory.availableCategories = availableMatch[1];
					}
				}
			}
			// Other errors
			else {
				errorGroups.other.push(error);
			}
		});

		// Create grouped error messages
		if (errorGroups.typeOfB2B.rows.length > 0) {
			const sortedRows = [...new Set(errorGroups.typeOfB2B.rows)].sort((a, b) => a - b);
			const valuesList = Array.from(errorGroups.typeOfB2B.values).join(', ');
			groupedErrors.push(`Rows ${sortedRows.join(', ')}: Type of B2B (${valuesList}) not found. Available types: ${errorGroups.typeOfB2B.availableTypes || 'None'}`);
		}

		if (errorGroups.leadCategory.rows.length > 0) {
			const sortedRows = [...new Set(errorGroups.leadCategory.rows)].sort((a, b) => a - b);
			const valuesList = Array.from(errorGroups.leadCategory.values).join(', ');
			groupedErrors.push(`Rows ${sortedRows.join(', ')}: Lead Source (${valuesList}) not found. Available sources: ${errorGroups.leadCategory.availableCategories || 'None'}`);
		}

		// Add other errors as-is
		groupedErrors.push(...errorGroups.other);

		// Clean up uploaded file
		fs.unlinkSync(filePath);

		res.json({
			status: true,
			data: {
				inserted: insertedLeads.length,
				errors: groupedErrors.length,
				errorDetails: groupedErrors
			},
			message: `Import completed. ${insertedLeads.length} leads imported successfully${groupedErrors.length > 0 ? `, ${groupedErrors.length} errors found` : ''}`
		});
	} catch (error) {
		console.error('Error importing leads:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to import leads',
			error: error.message
		});
	}
});

// Get lead statistics
router.get('/leads/stats/overview', isCollege, async (req, res) => {
	try {
		const stats = await Lead.aggregate([
			{
				$match: {
					leadAddedBy: req.user._id
				}
			},
			{
				$group: {
					_id: null,
					totalLeads: { $sum: 1 },
					leadsWithFollowUp: {
						$sum: { $cond: [{ $ne: ['$followUp', null] }, 1, 0] }
					},
					leadsWithRemarks: {
						$sum: { $cond: [{ $gt: [{ $size: '$remark' }, 0] }, 1, 0] }
					}
				}
			}
		]);

		const statusStats = await Lead.aggregate([
			{
				$match: {
					leadAddedBy: req.user._id
				}
			},
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 }
				}
			}
		]);

		const monthlyStats = await Lead.aggregate([
			{
				$match: {
					leadAddedBy: req.user._id,
					createdAt: {
						$gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
					}
				}
			},
			{
				$group: {
					_id: {
						year: { $year: '$createdAt' },
						month: { $month: '$createdAt' }
					},
					count: { $sum: 1 }
				}
			},
			{
				$sort: { '_id.year': 1, '_id.month': 1 }
			}
		]);

		res.json({
			status: true,
			data: {
				overview: stats[0] || {
					totalLeads: 0,
					leadsWithFollowUp: 0,
					leadsWithRemarks: 0
				},
				statusStats,
				monthlyStats
			},
			message: 'Lead statistics retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting lead statistics:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve lead statistics',
			error: error.message
		});
	}
});

// Get B2B Dashboard Analytics
router.get('/dashboard', isCollege, async (req, res) => {
	try {
		const { startDate, endDate, period = 'last30' } = req.query;

		// Check if user is Admin - only Admin can view all B2B leads
		const isAdmin = () => {
			const permissionType = req.user.permissions?.permission_type;
			return permissionType === 'Admin';
		};

		let ownershipConditions = [];

		// Only apply team member filter if user is not Admin
		// Admin can view all leads, others can only view their team members' leads
		if (!isAdmin()) {
			let teamMembers = await getAllTeamMembers(req.user._id);
			// Ownership Conditions for team members
			ownershipConditions = teamMembers.map(member => ({
				$or: [{ leadAddedBy: member }, { leadOwner: member }]
			}));
		}

		// Date range filter
		let dateFilter = {};
		if (startDate && endDate) {
			dateFilter.createdAt = {
				$gte: new Date(startDate),
				$lte: new Date(endDate)
			};
		} else {
			// Default to last 30 days if no date range provided
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			dateFilter.createdAt = {
				$gte: thirtyDaysAgo,
				$lte: new Date()
			};
		}

		
		const andConditions = [];

		if (ownershipConditions.length > 0) {
			andConditions.push({
				$or: ownershipConditions.flatMap(c => c.$or || [c])
			});
		}

		if (Object.keys(dateFilter).length > 0) {
			andConditions.push(dateFilter);
		}

		const finalQuery = andConditions.length > 0 ? { $and: andConditions } : {};

		// Get overview statistics
		const overviewStats = await Lead.aggregate([
			{ $match: finalQuery },
			{
				$group: {
					_id: null,
					totalLeads: { $sum: 1 },
					activeLeads: {
						$sum: {
							$cond: [
								{ $in: ['$status', [null, undefined]] },
								1,
								0
							]
						}
					},
					convertedLeads: {
						$sum: {
							$cond: [
								{ $eq: ['$status', 'Converted'] },
								1,
								0
							]
						}
					}
				}
			}
		]);

		// Get pending followups count
		const pendingFollowupsCount = await Lead.aggregate([
			{ $match: finalQuery },
			{
				$lookup: {
					from: 'followups',
					localField: 'followUp',
					foreignField: '_id',
					as: 'followupInfo'
				}
			},
			{
				$unwind: {
					path: '$followupInfo',
					preserveNullAndEmptyArrays: false
				}
			},
			{
				$match: {
					'followupInfo.status': 'Pending'
				}
			},
			{
				$count: 'count'
			}
		]);

		// Get status distribution
		const statusDistribution = await Lead.aggregate([
			{ $match: finalQuery },
			{
				$lookup: {
					from: 'statusb2bs',
					localField: 'status',
					foreignField: '_id',
					as: 'statusInfo'
				}
			},
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 },
					statusName: { $first: { $arrayElemAt: ['$statusInfo.title', 0] } }
				}
			},
			{
				$project: {
					statusName: { $ifNull: ['$statusName', 'No Status'] },
					count: 1,
					color: {
						$switch: {
							branches: [
								{ case: { $eq: ['$statusName', 'Converted'] }, then: '#10b981' },
								{ case: { $eq: ['$statusName', 'Active'] }, then: '#3b82f6' },
								{ case: { $eq: ['$statusName', 'Pending'] }, then: '#f59e0b' },
								{ case: { $eq: ['$statusName', 'Rejected'] }, then: '#ef4444' }
							],
							default: '#6b7280'
						}
					}
				}
			}
		]);

		// Get monthly trends (last 6 months)
		const monthlyTrends = await Lead.aggregate([
			{ $match: finalQuery },
			{
				$group: {
					_id: {
						year: { $year: '$createdAt' },
						month: { $month: '$createdAt' }
					},
					leads: { $sum: 1 },
					conversions: {
						$sum: {
							$cond: [
								{ $eq: ['$status', 'Converted'] },
								1,
								0
							]
						}
					}
				}
			},
			{
				$sort: { '_id.year': 1, '_id.month': 1 }
			},
			{
				$limit: 6
			},
			{
				$project: {
					month: {
						$concat: [
							{ $toString: '$_id.month' },
							'/',
							{ $toString: '$_id.year' }
						]
					},
					leads: 1,
					conversions: 1,
					revenue: { $multiply: ['$conversions', 15000] } // Assuming 15000 per conversion
				}
			}
		]);

		// Get lead categories distribution
		const leadCategories = await Lead.aggregate([
			{ $match: finalQuery },
			{
				$lookup: {
					from: 'leadcategories',
					localField: 'leadCategory',
					foreignField: '_id',
					as: 'categoryInfo'
				}
			},
			{
				$group: {
					_id: '$leadCategory',
					count: { $sum: 1 },
					categoryName: { $first: { $arrayElemAt: ['$categoryInfo.name', 0] } }
				}
			},
			{
				$project: {
					categoryName: { $ifNull: ['$categoryName', 'Unknown'] },
					count: 1,
					color: {
						$switch: {
							branches: [
								{ case: { $eq: ['$categoryName', 'Website'] }, then: '#3b82f6' },
								{ case: { $eq: ['$categoryName', 'Referral'] }, then: '#10b981' },
								{ case: { $eq: ['$categoryName', 'Social Media'] }, then: '#8b5cf6' },
								{ case: { $eq: ['$categoryName', 'Cold Call'] }, then: '#f59e0b' },
								{ case: { $eq: ['$categoryName', 'Direct'] }, then: '#ef4444' },
								{ case: { $eq: ['$categoryName', 'Partner'] }, then: '#8b5cf6' }
							],
							default: '#6b7280'
						}
					}
				}
			},
			{
				$sort: { count: -1 }
			}
		]);

		// Get B2B types distribution
		const b2bTypes = await Lead.aggregate([
			{ $match: finalQuery },
			{
				$lookup: {
					from: 'typeofb2bs',
					localField: 'typeOfB2B',
					foreignField: '_id',
					as: 'typeInfo'
				}
			},
			{
				$group: {
					_id: '$typeOfB2B',
					count: { $sum: 1 },
					typeName: { $first: { $arrayElemAt: ['$typeInfo.name', 0] } }
				}
			},
			{
				$project: {
					typeName: { $ifNull: ['$typeName', 'Unknown'] },
					count: 1,
					color: {
						$switch: {
							branches: [
								{ case: { $eq: ['$typeName', 'Corporate'] }, then: '#3b82f6' },
								{ case: { $eq: ['$typeName', 'Startup'] }, then: '#10b981' },
								{ case: { $eq: ['$typeName', 'SME'] }, then: '#f59e0b' },
								{ case: { $eq: ['$typeName', 'Enterprise'] }, then: '#8b5cf6' },
								{ case: { $eq: ['$typeName', 'Government'] }, then: '#ef4444' }
							],
							default: '#6b7280'
						}
					}
				}
			},
			{
				$sort: { count: -1 }
			}
		]);

		// Get top performers (counselors)
		const topPerformers = await Lead.aggregate([
			{ $match: finalQuery },
			{
				$lookup: {
					from: 'users',
					localField: 'leadOwner',
					foreignField: '_id',
					as: 'ownerInfo'
				}
			},
			{
				$group: {
					_id: '$leadOwner',
					leads: { $sum: 1 },
					conversions: {
						$sum: {
							$cond: [
								{ $eq: ['$status', 'Converted'] },
								1,
								0
							]
						}
					},
					name: { $first: { $arrayElemAt: ['$ownerInfo.name', 0] } }
				}
			},
			{
				$project: {
					name: { $ifNull: ['$name', 'Unknown'] },
					leads: 1,
					conversions: 1,
					rate: {
						$round: [
							{
								$multiply: [
									{ $divide: ['$conversions', '$leads'] },
									100
								]
							},
							1
						]
					}
				}
			},
			{
				$sort: { rate: -1 }
			},
			{
				$limit: 5
			}
		]);

		// Get recent leads
		const recentLeads = await Lead.find(finalQuery)
			.populate('leadCategory', 'name')
			.populate('status', 'title')
			.populate('leadAddedBy', 'name')
			.sort({ createdAt: -1 })
			.limit(10)
			.lean();

		// Get upcoming followups
		const upcomingFollowups = await Lead.aggregate([
			{ $match: finalQuery },
			{
				$lookup: {
					from: 'followups',
					localField: 'followUp',
					foreignField: '_id',
					as: 'followupInfo'
				}
			},
			{
				$unwind: {
					path: '$followupInfo',
					preserveNullAndEmptyArrays: false
				}
			},
			{
				$match: {
					'followupInfo.scheduledDate': {
						$gte: new Date(),
						$lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
					},
					'followupInfo.status': 'Pending'
				}
			},
			{
				$project: {
					businessName: 1,
					concernPersonName: 1,
					mobile: 1,
					scheduledDate: '$followupInfo.scheduledDate',
					priority: {
						$switch: {
							branches: [
								{ case: { $lt: ['$followupInfo.scheduledDate', new Date(Date.now() + 24 * 60 * 60 * 1000)] }, then: 'High' },
								{ case: { $lt: ['$followupInfo.scheduledDate', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)] }, then: 'Medium' }
							],
							default: 'Low'
						}
					}
				}
			},
			{
				$sort: { scheduledDate: 1 }
			},
			{
				$limit: 5
			}
		]);

		// Calculate total revenue
		const totalRevenue = overviewStats[0]?.convertedLeads * 15000 || 0;

		const dashboardData = {
			overview: {
				totalLeads: overviewStats[0]?.totalLeads || 0,
				activeLeads: overviewStats[0]?.activeLeads || 0,
				convertedLeads: overviewStats[0]?.convertedLeads || 0,
				pendingFollowups: pendingFollowupsCount[0]?.count || 0,
				totalRevenue: totalRevenue
			},
			statusDistribution,
			monthlyTrends,
			leadCategories,
			b2bTypes,
			topPerformers,
			recentLeads: recentLeads.map(lead => ({
				businessName: lead.businessName,
				concernPersonName: lead.concernPersonName,
				designation: lead.designation,
				leadCategory: lead.leadCategory?.name || 'Unknown',
				status: lead.status?.title || 'No Status',
				createdAt: lead.createdAt
			})),
			upcomingFollowups
		};

		res.json({
			status: true,
			data: dashboardData,
			message: 'Dashboard data retrieved successfully'
		});

	} catch (error) {
		console.error('Error getting dashboard data:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve dashboard data',
			error: error.message
		});
	}
});

// Get followups for a lead
router.get('/leads/:leadId/followups', isCollege, async (req, res) => {
	try {
		const { leadId } = req.params;

		const followups = await FollowUp.find({ leadId })
			.populate('addedBy', 'name email')
			.sort({ scheduledDate: 1 });

		res.json({
			status: true,
			data: followups,
			message: 'Followups retrieved successfully'
		});

	} catch (error) {
		console.error('Error getting followups:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve followups',
			error: error.message
		});
	}
});

// Add test followup for a lead (for testing purposes)
router.post('/add-test-followup/:leadId', isCollege, async (req, res) => {
	try {
		const { leadId } = req.params;
		const { scheduledDate, description = 'Test followup' } = req.body;

		// Check if lead exists
		const lead = await Lead.findById(leadId);
		if (!lead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		// Create followup
		const followup = new FollowUp({
			leadId: leadId,
			followUpType: 'Call',
			description: description,
			status: 'Pending',
			scheduledDate: scheduledDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow by default
			addedBy: req.user._id
		});

		await followup.save();

		// Update lead with followup reference
		lead.followUp = followup._id;
		await lead.save();

		res.json({
			status: true,
			data: followup,
			message: 'Test followup added successfully'
		});

	} catch (error) {
		console.error('Error adding test followup:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to add test followup',
			error: error.message
		});
	}
});

router.post('/refer-lead', isCollege, async (req, res) => {
	try {
		const { leadId, counselorId } = req.body;

		if (!leadId || !isValidId(leadId)) {
			return res.status(400).json({ status: false, message: 'Valid leadId is required' });
		}
		if (!counselorId || !isValidId(counselorId)) {
			return res.status(400).json({ status: false, message: 'Valid counselorId is required' });
		}

		const user = req.user;
		const lead = await Lead.findById(leadId).select('leadOwner').lean();
		if (!lead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		const [newUser, oldUser] = await Promise.all([
			User.findById(counselorId).select('name').lean(),
			lead.leadOwner
				? User.findById(lead.leadOwner).select('name').lean()
				: Promise.resolve(null)
		]);

		if (!newUser) {
			return res.status(404).json({ status: false, message: 'Counselor not found' });
		}

		const oldName = oldUser?.name?.trim() || 'Unassigned';
		const newName = newUser.name?.trim() || 'Unknown';
		const oldOwnerId = lead.leadOwner;

		const update = {
			$set: {
				leadOwner: counselorId,
				updatedBy: user._id
			},
			$push: {
				logs: {
					user: user._id,
					action: `Lead referred from ${oldName} to ${newName}`,
					timestamp: new Date(),
					remarks: ''
				}
			}
		};
		if (oldOwnerId) {
			update.$push.previousLeadOwners = oldOwnerId;
		}

		const result = await Lead.updateOne({ _id: leadId }, update);
		if (!result.matchedCount) {
			return res.status(404).json({ status: false, message: 'Lead not found' });
		}

		return res.status(200).json({
			status: true,
			message: 'Lead referred successfully'
		});
	}
	catch (err) {
		console.error('Error referring lead:', err);
		return res.status(500).json({
			status: false,
			message: 'Failed to refer lead',
			error: err.message
		});
	}
});

router.post('/refer-leads', isCollege, async (req, res) => {
	try {
		const { leadIds, counselorId } = req.body;

		if (!counselorId || !isValidId(counselorId)) {
			return res.status(400).json({ status: false, message: 'Valid counselorId is required' });
		}

		if (!Array.isArray(leadIds) || leadIds.length === 0) {
			return res.status(400).json({ status: false, message: 'leadIds must be a non-empty array' });
		}

		const user = req.user;

		const validLeadIds = leadIds.filter((id) => isValidId(id));
		if (validLeadIds.length === 0) {
			return res.status(400).json({ status: false, message: 'leadIds must contain valid lead IDs' });
		}

		const newUser = await User.findById(counselorId).select('name').lean();
		if (!newUser) {
			return res.status(404).json({ status: false, message: 'Counselor not found' });
		}
		const newName = newUser.name?.trim() || 'Unknown';

		const leads = await Lead.find({ _id: { $in: validLeadIds } }).select('leadOwner').lean();
		if (!leads || leads.length === 0) {
			return res.status(404).json({ status: false, message: 'No leads found' });
		}

		const oldOwnerIds = [...new Set(
			leads.map((lead) => lead.leadOwner).filter((id) => id && isValidId(id))
		)];
		const oldOwners = oldOwnerIds.length
			? await User.find({ _id: { $in: oldOwnerIds } }).select('name').lean()
			: [];
		const oldOwnerNameById = new Map(
			oldOwners.map((owner) => [String(owner._id), owner.name?.trim() || 'Unknown'])
		);

		// Build bulk operations
		const ops = [];
		const now = new Date();

		for (const lead of leads) {
			const oldOwnerId = lead.leadOwner;
			const oldName = oldOwnerId
				? (oldOwnerNameById.get(String(oldOwnerId)) || 'Unknown')
				: 'Unassigned';

			const update = {
				$set: {
					leadOwner: counselorId,
					updatedBy: user._id
				},
				$push: {
					logs: {
						user: user._id,
						action: `Lead referred from ${oldName} to ${newName}`,
						timestamp: now,
						remarks: ''
					}
				}
			};
			if (oldOwnerId) {
				update.$push.previousLeadOwners = oldOwnerId;
			}

			ops.push({
				updateOne: {
					filter: { _id: lead._id },
					update
				}
			});
		}

		const result = await Lead.bulkWrite(ops, { ordered: false });
		const matched = result?.matchedCount ?? 0;
		const modified = result?.modifiedCount ?? 0;

		return res.status(200).json({
			status: true,
			message: 'Leads referred successfully',
			data: {
				requested: leadIds.length,
				found: leads.length,
				matched,
				modified
			}
		});
	} catch (err) {
		console.error('Error bulk referring leads:', err);
		return res.status(500).json({
			status: false,
			message: 'Failed to refer leads',
			error: err.message
		});
	}
});

router.get('/followups-reminder-data', isCollege, async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		if (!startDate || !endDate) {
			return res.status(400).json({
				status: false,
				message: 'startDate and endDate are required',
			});
		}

		const isAdmin = () => req.user.permissions?.permission_type === 'Admin';

		let leadFilter = {};
		if (!isAdmin()) {
			const teamMembers = await getAllTeamMembers(req.user._id);
			if (!teamMembers || teamMembers.length === 0) {
				return res.json({ status: true, data: [] });
			}
			const or = teamMembers.flatMap((member) => [
				{ leadAddedBy: member },
				{ leadOwner: member },
			]);
			leadFilter = { $or: or };
		}

		const leads = await Lead.find(leadFilter).select('_id').lean();
		const leadIds = leads.map((l) => l._id);
		if (leadIds.length === 0) {
			return res.json({ status: true, data: [] });
		}

		const start = new Date(startDate);
		const end = new Date(endDate);

		const followups = await FollowUp.find({
			leadId: { $in: leadIds },
			status: 'Pending',
			scheduledDate: { $exists: true, $ne: null, $gte: start, $lte: end },
		})
			.populate('leadId', 'businessName concernPersonName')
			.lean();

		const data = followups.map((f) => ({
			id: f._id,
			sourceType: 'b2b_followup',
			start: f.scheduledDate,
			followupStatus: f.status,
			candidateName:
				f.leadId?.businessName ||
				f.leadId?.concernPersonName ||
				'B2B lead',
			title: f.description || 'B2B follow-up',
		}));

		return res.json({ status: true, data });
	} catch (error) {
		console.error('Error fetching B2B followups reminder data:', error);
		return res.status(500).json({
			status: false,
			message: 'Failed to fetch B2B follow-ups',
			error: error.message,
		});
	}
});

	return router;
}

module.exports = createB2BRouter();
module.exports.createB2BRouter = createB2BRouter;