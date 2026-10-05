const express = require("express");
const { ObjectId } = require("mongodb");
const uuid = require('uuid/v1');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require("path");
const { auth1, isAdmin, isCollege } = require("../../../helpers");
const { resolveB2cProjectIds } = require("../../../helpers/b2cAccess");
const moment = require("moment");
const { Courses, Batch, College, Country, Qualification, CourseSectors, AppliedCourses, Center, User, SessionPlan, BatchSessionAssignment } = require("../../models");
const { mapSessionToClient } = require('./sessionPlan');
const {
	TrainingTeamError,
	parseIdList,
	splitUsers,
	assertRoleMembers,
	assertCourseMembers,
	uniqueIds,
	toIdString,
} = require("../../../helpers/trainingTeam");
const Candidate = require("../../models/candidateProfile");
const candidateServices = require('../services/candidate')
const { candidateCashbackEventName } = require('../../db/constant');
const router = express.Router();
// router.use(isAdmin);

const multer = require('multer');
const {
	bucketName,
	authKey,
	msg91WelcomeTemplate,
} = require("../../../config");

const s3 = require("../../../helpers/objectStorage");
const allowedVideoExtensions = ['mp4', 'mkv', 'mov', 'avi', 'wmv'];
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const allowedDocumentExtensions = ['pdf', 'doc', 'docx']; // ✅ PDF aur DOC types allow karein

const allowedExtensions = [...allowedVideoExtensions, ...allowedImageExtensions, ...allowedDocumentExtensions];
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

const uploadFilesToS3 = async ({ files, folder, courseName, s3, bucketName, allowedExtensions }) => {
	if (!files) return [];

	const filesArray = Array.isArray(files) ? files : [files];
	const uploaded = [];

	const promises = filesArray.map((file) => {
		const ext = file.name.split('.').pop().trim().toLowerCase();
		// console.log('file name', file.name)
		// console.log('allowedExtensions', allowedExtensions)
		// console.log('folder', folder)
		if (!allowedExtensions.includes(ext)) {
			throw new Error(`Unsupported file format: ${ext}`);
		}
		const fileType = allowedImageExtensions.includes(ext)
			? 'image'
			: allowedVideoExtensions.includes(ext)
				? 'video'
				: allowedDocumentExtensions.includes(ext)
					? 'document'
					: null;
		const key = `upload/${folder}/${courseName}/${fileType}s/${uuid()}.${ext}`;

		const params = {
			Bucket: bucketName,
			Key: key,
			Body: file.data,
			ContentType: file.mimetype,
		};

		return s3.upload(params).promise().then((result) => {
			uploaded.push(result.Key);
		});
	});

	await Promise.all(promises);
	return uploaded;
};



router.route("/").get(async (req, res) => {

	try {
		
		const user = req.user
		if(!user){
			console.log('user not found')
			return res.json({
				status: false,
				message: "You are not authorized to access this page"
			})
		}

		const college = await College.findOne({
			'_concernPerson._id': user._id
		});
		if(!college){
			console.log('college not found')
			return res.json({
				status: false,
				message: "College not found"
			})
		}


		const batchQuery = {
			status:'active',
			college:college._id
		};
		const linked = await resolveB2cProjectIds(user);
		if (linked.scoped) {
			if (!linked.projectObjectIds.length) {
				return res.json({
					batches: []
				});
			}
			const allowedCourses = await Courses.find({
				project: { $in: linked.projectObjectIds },
				college: college._id
			}).select('_id').lean();
			batchQuery.courseId = { $in: allowedCourses.map((c) => c._id) };
		}

		const batches = await Batch.find(batchQuery);

		if(!batches){
			console.log('batches not found')
			return res.json({
				status: false,
				message: "Batches not found"
			})
		}



		return res.json({

			batches
		});

	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});


const TRAINING_USER_SELECT = 'name email isDeleted permissions.custom_permissions.can_be_senior_trainer permissions.custom_permissions.can_be_trainer';

const findCollegeBatch = async (req, batchId) => {
	if (!req.college?._id) {
		throw new TrainingTeamError('College not found', 403);
	}
	if (!mongoose.Types.ObjectId.isValid(batchId)) {
		throw new TrainingTeamError('Invalid batch id');
	}
	const batch = await Batch.findOne({
		_id: batchId,
		college: req.college._id,
	});
	if (!batch) {
		throw new TrainingTeamError('Batch not found', 404);
	}
	return batch;
};

const loadCourseTeam = async (courseId) => {
	if (!courseId || !mongoose.Types.ObjectId.isValid(String(courseId))) {
		throw new TrainingTeamError('Course not found', 404);
	}
	const course = await Courses.findById(courseId)
		.select('name trainers')
		.populate({ path: 'trainers', select: TRAINING_USER_SELECT });
	if (!course) {
		throw new TrainingTeamError('Course not found', 404);
	}
	return course;
};

const assignCourseToSeniorTrainer = async (batch, seniorTrainerIds, usersById) => {
	if (!seniorTrainerIds.length || !batch?.courseId) {
		return { count: 0, seniorTrainerName: '' };
	}

	const seniorId = seniorTrainerIds[0];
	const senior = usersById.get(seniorId);
	const seniorName = senior?.name || senior?.email || '';
	const sessions = await SessionPlan.find({
		course: batch.courseId,
		college: batch.college,
		isDeleted: false,
	});

	const now = new Date();
	for (const session of sessions) {
		const status = session.workflowStatus || 'Scheduled';
		const alreadyWithTrainer = status === 'Assigned' || status === 'In Progress' || status === 'Completed';
		session.seniorTrainer = seniorId;
		session.seniorTrainerName = seniorName;
		if (!session.referredAt) session.referredAt = now;
		if (!alreadyWithTrainer) {
			session.workflowStatus = 'Sent to Senior Trainer';
			session.batch = batch._id;
			session.batchCode = batch.name || '';
		}
		await session.save();

		await BatchSessionAssignment.findOneAndUpdate(
			{ batch: batch._id, session: session._id },
			{
				$set: { seniorTrainer: seniorId },
				$setOnInsert: {
					course: batch.courseId,
					batch: batch._id,
					session: session._id,
				},
			},
			{ upsert: true, setDefaultsOnInsert: true }
		);
	}

	return { count: sessions.length, seniorTrainerName: seniorName };
};

const sendTeamError = (res, err, label) => {
	const statusCode = err.statusCode || 500;
	if (statusCode === 500) console.error(label, err);
	return res.status(statusCode).json({
		success: false,
		status: false,
		message: err.message || 'Could not update the training team',
	});
};

router.get('/:batchId/available-training-team', async (req, res) => {
	try {
		const batch = await findCollegeBatch(req, req.params.batchId);
		const course = await loadCourseTeam(batch.courseId);
		const selectedIds = (batch.trainers || []).map((id) => toIdString(id));
		const { seniorTrainers, trainers } = splitUsers(course.trainers || [], selectedIds);

		return res.json({
			success: true,
			status: true,
			batch: {
				_id: batch._id,
				name: batch.name,
				courseId: batch.courseId,
			},
			course: {
				_id: course._id,
				name: course.name || '',
			},
			seniorTrainers,
			trainers,
		});
	} catch (err) {
		return sendTeamError(res, err, 'GET /college/batches/:batchId/available-training-team');
	}
});

router.get('/:batchId/training-team', async (req, res) => {
	try {
		const batch = await findCollegeBatch(req, req.params.batchId);
		await batch.populate({ path: 'trainers', select: TRAINING_USER_SELECT });
		const { seniorTrainers, trainers } = splitUsers(batch.trainers || []);

		return res.json({
			success: true,
			status: true,
			batch: {
				_id: batch._id,
				name: batch.name,
				courseId: batch.courseId,
			},
			seniorTrainers,
			trainers,
		});
	} catch (err) {
		return sendTeamError(res, err, 'GET /college/batches/:batchId/training-team');
	}
});

router.put('/:batchId/training-team', async (req, res) => {
	try {
		const batch = await findCollegeBatch(req, req.params.batchId);
		const course = await loadCourseTeam(batch.courseId);
		const seniorTrainerIds = parseIdList(req.body?.seniorTrainerIds, 'seniorTrainerIds');
		const trainerIds = parseIdList(req.body?.trainerIds, 'trainerIds');
		const combinedIds = uniqueIds(seniorTrainerIds, trainerIds);
		const courseTrainerIds = (course.trainers || []).map((user) => toIdString(user));

		assertCourseMembers(courseTrainerIds, combinedIds);

		const users = combinedIds.length
			? await User.find({ _id: { $in: combinedIds } }).select(TRAINING_USER_SELECT).lean()
			: [];
		const usersById = new Map(users.map((user) => [String(user._id), user]));
		assertRoleMembers(usersById, seniorTrainerIds, trainerIds);

		batch.trainers = combinedIds;
		await batch.save();

		const courseAssignment = await assignCourseToSeniorTrainer(batch, seniorTrainerIds, usersById);

		const savedUsers = combinedIds.map((id) => usersById.get(id)).filter(Boolean);
		const { seniorTrainers, trainers } = splitUsers(savedUsers);

		return res.json({
			success: true,
			status: true,
			message: 'Batch training team updated',
			batch: {
				_id: batch._id,
				name: batch.name,
				courseId: batch.courseId,
			},
			trainerIds: combinedIds,
			seniorTrainers,
			trainers,
			assignedSessionCount: courseAssignment.count,
			seniorTrainerName: courseAssignment.seniorTrainerName,
		});
	} catch (err) {
		return sendTeamError(res, err, 'PUT /college/batches/:batchId/training-team');
	}
});

router.get('/my-sessions', async (req, res) => {
	try {
		if (!req.college?._id || !req.user?._id) {
			throw new TrainingTeamError('College not found', 403);
		}

		const assignments = await BatchSessionAssignment.find({
			$or: [
				{ trainer: req.user._id },
				{ seniorTrainer: req.user._id },
			],
		})
			.populate({
				path: 'session',
				match: { isDeleted: false, college: req.college._id },
			})
			.populate('batch', 'name')
			.lean();

		const data = assignments
			.filter((assignment) => assignment.session)
			.map((assignment) => {
				const session = mapSessionToClient(assignment.session);
				return {
					...session,
					assignmentId: String(assignment._id),
					batch: assignment.batch?._id ? String(assignment.batch._id) : session.batch,
					batchCode: assignment.batch?.name || session.batchCode || '',
					seniorTrainerId: assignment.seniorTrainer ? String(assignment.seniorTrainer) : session.seniorTrainerId,
					fieldTrainerId: assignment.trainer ? String(assignment.trainer) : session.fieldTrainerId,
				};
			});

		return res.json({
			success: true,
			status: true,
			data,
		});
	} catch (err) {
		return sendTeamError(res, err, 'GET /college/batches/my-sessions');
	}
});

router.post('/:batchId/session-assignments', async (req, res) => {
	try {
		const batch = await findCollegeBatch(req, req.params.batchId);
		const sessionIds = parseIdList(req.body?.sessionIds, 'sessionIds');
		if (!sessionIds.length) {
			throw new TrainingTeamError('Select a session');
		}

		const sessions = await SessionPlan.find({
			_id: { $in: sessionIds },
			college: req.college._id,
			isDeleted: false,
		}).select('_id course').lean();

		const sessionsById = new Map(sessions.map((session) => [String(session._id), session]));
		const courseId = toIdString(batch.courseId);
		sessionIds.forEach((id) => {
			const session = sessionsById.get(id);
			if (!session || toIdString(session.course) !== courseId) {
				throw new TrainingTeamError('Session does not belong to this batch\'s course');
			}
		});

		const trainerIds = parseIdList(
			req.body?.trainerId ? [req.body.trainerId] : [],
			'trainerId'
		);
		const seniorTrainerIds = parseIdList(
			req.body?.seniorTrainerId ? [req.body.seniorTrainerId] : [],
			'seniorTrainerId'
		);
		const trainerId = trainerIds[0] || '';
		const seniorTrainerId = seniorTrainerIds[0] || '';
		if (!trainerId && !seniorTrainerId) {
			throw new TrainingTeamError('Select a trainer');
		}

		const batchTrainerIds = new Set((batch.trainers || []).map((id) => toIdString(id)));
		[trainerId, seniorTrainerId].filter(Boolean).forEach((id) => {
			if (!batchTrainerIds.has(id)) {
				throw new TrainingTeamError('Trainer is not assigned to this batch');
			}
		});

		if (trainerId || seniorTrainerId) {
			const users = await User.find({
				_id: { $in: [trainerId, seniorTrainerId].filter(Boolean) },
			}).select('isDeleted permissions.custom_permissions.can_be_senior_trainer permissions.custom_permissions.can_be_trainer').lean();
			const usersById = new Map(users.map((user) => [String(user._id), user]));
			assertRoleMembers(usersById, seniorTrainerId ? [seniorTrainerId] : [], trainerId ? [trainerId] : []);
		}

		const assignments = [];
		for (const sessionId of sessionIds) {
			const setFields = {};
			if (trainerId) setFields.trainer = trainerId;
			if (seniorTrainerId) setFields.seniorTrainer = seniorTrainerId;
			const assignment = await BatchSessionAssignment.findOneAndUpdate(
				{ batch: batch._id, session: sessionId },
				{
					$set: setFields,
					$setOnInsert: {
						course: batch.courseId,
						batch: batch._id,
						session: sessionId,
					},
				},
				{ upsert: true, new: true, setDefaultsOnInsert: true }
			);
			assignments.push(assignment);
		}

		return res.json({
			success: true,
			status: true,
			message: 'Sessions saved for this batch',
			batch: {
				_id: batch._id,
				name: batch.name,
				courseId: batch.courseId,
			},
			assignments: assignments.map((assignment) => ({
				_id: assignment._id,
				course: assignment.course,
				batch: assignment.batch,
				session: assignment.session,
				seniorTrainer: assignment.seniorTrainer || null,
				trainer: assignment.trainer || null,
			})),
		});
	} catch (err) {
		return sendTeamError(res, err, 'POST /college/batches/:batchId/session-assignments');
	}
});

router.get('/:batchId/sessions', async (req, res) => {
	try {
		const batch = await findCollegeBatch(req, req.params.batchId);
		const course = await Courses.findById(batch.courseId).select('name').lean();
		if (!course) {
			throw new TrainingTeamError('Course not found', 404);
		}

		const permissions = req.user?.permissions?.custom_permissions || {};
		const isAdmin = req.user?.permissions?.permission_type === 'Admin';
		const isTrainingStaff = permissions.can_be_senior_trainer === true || permissions.can_be_trainer === true;
		if (!isAdmin && isTrainingStaff) {
			const assigned = (batch.trainers || []).some((id) => toIdString(id) === String(req.user._id));
			if (!assigned) {
				throw new TrainingTeamError('You are not assigned to this batch', 403);
			}
		}

		const sessions = await SessionPlan.find({
			course: batch.courseId,
			college: req.college._id,
			isDeleted: false,
		})
			.select('_id title sessionNumber workflowStatus')
			.sort({ sessionNumber: 1, createdAt: 1 })
			.lean();

		return res.json({
			success: true,
			status: true,
			batch: {
				_id: batch._id,
				name: batch.name,
			},
			course: {
				_id: course._id,
				name: course.name || '',
			},
			sessions: sessions.map((session) => ({
				_id: session._id,
				title: session.title || '',
				sessionNumber: session.sessionNumber || '',
				workflowStatus: session.workflowStatus || 'Scheduled',
			})),
		});
	} catch (err) {
		return sendTeamError(res, err, 'GET /college/batches/:batchId/sessions');
	}
});

module.exports = router;
