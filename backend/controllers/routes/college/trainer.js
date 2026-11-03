const express = require('express');
const router = express.Router();
const uuid = require('uuid/v1');
const jwt = require('jsonwebtoken');
const { isCollege, isTrainer } = require('../../../helpers');
const { Parser } = require("json2csv");
const mongoose = require('mongoose');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const puppeteer = require("puppeteer");
const { ObjectId } = require('mongoose').Types.ObjectId;



const multer = require('multer');
const crypto = require("crypto");

const {
    bucketName,
    authKey,
    msg91WelcomeTemplate,
} = require("../../../config");

const s3 = require("../../../helpers/objectStorage");
const { resolvePublicUrl } = require("../../../helpers/s3Storage");
const allowedVideoExtensions = ['mp4', 'mkv', 'mov', 'avi', 'wmv', 'webm'];
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
const allowedPdfExtensions = ['pdf'];
const allowedDocumentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'ppt', 'pptx'];

const allowedExtensions = [...allowedVideoExtensions, ...allowedImageExtensions, ...allowedDocumentExtensions];
const { AppliedCourses, StatusLogs, User, College, State, University, City, Qualification, Industry, Vacancy, CandidateImport,
	Skill, CollegeDocuments, CandidateProfile, SubQualification, Import, CoinsAlgo, AppliedJobs, HiringStatus, Company, Vertical, Project, Batch, Status, StatusB2b, Center, Courses, B2cFollowup, TrainerTimeTable ,AssignmentQuestions, TrainingSession, SessionPlan, SessionFeedback, SessionAttendance, DailyTrainerReport, DailyReportSetting, BatchSessionAssignment } = require("../../models");


const destination = path.resolve(__dirname, '..', '..', '..', 'public', 'temp');
if (!fs.existsSync(destination)) fs.mkdirSync(destination);

const authorizeTrainingAccess = async (req, res, next) => {
	try {
		const token = req.header('x-auth');
		if (!token) {
			return res.status(401).json({ success: false, message: 'You are not authorized' });
		}

		const decoded = jwt.verify(token, process.env.MIPIE_JWT_SECRET);
		const user = await User.findById(decoded.id);
		if (!user || ![2, 4].includes(user.role)) {
			return res.status(401).json({ success: false, message: 'You are not authorized' });
		}

		let college = null;
		if (user.role === 2) {
			college = await College.findOne({ '_concernPerson._id': user._id });
		} else {
			college = await College.findOne({ trainers: user._id });
		}

		if (!college) {
			return res.status(403).json({ success: false, message: 'College not found' });
		}

		req.user = user;
		req.college = college;
		return next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: error.message || 'You are not authorized',
		});
	}
};

const storage = multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${basename}-${Date.now()}${ext}`);
    },
});

const upload = multer({ storage }).single('file');
const uploadTrainerFiles = multer({ 
    storage: multer.diskStorage({
        destination,
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const basename = path.basename(file.originalname, ext);
            cb(null, `${basename}-${Date.now()}${ext}`);
        },
    })
}).fields([
    { name: 'cv', maxCount: 1 },
    { name: 'passportSizePhoto', maxCount: 1 }
]);

router.post('/trinerValidation' ,isTrainer,  async(req, res)=>{


})


router.post('/addTrainer', isCollege, uploadTrainerFiles, async (req, res) => {
    try {
        const { name, email, mobile, designation, trainerBriefSummary } = req.body;
        
        if (!name || !email || !mobile) {
            return res.status(400).json({
                success: false,
                message: "All Fields are required"
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase(),
            role: 4,
            isDeleted: false
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const existingMobile = await User.findOne({
            mobile: parseInt(mobile),
            role: 4,
            isDeleted: false
        });

        if (existingMobile) {
            return res.status(400).json({
                success: false,
                message: 'User with this mobile number already exists'
            });
        }

        const currentUserId =  req.user ? req.user.id : null;

        // Helper function to upload file to S3
        const uploadFileToS3 = async (file, folder, allowedExtensions) => {
            const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
            
            if (!allowedExtensions.includes(ext)) {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                throw new Error(`File type not supported. Allowed: ${allowedExtensions.join(', ')}`);
            }

            const fileContent = fs.readFileSync(file.path);
            const key = `Trainers/${folder}/${currentUserId || 'trainers'}/${uuid()}-${file.originalname}`;
            
            const params = {
                Bucket: bucketName,
                Key: key,
                Body: fileContent,
                ContentType: file.mimetype,
            };

            const uploadResult = await s3.upload(params).promise();
            
            // Delete temp file after upload
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            
            return uploadResult.Key;
        };

        // Upload CV if provided
        let cvUrl = null;
        if (req.files && req.files.cv && req.files.cv[0]) {
            try {
                cvUrl = await uploadFileToS3(req.files.cv[0], 'CV', ['pdf', 'doc', 'docx']);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to upload CV file'
                });
            }
        }

        // Upload Passport Size Photo if provided
        let passportPhotoUrl = null;
        if (req.files && req.files.passportSizePhoto && req.files.passportSizePhoto[0]) {
            try {
                passportPhotoUrl = await uploadFileToS3(req.files.passportSizePhoto[0], 'PassportPhoto', ['jpg', 'jpeg', 'png']);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to upload passport photo'
                });
            }
        }

        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            mobile: parseInt(mobile),
            designation: designation || '',
            trainerBriefSummary: trainerBriefSummary || '',
            cv: cvUrl,
            passportSizePhoto: passportPhotoUrl,
            role: 4,
            status: true,
            password: 'Focalyt',
            isDeleted: false,
            userAddedby: currentUserId
        });
        
        const savedUser = await newUser.save()
        
       
        if (req.college && req.college._id) {
            // Get college details to check type
            const college = await College.findById(req.college._id);
            
            // Update college with new trainer
            const updateData = { $addToSet: { trainers: savedUser._id } };
            
            // If college type is "Private University" and no default trainer is set, set this trainer as default
            if (college && college.type === 'Private University' && !college.defaultTrainer) {
                updateData.$set = { defaultTrainer: savedUser._id };
            }
            
            await College.findByIdAndUpdate(
                req.college._id,
                updateData,
                { new: true }
            );
        }

        const userResponse ={
            id: savedUser._id,
            name: savedUser.name,
            email: savedUser.email,
            mobile: savedUser.mobile,
            designation: savedUser.designation,
            trainerBriefSummary: savedUser.trainerBriefSummary,
            cv: savedUser.cv,
            passportSizePhoto: savedUser.passportSizePhoto,
            role: savedUser.role,
            status: savedUser.status,
            created_at: savedUser.createdAt
        }

    //   console.log("newUser" , newUser)
        res.status(200).json({
            status: true,
            message: `User "${name}" added successfully`,
            data: userResponse
        });

        }
        catch (err) {
            console.log('====================>!err ', err.message)
            return res.send({ status: false, error: err.message });

        }
})
router.put('/update/:id', isCollege, uploadTrainerFiles, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, mobile, designation, trainerBriefSummary } = req.body;
        
        if (!name || !email || !mobile) {
            return res.status(400).json({
                success: false,
                message: "All Fields are required"
            });
        }

        
        const existingTrainer = await User.findOne({
            _id: id,
            role: 4,
            isDeleted: false
        });

        if (!existingTrainer) {
            return res.status(404).json({
                success: false,
                message: 'Trainer not found'
            });
        }

       
        const emailExists = await User.findOne({
            email: email.toLowerCase(),
            role: 4,
            isDeleted: false,
            _id: { $ne: id }
        });

        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists for another trainer'
            });
        }

        // Check if mobile is already taken by another trainer
        const mobileExists = await User.findOne({
            mobile: parseInt(mobile),
            role: 4,
            isDeleted: false,
            _id: { $ne: id }
        });

        if (mobileExists) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number already exists for another trainer'
            });
        }

        // Helper function to upload file to S3
        const uploadFileToS3 = async (file, folder, allowedExtensions) => {
            const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
            
            if (!allowedExtensions.includes(ext)) {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                throw new Error(`File type not supported. Allowed: ${allowedExtensions.join(', ')}`);
            }

            const fileContent = fs.readFileSync(file.path);
            const key = `Trainers/${folder}/${id}/${uuid()}-${file.originalname}`;
            
            const params = {
                Bucket: bucketName,
                Key: key,
                Body: fileContent,
                ContentType: file.mimetype,
            };

            const uploadResult = await s3.upload(params).promise();
            
            // Delete temp file after upload
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            
            return uploadResult.Key;
        };

        // Upload CV if provided
        let cvUrl = existingTrainer.cv; // Keep existing CV if no new file
        if (req.files && req.files.cv && req.files.cv[0]) {
            try {
                cvUrl = await uploadFileToS3(req.files.cv[0], 'CV', ['pdf', 'doc', 'docx']);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to upload CV file'
                });
            }
        }

        // Upload Passport Size Photo if provided
        let passportPhotoUrl = existingTrainer.passportSizePhoto; // Keep existing photo if no new file
        if (req.files && req.files.passportSizePhoto && req.files.passportSizePhoto[0]) {
            try {
                passportPhotoUrl = await uploadFileToS3(req.files.passportSizePhoto[0], 'PassportPhoto', ['jpg', 'jpeg', 'png']);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to upload passport photo'
                });
            }
        }

        // Update the trainer
        const updateData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            mobile: parseInt(mobile),
            designation: designation || '',
            trainerBriefSummary: trainerBriefSummary || '',
            updatedAt: new Date()
        };

        // Only update CV if new file was uploaded
        if (cvUrl !== existingTrainer.cv) {
            updateData.cv = cvUrl;
        }

        // Only update passport photo if new file was uploaded
        if (passportPhotoUrl !== existingTrainer.passportSizePhoto) {
            updateData.passportSizePhoto = passportPhotoUrl;
        }

        const updatedTrainer = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        const userResponse = {
            id: updatedTrainer._id,
            name: updatedTrainer.name,
            email: updatedTrainer.email,
            mobile: updatedTrainer.mobile,
            designation: updatedTrainer.designation,
            trainerBriefSummary: updatedTrainer.trainerBriefSummary,
            cv: updatedTrainer.cv,
            passportSizePhoto: updatedTrainer.passportSizePhoto,
            role: updatedTrainer.role,
            status: updatedTrainer.status,
            updated_at: updatedTrainer.updatedAt
        };

        res.status(200).json({
            status: true,
            message: `Trainer "${name}" updated successfully`,
            data: userResponse
        });

    } catch (err) {
        console.log('Error in PUT /update:', err.message);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: err.message
        });
    }
});

router.get('/trainers', isCollege ,async (req, res) => {
    try {
        const user = req.user;
        const { all } = req.query;
        
        const query = { role: 4 };
        if (all !== 'true') {
            query.status = true;
        }
       
        const trainers = await User.find(query)
        
        res.status(200).json({
            status: true,
            message: "Trainers retrieved successfully",
            data: trainers,
            count: trainers.length
        });
        
    } catch (err) {
        console.log('Error in GET /trainers:', err.message);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: err.message
        });
    }
})

router.put('/toggle-status/:id', isCollege, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Changed from isDeleted to status
        const trainer = await User.findOne({
            _id: id,
            role: 4
        });

        if (!trainer) {
            return res.status(404).json({
                status: false,
                message: 'Trainer not found'
            });
        }

        trainer.status = status !== undefined ? status : !trainer.status; // Toggle if status not provided
        trainer.updatedAt = new Date();
        await trainer.save();

        res.status(200).json({
            status: true,
            message: `Trainer status updated to ${trainer.status ? 'Active' : 'Inactive'}`,
            data: {
                id: trainer._id,
                name: trainer.name,
                email: trainer.email,
                status: trainer.status
            }
        });

    } catch (err) {
        console.log('Error in PUT /toggle-status:', err.message);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: err.message
        });
    }
})

router.route("/mark-attendance").post(isTrainer, async (req, res) => {
	try {
		const user = req.user;
		const { 
			appliedCourseId, 
			date, 
			status, 
			period = 'regularPeriod', 
			remarks = '' 
		} = req.body;

		console.log("req.body", req.body);

		if (!appliedCourseId || !date || !status) {
			return res.status(400).json({
				status: false,
				message: "appliedCourseId, date, and status are required"
			});
		}

		if (!['Present', 'Absent'].includes(status)) {
			return res.status(400).json({
				status: false,
				message: "Status must be 'Present' or 'Absent'"
			});
		}

		if (!['zeroPeriod', 'regularPeriod'].includes(period)) {
			return res.status(400).json({
				status: false,
				message: "Period must be 'zeroPeriod' or 'regularPeriod'"
			});
		}

		const appliedCourse = await AppliedCourses.findById(appliedCourseId)
			.populate('_course')
			.populate('batch');

		if (!appliedCourse) {
			return res.status(404).json({
				status: false,
				message: "Applied course not found"
			});
		}

		const college = await College.findOne({
			'trainers': user._id 
		});

		if (!college) {
			return res.status(403).json({
				status: false,
				message: "College not found"
			});
		}

		if (String(appliedCourse._course.college) !== String(college._id)) {
			return res.status(403).json({
				status: false,
				message: "You don't have permission to mark attendance for this course"
			});
		}

		await appliedCourse.markAttendance(date, status, period, user._id, remarks);

		const updatedCourse = await AppliedCourses.findById(appliedCourseId)
			.populate('_course')
			.populate('batch');

		res.status(200).json({
			status: true,
			message: "Attendance marked successfully",
			data: {
				appliedCourseId,
				date,
				status,
				period,
				markedBy: user._id,
				attendance: updatedCourse.attendance
			}
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			status: false,
			message: err.message || "Server Error"
		});
	}
});


router.post('/questionBank', isTrainer, async (req, res) => {
    try {
        const user = req.user;
        const { question, options, correctIndex, marks, shuffleOptions, providedTotalMarks, courseId, centers } = req.body;

        // console.log("req.body", req.body);
        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ status: false, message: 'Question text is required' });
        }

        if (!Array.isArray(options) || options.length !== 4 || options.some(o => !o || typeof o !== 'string' || !o.trim())) {
            return res.status(400).json({ status: false, message: 'Options must be an array of 4 non-empty strings' });
        }

        if (typeof correctIndex !== 'number' || correctIndex < 0 || correctIndex > 3) {
            return res.status(400).json({ status: false, message: 'correctIndex must be a number between 0 and 3' });
        }

        const parsedMarks = Number(marks);
        if (isNaN(parsedMarks) || parsedMarks <= 0) {
            return res.status(400).json({ status: false, message: 'marks must be a positive number' });
        }


        const snap = {
            question: question.trim(),
            options: options.map(o => o.trim()),
            correctIndex,
            correctAnswer: options[correctIndex].trim(),
            marks: parsedMarks,
            shuffleOptions: !!shuffleOptions,
        };

        if (courseId) {
            snap.course = courseId;
        }
        if (centers) {
            snap.centers = Array.isArray(centers) ? centers : [centers];
        }

        let bank = await AssignmentQuestions.findOne({ owner: user._id, title: 'Question Bank' });

        if (bank) {
            const allocated = (bank.questions || []).reduce((s, q) => s + (Number(q.marks) || 0), 0) + snap.marks;
            if (allocated > bank.totalMarks) {
                return res.status(400).json({ status: false, message: `Allocated ${allocated} > totalMarks ${bank.totalMarks}` });
            }

            bank.questions.push(snap);
            await bank.save();
            return res.status(200).json({ status: true, message: 'Question added to bank', data: bank });
        }

        const bankTotal = providedTotalMarks !== undefined ? providedTotalMarks : Math.max(1, parsedMarks);

        const newBank = new AssignmentQuestions({
            title: 'Question Bank',
            durationMins: 30,
            passPercent: 33,
            totalMarks: bankTotal,
            questions: [snap],
            owner: user._id,
            isPublished: false
        });

        await newBank.save();
        return res.status(200).json({ status: true, message: 'Question bank created and question added', data: newBank });
    } catch (err) {
        console.log('====================>!err ', err.message);
        return res.status(500).send({ status: false, error: err.message });
    }

});
router.get('/list-projects', async (req, res) => {
	try {
		let filter = {};
		let vertical = req.query.vertical;
		if (vertical && typeof vertical !== 'string') { 
			vertical = new mongoose.Types.ObjectId(vertical); 
		}
		if (vertical) {
			filter.vertical = vertical;
		}

		const projects = await Project.find(filter).sort({ createdAt: -1 });
		res.json({ success: true, data: projects });
	} catch (error) {
		console.error('Error fetching projects:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});


router.post('/addSession', isCollege, async (req, res) => {
	try {
		const user = req.user;
		const college = req.college;

		if (!college?._id) {
			return res.status(403).json({
				status: false,
				message: 'College not found',
			});
		}

		const {
			batch,
			course,
			center,
			title,
			topicCovered,
			trainingMethod,
			sessionDate,
			startTime,
			endTime,
			notes,
			evidenceDocs,
			totalCandidates,
		} = req.body;

		if (!batch || !title?.trim() || !sessionDate) {
			return res.status(400).json({
				status: false,
				message: 'batch, title, and sessionDate are required',
			});
		}

		const batchDoc = await Batch.findById(batch);
		if (!batchDoc) {
			return res.status(404).json({
				status: false,
				message: 'Batch not found',
			});
		}

		if (String(batchDoc.college) !== String(college._id)) {
			return res.status(403).json({
				status: false,
				message: 'You do not have permission to add sessions for this batch',
			});
		}

		const allowedDocTypes = ['Document', 'Image', 'Video', 'PDF'];
		const normalizedEvidenceDocs = (Array.isArray(evidenceDocs) ? evidenceDocs : [])
			.filter((doc) => doc?.name?.trim())
			.map((doc) => ({
				name: doc.name.trim(),
				type: allowedDocTypes.includes(doc.type) ? doc.type : 'Document',
				status: 'Pending',
				fileName: '',
				fileUrl: '',
			}));

		const parsedSessionDate = new Date(sessionDate);
		if (Number.isNaN(parsedSessionDate.getTime())) {
			return res.status(400).json({
				status: false,
				message: 'Invalid sessionDate',
			});
		}

		const session = await TrainingSession.create({
			batch,
			college: college._id,
			course: course || batchDoc.courseId,
			center: center || batchDoc.centerId,
			title: title.trim(),
			topicCovered: topicCovered?.trim() || '',
			trainingMethod: trainingMethod?.trim() || '',
			sessionDate: parsedSessionDate,
			startTime: startTime || '',
			endTime: endTime || '',
			notes: notes?.trim() || '',
			evidenceDocs: normalizedEvidenceDocs,
			totalCandidates: Number(totalCandidates) || 0,
			trainer: user._id,
			createdBy: user._id,
		});

		const populatedSession = await TrainingSession.findById(session._id)
			.populate('trainer', 'name email mobile')
			.populate('batch', 'name')
			.lean();

		return res.status(201).json({
			status: true,
			message: 'Session added successfully',
			data: populatedSession,
		});
	} catch (error) {
		console.error('Error adding session:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Server error',
		});
	}
});

router.get('/sessions/:batchId', isCollege, async (req, res) => {
	try {
		const college = req.college;
		const { batchId } = req.params;

		if (!college?._id) {
			return res.status(403).json({ status: false, message: 'College not found' });
		}

		const batchDoc = await Batch.findById(batchId);
		if (!batchDoc) {
			return res.status(404).json({ status: false, message: 'Batch not found' });
		}

		if (String(batchDoc.college) !== String(college._id)) {
			return res.status(403).json({ status: false, message: 'You do not have permission to view sessions for this batch' });
		}

		const sessions = await TrainingSession.find({ batch: batchId, college: college._id })
			.populate('trainer', 'name email mobile')
			.populate('batch', 'name')
			.sort({ sessionDate: -1 })
			.lean();

		const data = sessions.map((session) => ({
			...session,
			evidenceDocs: (session.evidenceDocs || []).map((doc) => ({
				...doc,
				fileUrl: doc.fileUrl ? resolvePublicUrl(doc.fileUrl) : '',
			})),
		}));

		return res.status(200).json({
			status: true,
			message: 'Sessions fetched successfully',
			data,
		});
	} catch (error) {
		console.error('Error fetching sessions:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Server error',
		});
	}
});

const getFileExtension = (fileName = '') =>
	path.extname(fileName).toLowerCase().replace('.', '');

const inferEvidenceTypeFromFile = (fileName = '', mimeType = '') => {
	const ext = getFileExtension(fileName);
	const mime = (mimeType || '').toLowerCase();

	if (mime.startsWith('image/') || allowedImageExtensions.includes(ext)) return 'Image';
	if (mime.startsWith('video/') || allowedVideoExtensions.includes(ext)) return 'Video';
	if (mime === 'application/pdf' || allowedPdfExtensions.includes(ext)) return 'PDF';
	return 'Document';
};

const getAllowedExtensionsForDocType = (docType) => {
	switch (docType) {
		case 'Image': return allowedImageExtensions;
		case 'Video': return allowedVideoExtensions;
		case 'PDF': return allowedPdfExtensions;
		default: return allowedDocumentExtensions;
	}
};

const uploadSessionFileToStorage = async (file, sessionId, docId) => {
	const key = `TrainingSession/${sessionId}/${docId}/${uuid()}-${file.name}`;

	const params = {
		Bucket: bucketName,
		Key: key,
		Body: file.data,
		ContentType: file.mimetype,
	};

	const uploadResult = await s3.upload(params).promise();
	return uploadResult.Key || key;
};

const findEvidenceDoc = (docs, docId) => {
	if (!docs) return null;
	const id = String(docId || '');
	if (!id) return null;
	try {
		const bySubId = typeof docs.id === 'function' ? docs.id(id) : null;
		if (bySubId) return bySubId;
	} catch (_) { /* non-ObjectId doc keys fall through */ }
	return [...docs].find((doc) => String(doc._id) === id || String(doc.id) === id) || null;
};

const mapEvidenceDocsForClient = (docs = []) => docs.map((doc) => {
	const item = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
	return {
		...item,
		id: String(item._id || item.id || ''),
		_id: String(item._id || item.id || ''),
		fileUrl: item.fileUrl ? resolvePublicUrl(item.fileUrl) : '',
	};
});

router.post('/uploadSessionDocument', isCollege, async (req, res) => {
	try {
		const college = req.college;
		const sessionId = req.body?.sessionId || req.query?.sessionId;
		const docId = req.body?.docId || req.query?.docId;
		const file = req.files?.file;

		if (!college?._id) {
			return res.status(403).json({ status: false, message: 'College not found' });
		}

		if (!sessionId || !docId) {
			return res.status(400).json({ status: false, message: 'sessionId and docId are required' });
		}

		if (!file) {
			return res.status(400).json({ status: false, message: 'File is required' });
		}

		const sessionPlan = await SessionPlan.findOne({
			_id: sessionId,
			college: college._id,
			isDeleted: false,
		});

		const sessionDoc = sessionPlan || await TrainingSession.findOne({
			_id: sessionId,
			college: college._id,
		});

		if (!sessionDoc) {
			return res.status(404).json({ status: false, message: 'Session not found' });
		}

		const evidenceDoc = findEvidenceDoc(sessionDoc.evidenceDocs, docId);
		if (!evidenceDoc) {
			return res.status(404).json({ status: false, message: 'Document slot not found in this session' });
		}

		const ext = getFileExtension(file.name);
		const allowedForType = getAllowedExtensionsForDocType(evidenceDoc.type || 'Document');
		if (!allowedForType.includes(ext)) {
			return res.status(400).json({
				status: false,
				message: `Invalid file for ${evidenceDoc.type || 'Document'}. Allowed: ${allowedForType.join(', ')}`,
			});
		}

		const fileKey = await uploadSessionFileToStorage(file, sessionId, docId);
		const detectedType = inferEvidenceTypeFromFile(file.name, file.mimetype);

		evidenceDoc.status = 'Uploaded';
		evidenceDoc.fileName = file.name;
		evidenceDoc.fileUrl = fileKey;
		evidenceDoc.type = detectedType || evidenceDoc.type || 'Document';
		evidenceDoc.uploadedBy = req.user?._id || null;
		evidenceDoc.uploadedAt = new Date();

		await sessionDoc.save();

		if (sessionPlan) {
			return res.status(200).json({
				status: true,
				message: 'Document uploaded successfully',
				data: {
					...sessionPlan.toObject(),
					_id: sessionPlan._id,
					evidenceDocs: mapEvidenceDocsForClient(sessionPlan.evidenceDocs),
				},
			});
		}

		const populatedSession = await TrainingSession.findById(sessionDoc._id)
			.populate('trainer', 'name email mobile')
			.populate('batch', 'name')
			.lean();

		if (populatedSession?.evidenceDocs?.length) {
			populatedSession.evidenceDocs = mapEvidenceDocsForClient(populatedSession.evidenceDocs);
		}

		return res.status(200).json({
			status: true,
			message: 'Document uploaded successfully',
			data: populatedSession,
		});
	} catch (error) {
		console.error('Error uploading session document:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Server error',
		});
	}
});


const mapFeedbackForClient = (feedback) => ({
	id: String(feedback._id),
	studentName: feedback.studentName || 'Student',
	rating: feedback.rating,
	comment: feedback.comment || '',
	reviewedAt: feedback.updatedAt
		? new Date(feedback.updatedAt).toLocaleDateString('en-IN')
		: '',
	enrollmentId: String(feedback.appliedCourse),
});

router.get('/batch-students/:batchId', authorizeTrainingAccess, async (req, res) => {
	try {
		const college = req.college;
		const { batchId } = req.params;

		if (!college?._id) {
			return res.status(403).json({ success: false, message: 'College not found' });
		}

		const batchDoc = await Batch.findById(batchId);
		if (!batchDoc) {
			return res.status(404).json({ success: false, message: 'Batch not found' });
		}

		if (String(batchDoc.college) !== String(college._id)) {
			return res.status(403).json({
				success: false,
				message: 'You do not have permission to view students for this batch',
			});
		}

		if (req.user.role === 4) {
			const isTrainerAssigned = (batchDoc.trainers || []).some(
				(trainerId) => String(trainerId) === String(req.user._id)
			);
			if (!isTrainerAssigned) {
				const assignedPlan = await SessionPlan.exists({
					batch: batchId,
					fieldTrainer: req.user._id,
					isDeleted: false,
				});
				if (!assignedPlan) {
					return res.status(403).json({
						success: false,
						message: 'You are not assigned to this batch',
					});
				}
			}
		}

		const students = await AppliedCourses.find({
			batch: batchId,
			$or: [
				{ isBatchAssigned: true },
				{ admissionDone: true },
			],
		})
			.populate('_candidate', 'name mobile email personalInfo')
			.populate({
				path: '_course',
				select: 'name sectors projectName typeOfProject college docsRequired',
				populate: { path: 'sectors', select: 'name' },
			})
			.populate('_center', 'name')
			.populate('batch', 'name')
			.populate('_leadStatus', 'title name')
			.sort({ batchAssignedAt: -1, createdAt: -1 })
			.lean();

		const data = students.filter(
			(item) => item._course && String(item._course.college) === String(college._id)
		);

		return res.status(200).json({
			success: true,
			message: 'Batch students fetched successfully',
			count: data.length,
			data,
		});
	} catch (error) {
		console.error('Error fetching batch students:', error);
		return res.status(500).json({
			success: false,
			message: error.message || 'Server error',
		});
	}
});

const normalizeAttendanceDate = (dateValue) => {
	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) {
		throw new Error('Invalid attendance date');
	}
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const assertBatchTrainingAccess = async (req, res, batchId) => {
	const college = req.college;
	if (!college?._id) {
		res.status(403).json({ status: false, message: 'College not found' });
		return null;
	}

	const batchDoc = await Batch.findById(batchId);
	if (!batchDoc) {
		res.status(404).json({ status: false, message: 'Batch not found' });
		return null;
	}

	if (String(batchDoc.college) !== String(college._id)) {
		res.status(403).json({
			status: false,
			message: 'You do not have permission to access this batch',
		});
		return null;
	}

	if (req.user.role === 4) {
		const isTrainerAssigned = (batchDoc.trainers || []).some(
			(trainerId) => String(trainerId) === String(req.user._id)
		);
		if (!isTrainerAssigned) {
			const assignedPlan = await SessionPlan.exists({
				batch: batchId,
				fieldTrainer: req.user._id,
				isDeleted: false,
			});
			if (!assignedPlan) {
				res.status(403).json({
					status: false,
					message: 'You are not assigned to this batch',
				});
				return null;
			}
		}
	}

	return batchDoc;
};

const mapAttendanceRowForClient = (record) => {
	const appliedCourse = record.appliedCourse || {};
	const candidate = appliedCourse._candidate || record.candidate || {};

	return {
		id: String(appliedCourse._id || record.appliedCourse),
		appliedCourseId: String(appliedCourse._id || record.appliedCourse),
		candidateId: candidate._id ? String(candidate._id) : (record.candidate ? String(record.candidate) : ''),
		name: candidate.name || 'Unknown',
		mobile: candidate.mobile || '-',
		status: record.status || 'Not Marked',
		remarks: record.remarks || '',
	};
};

router.get('/session-attendance/batch/:batchId', authorizeTrainingAccess, async (req, res) => {
	try {
		const { batchId } = req.params;
		const batchDoc = await assertBatchTrainingAccess(req, res, batchId);
		if (!batchDoc) return;

		const records = await SessionAttendance.find({ batch: batchId })
			.populate({
				path: 'appliedCourse',
				select: '_candidate',
				populate: { path: '_candidate', select: 'name mobile' },
			})
			.populate('candidate', 'name mobile')
			.lean();

		const grouped = {};
		records.forEach((record) => {
			const sessionId = String(record.session);
			if (!grouped[sessionId]) grouped[sessionId] = [];
			grouped[sessionId].push(mapAttendanceRowForClient(record));
		});

		return res.status(200).json({
			status: true,
			message: 'Session attendance fetched successfully',
			data: grouped,
		});
	} catch (error) {
		console.error('Error fetching session attendance:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Server error',
		});
	}
});

router.post('/session-attendance/save', authorizeTrainingAccess, async (req, res) => {
	try {
		const user = req.user;
		const { sessionId, rows = [] } = req.body;

		if (!sessionId) {
			return res.status(400).json({
				status: false,
				message: 'sessionId is required',
			});
		}

		if (!Array.isArray(rows) || !rows.length) {
			return res.status(400).json({
				status: false,
				message: 'Attendance rows are required',
			});
		}

		let sessionKind = 'training';
		let sessionDoc = await TrainingSession.findById(sessionId);
		if (!sessionDoc) {
			sessionDoc = await SessionPlan.findOne({
				_id: sessionId,
				college: req.college._id,
				isDeleted: false,
			});
			sessionKind = sessionDoc ? 'plan' : '';
		}

		if (!sessionDoc) {
			return res.status(404).json({ status: false, message: 'Session not found' });
		}

		const batchId = sessionDoc.batch;
		if (!batchId) {
			return res.status(400).json({
				status: false,
				message: 'This session has no batch. Assign a batch before marking attendance.',
			});
		}

		const batchDoc = await assertBatchTrainingAccess(req, res, batchId);
		if (!batchDoc) return;

		if (String(sessionDoc.college) !== String(req.college._id)) {
			return res.status(403).json({
				status: false,
				message: 'You do not have permission to update this session',
			});
		}

		if (
			sessionKind === 'plan'
			&& user.role === 4
			&& sessionDoc.fieldTrainer
			&& String(sessionDoc.fieldTrainer) !== String(user._id)
		) {
			return res.status(403).json({
				status: false,
				message: 'This session is not assigned to you',
			});
		}

		const rawDate = sessionDoc.sessionDate || new Date();
		const attendanceDate = normalizeAttendanceDate(rawDate);
		const allowedStatuses = ['Present', 'Absent', 'Not Marked'];
		const appliedCourseIds = rows.map((row) => String(row.appliedCourseId || row.id)).filter(Boolean);

		const enrollments = await AppliedCourses.find({
			_id: { $in: appliedCourseIds },
			batch: batchId,
		})
			.populate('_candidate', 'name mobile')
			.lean();

		const enrollmentById = new Map(enrollments.map((item) => [String(item._id), item]));
		if (enrollmentById.size !== appliedCourseIds.length) {
			return res.status(400).json({
				status: false,
				message: 'One or more students do not belong to this batch',
			});
		}

		for (const row of rows) {
			const appliedCourseId = String(row.appliedCourseId || row.id);
			const status = allowedStatuses.includes(row.status) ? row.status : 'Not Marked';
			const enrollment = enrollmentById.get(appliedCourseId);

			if (status === 'Not Marked') {
				await SessionAttendance.deleteOne({
					session: sessionId,
					appliedCourse: appliedCourseId,
				});
				continue;
			}

			try {
				await SessionAttendance.findOneAndUpdate(
					{ session: sessionId, appliedCourse: appliedCourseId },
					{
						$set: {
							batch: batchId,
							candidate: enrollment._candidate?._id || enrollment._candidate,
							status,
							remarks: (row.remarks || '').trim(),
							attendanceDate,
							markedBy: user._id,
							markedByModel: 'User',
							markedByRole: 'trainer',
							markedAt: new Date(),
						},
					},
					{ upsert: true, new: true, runValidators: true }
				);
			} catch (saveError) {
				if (saveError?.code === 11000) {
					return res.status(409).json({
						status: false,
						message: 'This student already has attendance marked for another session on the same date',
					});
				}
				throw saveError;
			}
		}

		const present = rows.filter((row) => row.status === 'Present').length;
		const absent = rows.filter((row) => row.status === 'Absent').length;
		const total = rows.length;
		const attendancePercent = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;

		sessionDoc.presentCandidates = present;
		sessionDoc.absentCandidates = absent;
		sessionDoc.attendancePercent = attendancePercent;
		if (sessionKind === 'training') {
			sessionDoc.totalCandidates = total;
		} else {
			sessionDoc.studentCount = total;
		}
		await sessionDoc.save();

		const savedRecords = await SessionAttendance.find({ session: sessionId })
			.populate({
				path: 'appliedCourse',
				select: '_candidate',
				populate: { path: '_candidate', select: 'name mobile' },
			})
			.populate('candidate', 'name mobile')
			.lean();

		const mappedRows = savedRecords.map(mapAttendanceRowForClient);
		const sessionPayload = {
			_id: sessionDoc._id,
			id: String(sessionDoc._id),
			totalCandidates: total,
			presentCandidates: present,
			absentCandidates: absent,
			attendancePercent,
			studentCount: total,
		};

		return res.status(200).json({
			status: true,
			message: 'Attendance saved successfully',
			data: {
				session: sessionPayload,
				rows: mappedRows,
			},
		});
	} catch (error) {
		console.error('Error saving session attendance:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Server error',
		});
	}
});

router.post('/session-done', authorizeTrainingAccess, async (req, res) => {
	try {
		const user = req.user;
		const sessionId = String(req.body?.sessionId || '').trim();
		const remark = String(req.body?.remark || req.body?.completionRemark || '').trim();

		if (!sessionId) {
			return res.status(400).json({ status: false, message: 'sessionId is required' });
		}
		if (!remark) {
			return res.status(400).json({ status: false, message: 'Remark is required' });
		}

		let sessionKind = 'training';
		let sessionDoc = await TrainingSession.findById(sessionId);
		if (!sessionDoc) {
			sessionDoc = await SessionPlan.findOne({
				_id: sessionId,
				college: req.college._id,
				isDeleted: false,
			});
			sessionKind = sessionDoc ? 'plan' : '';
		}

		if (!sessionDoc) {
			return res.status(404).json({ status: false, message: 'Session not found' });
		}

		if (String(sessionDoc.college) !== String(req.college._id)) {
			return res.status(403).json({
				status: false,
				message: 'You do not have permission to update this session',
			});
		}

		if (sessionDoc.batch) {
			const batchDoc = await assertBatchTrainingAccess(req, res, sessionDoc.batch);
			if (!batchDoc) return;
		}

		if (
			sessionKind === 'plan'
			&& user.role === 4
			&& sessionDoc.fieldTrainer
			&& String(sessionDoc.fieldTrainer) !== String(user._id)
		) {
			return res.status(403).json({
				status: false,
				message: 'This session is not assigned to you',
			});
		}

		const markedCount = await SessionAttendance.countDocuments({
			session: sessionId,
			status: { $in: ['Present', 'Absent'] },
		});
		const present = Number(sessionDoc.presentCandidates) || 0;
		const absent = Number(sessionDoc.absentCandidates) || 0;
		if (!markedCount && present + absent <= 0) {
			return res.status(400).json({
				status: false,
				message: 'Save attendance before marking this session done',
			});
		}

		const completedAt = new Date();
		const completedByName = user.name || '';
		sessionDoc.completionRemark = remark;
		sessionDoc.completedAt = completedAt;
		sessionDoc.completedBy = user._id || null;
		sessionDoc.completedByName = completedByName;
		if (sessionKind === 'plan') {
			sessionDoc.workflowStatus = 'Completed';
		} else {
			sessionDoc.status = 'Completed';
		}
		await sessionDoc.save();

		return res.status(200).json({
			status: true,
			message: 'Session marked done',
			data: {
				id: String(sessionDoc._id),
				_id: sessionDoc._id,
				status: 'Completed',
				workflowStatus: sessionKind === 'plan' ? 'Completed' : (sessionDoc.workflowStatus || 'Completed'),
				completionRemark: remark,
				completedAt,
				completedByName,
			},
		});
	} catch (error) {
		console.error('Error marking session done:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Server error',
		});
	}
});

router.get('/session-feedback/batch/:batchId', isCollege, async (req, res) => {
	try {
		const college = req.college;
		const { batchId } = req.params;

		if (!college?._id) {
			return res.status(403).json({ status: false, message: 'College not found' });
		}

		const batchDoc = await Batch.findById(batchId);
		if (!batchDoc) {
			return res.status(404).json({ status: false, message: 'Batch not found' });
		}

		if (String(batchDoc.college) !== String(college._id)) {
			return res.status(403).json({ status: false, message: 'You do not have permission to view feedback for this batch' });
		}

		const feedbackList = await SessionFeedback.find({ batch: batchId })
			.sort({ updatedAt: -1 })
			.lean();

		const grouped = {};
		feedbackList.forEach((item) => {
			const sessionId = String(item.session);
			if (!grouped[sessionId]) grouped[sessionId] = [];
			grouped[sessionId].push(mapFeedbackForClient(item));
		});

		return res.status(200).json({
			status: true,
			message: 'Session feedback fetched successfully',
			data: grouped,
		});
	} catch (error) {
		console.error('Error fetching session feedback:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Server error',
		});
	}
});


const REPORT_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const REPORT_VIDEO_EXT = ['mp4', 'mkv', 'mov', 'avi', 'wmv', 'webm'];
const REPORT_DOC_EXT = [...REPORT_IMAGE_EXT, 'pdf', 'doc', 'docx'];
const REPORT_FILE_SLOTS = {
	manualAttendanceFiles: { label: 'Manual attendance', max: 5, maxBytes: 100 * 1024 * 1024, kind: 'document' },
	morningPhotos: { label: 'Morning photos', max: 5, maxBytes: 10 * 1024 * 1024, kind: 'image' },
	morningVideo: { label: 'Morning video', max: 1, maxBytes: 100 * 1024 * 1024, kind: 'video' },
	afternoonPhotos: { label: 'Afternoon photos', max: 5, maxBytes: 10 * 1024 * 1024, kind: 'image' },
	afternoonVideo: { label: 'Afternoon video', max: 1, maxBytes: 100 * 1024 * 1024, kind: 'video' },
	eveningPhotos: { label: 'Evening photos', max: 5, maxBytes: 10 * 1024 * 1024, kind: 'image' },
	eveningGroupPhoto: { label: 'Evening group photo', max: 1, maxBytes: 10 * 1024 * 1024, kind: 'image' },
	assessmentFiles: { label: 'Assessment files', max: 5, maxBytes: 10 * 1024 * 1024, kind: 'document' },
	activityProofs: { label: 'Activity proof', max: 10, maxBytes: 10 * 1024 * 1024, kind: 'image' },
};

const DTR_FIELDS = [
	{ key: 'trainerName', label: 'Trainer name', source: 'Logged-in trainer', group: 'portal', locked: true },
	{ key: 'reportDate', label: 'Report date', source: 'Date selected on the report', group: 'portal', locked: true },
	{ key: 'batch', label: 'Batch', source: 'Batches assigned to the trainer', group: 'portal', locked: true },
	{ key: 'project', label: 'Project', source: 'Project on the batch course', group: 'portal' },
	{ key: 'location', label: 'Location', source: 'Center of the batch', group: 'portal' },
	{ key: 'jobRole', label: 'Job role', source: 'Course name of the batch', group: 'portal' },
	{ key: 'inTime', label: 'In time', source: 'Session start time for that date', group: 'portal' },
	{ key: 'outTime', label: 'Out time', source: 'Session end time for that date', group: 'portal' },
	{ key: 'batchSize', label: 'Batch size', source: 'Students in the batch', group: 'portal' },
	{ key: 'totalPresent', label: 'Total present', source: 'Saved session attendance', group: 'portal' },
	{ key: 'totalAbsent', label: 'Total absent', source: 'Saved session attendance', group: 'portal' },
	{ key: 'topic', label: 'Topic', source: 'Topic covered on the session', group: 'portal' },
	{ key: 'softSkill', label: 'Soft skill topic', source: 'Activity type on the session', group: 'portal' },
	{ key: 'manualAttendance', label: 'Manual attendance', source: 'Trainer marks Yes or No and uploads the file', group: 'trainer' },
	{ key: 'morningPhotos', label: 'Morning theory photos', source: 'Trainer uploads the photos', group: 'trainer' },
	{ key: 'morningVideo', label: 'Morning theory video', source: 'Trainer uploads the video', group: 'trainer' },
	{ key: 'afternoonPhotos', label: 'Afternoon practical photos', source: 'Trainer uploads the photos', group: 'trainer' },
	{ key: 'afternoonVideo', label: 'Afternoon practical video', source: 'Trainer uploads the video', group: 'trainer' },
	{ key: 'eveningPhotos', label: 'Evening class photos', source: 'Trainer uploads the photos', group: 'trainer' },
	{ key: 'eveningGroupPhoto', label: 'Evening group photo', source: 'Trainer uploads the photo', group: 'trainer' },
	{ key: 'internalAssessment', label: 'Internal assessment', source: 'Trainer marks Yes or No and uploads the papers', group: 'trainer' },
	{ key: 'activityTopic', label: 'Activity topic', source: 'Trainer writes the activity', group: 'trainer' },
	{ key: 'activityProofs', label: 'Activity proof', source: 'Trainer uploads the photos', group: 'trainer' },
];

const DTR_SLOT_SETTING = {
	manualAttendanceFiles: 'manualAttendance',
	assessmentFiles: 'internalAssessment',
};

const defaultAttachedDtrFields = () => DTR_FIELDS.map((field) => field.key);

const mapDtrSettings = (doc) => {
	const saved = Array.isArray(doc?.attachedFields) ? doc.attachedFields : [];
	const known = new Set(DTR_FIELDS.map((field) => field.key));
	const attached = saved.filter((key) => known.has(key));
	DTR_FIELDS.filter((field) => field.locked).forEach((field) => {
		if (!attached.includes(field.key)) attached.push(field.key);
	});
	return {
		enabled: doc?.enabled !== false,
		attachedFields: attached.length ? attached : defaultAttachedDtrFields(),
		fields: DTR_FIELDS,
	};
};

const loadDtrSettings = async (collegeId) => {
	const doc = await DailyReportSetting.findOne({ college: collegeId }).lean();
	if (!doc) {
		return {
			enabled: true,
			attachedFields: defaultAttachedDtrFields(),
			fields: DTR_FIELDS,
		};
	}
	return mapDtrSettings(doc);
};

const reportHttpError = (status, message) => {
	const error = new Error(message);
	error.status = status;
	return error;
};

const asUploadArray = (value) => {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
};

const parseReportDateKey = (value) => {
	const text = String(value || '').trim();
	return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
};

const parseReportYesNo = (value, fieldName) => {
	const text = String(value || 'No').trim();
	if (text !== 'Yes' && text !== 'No') {
		throw reportHttpError(400, `${fieldName} must be Yes or No`);
	}
	return text;
};

const parseReportCount = (value, fieldName) => {
	if (value === '' || value == null) return 0;
	const num = Number(value);
	if (!Number.isInteger(num) || num < 0) {
		throw reportHttpError(400, `${fieldName} must be a whole number`);
	}
	return num;
};

const mapReportFile = (file) => {
	if (!file) return null;
	const item = typeof file.toObject === 'function' ? file.toObject() : { ...file };
	return {
		id: String(item._id || ''),
		fileName: item.fileName || '',
		fileUrl: item.fileUrl ? resolvePublicUrl(item.fileUrl) : '',
		fileSize: item.fileSize || 0,
		mimeType: item.mimeType || '',
	};
};

const mapDailyReport = (doc) => {
	const item = typeof doc.toObject === 'function' ? doc.toObject() : doc;
	const files = (key) => (item[key] || []).map(mapReportFile).filter((file) => file?.id);
	return {
		id: String(item._id),
		reportDate: item.reportDateKey || '',
		trainerId: item.trainer ? String(item.trainer) : '',
		trainerName: item.trainerName || '',
		projectName: item.projectName || '',
		location: item.centerName || '',
		jobRole: item.jobRole || '',
		courseName: item.courseName || item.jobRole || '',
		verticalName: item.verticalName || '',
		templateId: item.template ? String(item.template) : '',
		answers: (item.answers || []).map((answer) => ({
			key: answer.key || '',
			label: answer.label || '',
			type: answer.type || 'text',
			value: answer.value || '',
			files: (answer.files || []).map(mapReportFile).filter((file) => file?.id),
		})),
		batchId: item.batch ? String(item.batch) : '',
		batchCode: item.batchCode || '',
		inTime: item.inTime || '',
		outTime: item.outTime || '',
		batchSize: item.batchSize ?? 0,
		totalPresent: item.totalPresent ?? 0,
		totalAbsent: item.totalAbsent ?? 0,
		manualAttendanceUpdated: item.manualAttendanceUpdated || 'No',
		topic: item.topic || '',
		softSkillTopic: item.softSkillTopic || '',
		internalAssessment: item.internalAssessment || 'No',
		activityTopic: item.activityTopic || '',
		manualAttendanceFiles: files('manualAttendanceFiles'),
		morningPhotos: files('morningPhotos'),
		morningVideo: files('morningVideo'),
		afternoonPhotos: files('afternoonPhotos'),
		afternoonVideo: files('afternoonVideo'),
		eveningPhotos: files('eveningPhotos'),
		eveningGroupPhoto: files('eveningGroupPhoto'),
		assessmentFiles: files('assessmentFiles'),
		activityProofs: files('activityProofs'),
		createdAt: item.createdAt || null,
		updatedAt: item.updatedAt || null,
	};
};

const collectReportSlotFiles = (files, slot) => {
	const rule = REPORT_FILE_SLOTS[slot];
	const incoming = asUploadArray(files?.[slot]);
	if (incoming.length > rule.max) {
		throw reportHttpError(400, `${rule.label} allows up to ${rule.max} file(s)`);
	}
	const allowed = rule.kind === 'image'
		? REPORT_IMAGE_EXT
		: rule.kind === 'video'
			? REPORT_VIDEO_EXT
			: REPORT_DOC_EXT;
	incoming.forEach((file) => {
		const ext = getFileExtension(file.name);
		if (!allowed.includes(ext)) {
			throw reportHttpError(400, `${file.name || 'File'} is not an allowed ${rule.label} file`);
		}
		if ((file.size || 0) > rule.maxBytes) {
			const maxMb = Math.round(rule.maxBytes / (1024 * 1024));
			throw reportHttpError(400, `${file.name || 'File'} is larger than ${maxMb} MB`);
		}
	});
	return incoming;
};

const uploadDailyReportFile = async (file, collegeId) => {
	const ext = getFileExtension(file.name);
	const key = `DailyTrainerReport/${collegeId}/${uuid()}.${ext}`;
	await s3.upload({
		Bucket: bucketName,
		Key: key,
		Body: file.data,
		ContentType: file.mimetype,
	}).promise();
	return {
		fileName: file.name,
		fileUrl: key,
		fileSize: file.size || 0,
		mimeType: file.mimetype || '',
	};
};

const applyReportUploads = async (doc, files, removeIds = [], attachedFields = defaultAttachedDtrFields()) => {
	const attached = new Set(attachedFields);
	const removeSet = new Set((removeIds || []).map(String));
	for (const slot of Object.keys(REPORT_FILE_SLOTS)) {
		const settingKey = DTR_SLOT_SETTING[slot] || slot;
		if (!attached.has(settingKey)) continue;
		const incoming = collectReportSlotFiles(files, slot);
		const kept = (doc[slot] || []).filter((file) => !removeSet.has(String(file._id)));
		if (kept.length + incoming.length > REPORT_FILE_SLOTS[slot].max) {
			throw reportHttpError(400, `${REPORT_FILE_SLOTS[slot].label} allows up to ${REPORT_FILE_SLOTS[slot].max} file(s)`);
		}
		const uploaded = [];
		for (const file of incoming) {
			uploaded.push(await uploadDailyReportFile(file, doc.college));
		}
		doc[slot] = kept.concat(uploaded);
		doc.markModified(slot);
	}

	if (attached.has('manualAttendance') && doc.manualAttendanceUpdated === 'Yes' && doc.manualAttendanceFiles.length === 0) {
		throw reportHttpError(400, 'Upload the manual attendance file when attendance is marked Yes');
	}
	if (attached.has('internalAssessment') && doc.internalAssessment === 'Yes' && doc.assessmentFiles.length === 0) {
		throw reportHttpError(400, 'Upload the assessment file when internal assessment is Yes');
	}
};

const loadReportBatchContext = async (req, batchId) => {
	if (!mongoose.Types.ObjectId.isValid(batchId)) {
		throw reportHttpError(400, 'Select a batch');
	}

	const batchDoc = await Batch.findById(batchId);
	if (!batchDoc) {
		throw reportHttpError(404, 'Batch not found');
	}
	if (String(batchDoc.college) !== String(req.college._id)) {
		throw reportHttpError(403, 'You do not have permission for this batch');
	}

	if (req.user.role === 4) {
		const onBatch = (batchDoc.trainers || []).some(
			(trainerId) => String(trainerId) === String(req.user._id)
		);
		const onPlan = await SessionPlan.exists({
			batch: batchId,
			fieldTrainer: req.user._id,
			isDeleted: false,
		});
		const onAssignment = await BatchSessionAssignment.exists({
			batch: batchId,
			$or: [{ trainer: req.user._id }, { seniorTrainer: req.user._id }],
		});
		if (!onBatch && !onPlan && !onAssignment) {
			throw reportHttpError(403, 'You are not assigned to this batch');
		}
	}

	const [courseDoc, centerDoc] = await Promise.all([
		batchDoc.courseId ? Courses.findById(batchDoc.courseId).select('name projectName project') : null,
		batchDoc.centerId ? Center.findById(batchDoc.centerId).select('name') : null,
	]);

	return {
		batch: batchDoc._id,
		batchCode: batchDoc.name || '',
		course: courseDoc?._id || batchDoc.courseId || null,
		jobRole: courseDoc?.name || '',
		project: courseDoc?.project || null,
		projectName: courseDoc?.projectName || '',
		center: centerDoc?._id || batchDoc.centerId || null,
		centerName: centerDoc?.name || '',
	};
};

const readReportFields = (body, attachedFields = defaultAttachedDtrFields()) => {
	const attached = new Set(attachedFields);
	const reportDateKey = parseReportDateKey(body.reportDate);
	if (!reportDateKey) {
		throw reportHttpError(400, 'Report date is required');
	}
	const inTime = String(body.inTime || '').trim();
	const outTime = String(body.outTime || '').trim();
	if (attached.has('inTime') && !inTime) {
		throw reportHttpError(400, 'In time is required');
	}
	if (attached.has('outTime') && !outTime) {
		throw reportHttpError(400, 'Out time is required');
	}
	return {
		reportDateKey,
		reportDate: new Date(`${reportDateKey}T00:00:00.000Z`),
		inTime,
		outTime,
		batchSize: attached.has('batchSize') ? parseReportCount(body.batchSize, 'Batch size') : 0,
		totalPresent: attached.has('totalPresent') ? parseReportCount(body.totalPresent, 'Present') : 0,
		totalAbsent: attached.has('totalAbsent') ? parseReportCount(body.totalAbsent, 'Absent') : 0,
		manualAttendanceUpdated: attached.has('manualAttendance')
			? parseReportYesNo(body.manualAttendanceUpdated, 'Manual attendance')
			: 'No',
		topic: attached.has('topic') ? String(body.topic || '').trim() : '',
		softSkillTopic: attached.has('softSkill') ? String(body.softSkillTopic || '').trim() : '',
		internalAssessment: attached.has('internalAssessment')
			? parseReportYesNo(body.internalAssessment, 'Internal assessment')
			: 'No',
		activityTopic: attached.has('activityTopic') ? String(body.activityTopic || '').trim() : '',
	};
};

const readRemovedReportFileIds = (body) => {
	if (!body?.removeFileIds) return [];
	try {
		const parsed = JSON.parse(body.removeFileIds);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch (error) {
		return [];
	}
};

const DTR_FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'time', 'yesno', 'select', 'file'];
const DTR_PORTAL_KEYS = ['trainerName', 'project', 'location', 'jobRole', 'batch', 'inTime', 'outTime', 'batchSize', 'totalPresent', 'totalAbsent', 'topic', 'softSkill'];

const canSetDtr = (user) => user?.role === 2
	|| user?.permissions?.permission_type === 'Admin'
	|| user?.permissions?.custom_permissions?.can_be_academic_coordinator === true;

const mapTemplateField = (field) => ({
	key: field.key || '',
	label: field.label || '',
	type: field.type || 'text',
	required: field.required === true,
	placeholder: field.placeholder || '',
	options: Array.isArray(field.options) ? field.options.filter(Boolean) : [],
	portalKey: field.portalKey || '',
	fileKind: field.fileKind || 'image',
	maxFiles: Math.min(10, Math.max(1, Number(field.maxFiles) || 1)),
});

const mapTemplate = (doc) => ({
	id: String(doc._id),
	name: doc.name || 'Daily trainer report',
	enabled: doc.enabled !== false,
	departmentId: doc.vertical ? String(doc.vertical) : '',
	departmentName: doc.verticalName || '',
	projectId: doc.project ? String(doc.project) : '',
	projectName: doc.projectName || '',
	courseId: doc.course ? String(doc.course) : '',
	courseName: doc.courseName || '',
	batchIds: (doc.batches || []).map((id) => String(id)),
	batchNames: Array.isArray(doc.batchNames) ? doc.batchNames : [],
	trainerIds: (doc.trainers || []).map((id) => String(id)),
	trainerNames: Array.isArray(doc.trainerNames) ? doc.trainerNames : [],
	fields: (doc.fields || []).map(mapTemplateField),
});

const normalizeTemplateFields = (fields) => {
	if (!Array.isArray(fields) || !fields.length) {
		throw reportHttpError(400, 'Add at least one field');
	}
	const used = new Set();
	return fields.map((field, index) => {
		const label = String(field?.label || '').trim();
		if (!label) throw reportHttpError(400, 'Every field needs a label');
		const type = DTR_FIELD_TYPES.includes(field?.type) ? field.type : 'text';
		let key = String(field?.key || '').trim().replace(/[^\w-]/g, '');
		if (!key) key = `field_${index + 1}`;
		while (used.has(key)) key = `${key}_${index + 1}`;
		used.add(key);
		const options = type === 'select'
			? String(field?.optionsText || (Array.isArray(field?.options) ? field.options.join('\n') : ''))
				.split(/\n|,/)
				.map((item) => item.trim())
				.filter(Boolean)
			: [];
		if (type === 'select' && options.length < 2) {
			throw reportHttpError(400, `${label} needs at least two options`);
		}
		const portalKey = DTR_PORTAL_KEYS.includes(field?.portalKey) ? field.portalKey : '';
		return {
			key,
			label,
			type,
			required: field?.required === true,
			placeholder: String(field?.placeholder || '').trim(),
			options,
			portalKey,
			fileKind: ['image', 'video', 'document'].includes(field?.fileKind) ? field.fileKind : 'image',
			maxFiles: Math.min(10, Math.max(1, Number(field?.maxFiles) || 1)),
		};
	});
};

const loadTemplateScope = async (body) => {
	if (!mongoose.Types.ObjectId.isValid(body.courseId)) {
		throw reportHttpError(400, 'Select a course');
	}
	const courseDoc = await Courses.findById(body.courseId).select('name project projectName vertical');
	if (!courseDoc) throw reportHttpError(404, 'Course not found');
	let verticalName = '';
	let projectName = courseDoc.projectName || '';
	if (courseDoc.vertical) {
		const vertical = await Vertical.findById(courseDoc.vertical).select('name');
		verticalName = vertical?.name || '';
	}
	if (courseDoc.project) {
		const project = await Project.findById(courseDoc.project).select('name');
		projectName = project?.name || projectName;
	}
	return {
		vertical: body.departmentId && mongoose.Types.ObjectId.isValid(body.departmentId) ? body.departmentId : (courseDoc.vertical || null),
		verticalName: String(body.departmentName || verticalName || ''),
		project: body.projectId && mongoose.Types.ObjectId.isValid(body.projectId) ? body.projectId : (courseDoc.project || null),
		projectName: String(body.projectName || projectName || ''),
		course: courseDoc._id,
		courseName: courseDoc.name || '',
	};
};

const loadTemplateBatches = async (collegeId, courseId, batchIds) => {
	const ids = [...new Set((Array.isArray(batchIds) ? batchIds : []).map(String).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
	if (!ids.length) throw reportHttpError(400, 'Select at least one batch');
	const docs = await Batch.find({
		_id: { $in: ids },
		courseId,
		college: collegeId,
	}).select('name').lean();
	if (docs.length !== ids.length) throw reportHttpError(400, 'Select batches from this course');
	const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
	return {
		batches: ids.map((id) => byId.get(id)._id),
		batchNames: ids.map((id) => byId.get(id).name || 'Batch'),
	};
};

const templateIncludesBatch = (template, batchId) => {
	const ids = template?.batches || [];
	if (!ids.length) return true;
	return ids.some((id) => String(id) === String(batchId));
};

const loadTemplateTrainers = async (batchIds, trainerIds) => {
	const ids = [...new Set((Array.isArray(trainerIds) ? trainerIds : []).map(String).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
	if (!ids.length) throw reportHttpError(400, 'Select at least one trainer');
	const batches = await Batch.find({ _id: { $in: batchIds } }).select('trainers seniorTrainer').lean();
	const allowed = new Set();
	batches.forEach((batch) => {
		(batch.trainers || []).forEach((id) => allowed.add(String(id)));
		if (batch.seniorTrainer) allowed.add(String(batch.seniorTrainer));
	});
	if (ids.some((id) => !allowed.has(id))) {
		throw reportHttpError(400, 'Select trainers assigned to the chosen batches');
	}
	const users = await User.find({ _id: { $in: ids } }).select('name').lean();
	const nameById = new Map(users.map((user) => [String(user._id), user.name || 'Trainer']));
	return {
		trainers: ids,
		trainerNames: ids.map((id) => nameById.get(id) || 'Trainer'),
	};
};

const templateIncludesTrainer = (template, userId) => {
	const ids = template?.trainers || [];
	if (!ids.length) return true;
	return ids.some((id) => String(id) === String(userId));
};

const buildTemplateAnswers = async (template, body, files, collegeId, previousAnswers = []) => {
	let values = {};
	try {
		values = JSON.parse(body.answers || '{}');
	} catch (error) {
		values = {};
	}
	const previousByKey = new Map((previousAnswers || []).map((answer) => [answer.key, answer]));
	const answers = [];
	for (const field of template.fields || []) {
		if (field.type === 'file') {
			const incoming = asUploadArray(files?.[`file_${field.key}`]);
			const allowed = field.fileKind === 'video'
				? REPORT_VIDEO_EXT
				: field.fileKind === 'document'
					? REPORT_DOC_EXT
					: REPORT_IMAGE_EXT;
			const maxBytes = field.fileKind === 'video' || field.fileKind === 'document'
				? 100 * 1024 * 1024
				: 10 * 1024 * 1024;
			if (incoming.length > field.maxFiles) {
				throw reportHttpError(400, `${field.label} allows up to ${field.maxFiles} file(s)`);
			}
			incoming.forEach((file) => {
				const ext = getFileExtension(file.name);
				if (!allowed.includes(ext)) throw reportHttpError(400, `${file.name} is not allowed for ${field.label}`);
				if ((file.size || 0) > maxBytes) throw reportHttpError(400, `${file.name} is too large`);
			});
			const removed = new Set(readRemovedReportFileIds(body));
			const kept = (previousByKey.get(field.key)?.files || []).filter((file) => {
				const id = String(file?._id || file?.id || '');
				return id && !removed.has(id);
			});
			const uploaded = [];
			for (const file of incoming) {
				uploaded.push(await uploadDailyReportFile(file, collegeId));
			}
			const storedFiles = kept.concat(uploaded).slice(0, field.maxFiles);
			if (field.required && storedFiles.length === 0) {
				throw reportHttpError(400, `${field.label} is required`);
			}
			answers.push({ key: field.key, label: field.label, type: field.type, value: '', files: storedFiles });
			continue;
		}
		const value = String(values[field.key] ?? '').trim();
		if (field.required && !value) throw reportHttpError(400, `${field.label} is required`);
		if (field.type === 'yesno' && value && value !== 'Yes' && value !== 'No') {
			throw reportHttpError(400, `${field.label} must be Yes or No`);
		}
		if (field.type === 'number' && value && !Number.isInteger(Number(value))) {
			throw reportHttpError(400, `${field.label} must be a whole number`);
		}
		answers.push({ key: field.key, label: field.label, type: field.type, value, files: [] });
	}
	return answers;
};

const applyPortalSnapshot = (target, template, answers) => {
	const valueByKey = new Map((answers || []).map((answer) => [answer.key, answer.value || '']));
	const portal = {};
	(template.fields || []).forEach((field) => {
		if (field.portalKey) portal[field.portalKey] = valueByKey.get(field.key) || '';
	});
	if (portal.inTime) target.inTime = portal.inTime;
	if (portal.outTime) target.outTime = portal.outTime;
	if (portal.topic) target.topic = portal.topic;
	if (portal.softSkill) target.softSkillTopic = portal.softSkill;
	['batchSize', 'totalPresent', 'totalAbsent'].forEach((key) => {
		if (portal[key] === undefined || portal[key] === '') return;
		const num = Number(portal[key]);
		if (Number.isInteger(num) && num >= 0) target[key] = num;
	});
};

router.get('/daily-report-settings', authorizeTrainingAccess, async (req, res) => {
	try {
		const templates = await DailyReportSetting.find({ college: req.college._id, course: { $ne: null } })
			.sort({ updatedAt: -1 })
			.lean();
		return res.status(200).json({
			status: true,
			data: { templates: templates.map(mapTemplate) },
		});
	} catch (error) {
		console.error('Error fetching DTR settings:', error);
		return res.status(500).json({ status: false, message: error.message || 'Server error' });
	}
});

router.post('/daily-report-settings', authorizeTrainingAccess, async (req, res) => {
	try {
		if (!canSetDtr(req.user)) {
			return res.status(403).json({ status: false, message: 'Only an academic coordinator can change DTR settings' });
		}
		const scope = await loadTemplateScope(req.body || {});
		const batchScope = await loadTemplateBatches(req.college._id, scope.course, req.body?.batchIds);
		const trainerScope = await loadTemplateTrainers(batchScope.batches, req.body?.trainerIds);
		const fields = normalizeTemplateFields(req.body?.fields);
		const existing = await DailyReportSetting.findOne({ college: req.college._id, course: scope.course });
		if (existing) {
			return res.status(409).json({
				status: false,
				message: 'A DTR already exists for this course. Open it and add fields there.',
				data: mapTemplate(existing),
			});
		}
		const saved = await DailyReportSetting.create({
			college: req.college._id,
			name: String(req.body?.name || `${scope.courseName} DTR`).trim(),
			enabled: req.body?.enabled !== false,
			...scope,
			...batchScope,
			...trainerScope,
			fields,
		});
		return res.status(200).json({ status: true, message: 'DTR created', data: mapTemplate(saved) });
	} catch (error) {
		console.error('Error creating DTR:', error);
		return res.status(error.status || 500).json({ status: false, message: error.message || 'Server error' });
	}
});

router.put('/daily-report-settings/:id', authorizeTrainingAccess, async (req, res) => {
	try {
		if (!canSetDtr(req.user)) {
			return res.status(403).json({ status: false, message: 'Only an academic coordinator can change DTR settings' });
		}
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({ status: false, message: 'DTR not found' });
		}
		const template = await DailyReportSetting.findOne({ _id: req.params.id, college: req.college._id });
		if (!template) return res.status(404).json({ status: false, message: 'DTR not found' });
		const scope = await loadTemplateScope(req.body || {});
		const batchScope = await loadTemplateBatches(req.college._id, scope.course, req.body?.batchIds);
		const trainerScope = await loadTemplateTrainers(batchScope.batches, req.body?.trainerIds);
		const clash = await DailyReportSetting.findOne({
			_id: { $ne: template._id },
			college: req.college._id,
			course: scope.course,
		}).select('_id');
		if (clash) {
			return res.status(409).json({ status: false, message: 'A DTR already exists for this course' });
		}
		template.name = String(req.body?.name || template.name).trim();
		template.enabled = req.body?.enabled !== false;
		Object.assign(template, scope, batchScope, trainerScope);
		template.fields = normalizeTemplateFields(req.body?.fields);
		template.markModified('fields');
		template.markModified('batches');
		template.markModified('batchNames');
		template.markModified('trainers');
		template.markModified('trainerNames');
		await template.save();
		return res.status(200).json({ status: true, message: 'DTR saved', data: mapTemplate(template) });
	} catch (error) {
		console.error('Error updating DTR:', error);
		return res.status(error.status || 500).json({ status: false, message: error.message || 'Server error' });
	}
});

router.get('/daily-reports', authorizeTrainingAccess, async (req, res) => {
	try {
		const query = { college: req.college._id };
		if (req.user.role === 4) {
			query.trainer = req.user._id;
		} else if (req.query.trainerId && mongoose.Types.ObjectId.isValid(req.query.trainerId)) {
			query.trainer = req.query.trainerId;
		}
		if (parseReportDateKey(req.query.from) || parseReportDateKey(req.query.to)) {
			query.reportDateKey = {};
			if (parseReportDateKey(req.query.from)) query.reportDateKey.$gte = req.query.from;
			if (parseReportDateKey(req.query.to)) query.reportDateKey.$lte = req.query.to;
		}

		const reports = await DailyTrainerReport.find(query)
			.sort({ reportDateKey: -1, createdAt: -1 })
			.limit(200)
			.lean();

		return res.status(200).json({
			status: true,
			message: 'Daily trainer reports fetched',
			data: reports.map(mapDailyReport),
		});
	} catch (error) {
		console.error('Error fetching daily trainer reports:', error);
		return res.status(error.status || 500).json({
			status: false,
			message: error.message || 'Server error',
		});
	}
});

router.get('/daily-reports/:id', authorizeTrainingAccess, async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({ status: false, message: 'Report not found' });
		}
		const report = await DailyTrainerReport.findOne({
			_id: req.params.id,
			college: req.college._id,
		});
		if (!report) {
			return res.status(404).json({ status: false, message: 'Report not found' });
		}
		if (req.user.role === 4 && String(report.trainer) !== String(req.user._id)) {
			return res.status(403).json({ status: false, message: 'You cannot view this report' });
		}
		return res.status(200).json({
			status: true,
			data: mapDailyReport(report),
		});
	} catch (error) {
		console.error('Error fetching daily trainer report:', error);
		return res.status(error.status || 500).json({
			status: false,
			message: error.message || 'Server error',
		});
	}
});

router.post('/daily-reports', authorizeTrainingAccess, async (req, res) => {
	try {
		if (req.body?.templateId) {
			if (!mongoose.Types.ObjectId.isValid(req.body.templateId)) {
				return res.status(400).json({ status: false, message: 'Select a DTR for this course' });
			}
			const template = await DailyReportSetting.findOne({
				_id: req.body.templateId,
				college: req.college._id,
				enabled: true,
			});
			if (!template) {
				return res.status(404).json({ status: false, message: 'No DTR is set for this course' });
			}
			const reportDateKey = parseReportDateKey(req.body.reportDate);
			if (!reportDateKey) {
				return res.status(400).json({ status: false, message: 'Report date is required' });
			}
			const context = await loadReportBatchContext(req, req.body.batchId);
			if (String(context.course || '') !== String(template.course)) {
				return res.status(400).json({ status: false, message: 'This batch is not in the course for this DTR' });
			}
			if (!templateIncludesBatch(template, context.batch)) {
				return res.status(400).json({ status: false, message: 'This batch is not included in the DTR' });
			}
			if (!templateIncludesTrainer(template, req.user._id)) {
				return res.status(403).json({ status: false, message: 'This DTR is not assigned to you' });
			}
			const duplicate = await DailyTrainerReport.findOne({
				trainer: req.user._id,
				batch: context.batch,
				reportDateKey,
			}).select('_id');
			if (duplicate) {
				return res.status(409).json({
					status: false,
					message: 'A report already exists for this batch on this date',
					data: { id: String(duplicate._id) },
				});
			}
			const answers = await buildTemplateAnswers(template, req.body, req.files, req.college._id);
			const report = new DailyTrainerReport({
				college: req.college._id,
				trainer: req.user._id,
				trainerName: req.user.name || '',
				template: template._id,
				reportDateKey,
				reportDate: new Date(`${reportDateKey}T00:00:00.000Z`),
				courseName: template.courseName || context.jobRole,
				verticalName: template.verticalName || '',
				answers,
				...context,
				projectName: template.projectName || context.projectName,
			});
			applyPortalSnapshot(report, template, answers);
			await report.save();
			return res.status(200).json({
				status: true,
				message: 'Daily trainer report saved',
				data: mapDailyReport(report),
			});
		}

		const settings = await loadDtrSettings(req.college._id);
		if (!settings.enabled) {
			return res.status(403).json({ status: false, message: 'Daily trainer report is turned off in Settings' });
		}
		const fields = readReportFields(req.body || {}, settings.attachedFields);
		const context = await loadReportBatchContext(req, req.body?.batchId);
		const duplicate = await DailyTrainerReport.findOne({
			trainer: req.user._id,
			batch: context.batch,
			reportDateKey: fields.reportDateKey,
		}).select('_id');
		if (duplicate) {
			return res.status(409).json({
				status: false,
				message: 'A report already exists for this batch on this date',
				data: { id: String(duplicate._id) },
			});
		}

		const report = new DailyTrainerReport({
			college: req.college._id,
			trainer: req.user._id,
			trainerName: req.user.name || '',
			...fields,
			...context,
		});
		await applyReportUploads(report, req.files, readRemovedReportFileIds(req.body), settings.attachedFields);
		await report.save();

		return res.status(200).json({
			status: true,
			message: 'Daily trainer report saved',
			data: mapDailyReport(report),
		});
	} catch (error) {
		console.error('Error saving daily trainer report:', error);
		return res.status(error.status || 500).json({
			status: false,
			message: error.message || 'Server error',
		});
	}
});

router.put('/daily-reports/:id', authorizeTrainingAccess, async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({ status: false, message: 'Report not found' });
		}

		const report = await DailyTrainerReport.findOne({
			_id: req.params.id,
			college: req.college._id,
			trainer: req.user._id,
		});
		if (!report) {
			return res.status(404).json({ status: false, message: 'Report not found' });
		}

		if (req.body?.templateId && mongoose.Types.ObjectId.isValid(req.body.templateId)) {
			const template = await DailyReportSetting.findOne({
				_id: req.body.templateId,
				college: req.college._id,
				enabled: true,
			});
			if (!template) {
				return res.status(404).json({ status: false, message: 'No DTR is set for this course' });
			}
			const reportDateKey = parseReportDateKey(req.body.reportDate);
			if (!reportDateKey) {
				return res.status(400).json({ status: false, message: 'Report date is required' });
			}
			const context = await loadReportBatchContext(req, req.body.batchId);
			if (String(context.course || '') !== String(template.course)) {
				return res.status(400).json({ status: false, message: 'This batch is not in the course for this DTR' });
			}
			if (!templateIncludesBatch(template, context.batch)) {
				return res.status(400).json({ status: false, message: 'This batch is not included in the DTR' });
			}
			if (!templateIncludesTrainer(template, req.user._id)) {
				return res.status(403).json({ status: false, message: 'This DTR is not assigned to you' });
			}
			const duplicate = await DailyTrainerReport.findOne({
				_id: { $ne: report._id },
				trainer: req.user._id,
				batch: context.batch,
				reportDateKey,
			}).select('_id');
			if (duplicate) {
				return res.status(409).json({
					status: false,
					message: 'A report already exists for this batch on this date',
					data: { id: String(duplicate._id) },
				});
			}
			report.answers = await buildTemplateAnswers(template, req.body, req.files, req.college._id, report.answers);
			Object.assign(report, context, {
				template: template._id,
				reportDateKey,
				reportDate: new Date(`${reportDateKey}T00:00:00.000Z`),
				courseName: template.courseName || context.jobRole,
				verticalName: template.verticalName || '',
				projectName: template.projectName || context.projectName,
				trainerName: req.user.name || report.trainerName,
			});
			applyPortalSnapshot(report, template, report.answers);
			report.markModified('answers');
			await report.save();
			return res.status(200).json({
				status: true,
				message: 'Daily trainer report updated',
				data: mapDailyReport(report),
			});
		}

		const settings = await loadDtrSettings(req.college._id);
		if (!settings.enabled) {
			return res.status(403).json({ status: false, message: 'Daily trainer report is turned off in Settings' });
		}
		const fields = readReportFields(req.body || {}, settings.attachedFields);
		const context = await loadReportBatchContext(req, req.body?.batchId);
		const duplicate = await DailyTrainerReport.findOne({
			_id: { $ne: report._id },
			trainer: req.user._id,
			batch: context.batch,
			reportDateKey: fields.reportDateKey,
		}).select('_id');
		if (duplicate) {
			return res.status(409).json({
				status: false,
				message: 'A report already exists for this batch on this date',
				data: { id: String(duplicate._id) },
			});
		}

		Object.assign(report, fields, context, { trainerName: req.user.name || report.trainerName });
		await applyReportUploads(report, req.files, readRemovedReportFileIds(req.body), settings.attachedFields);
		await report.save();

		return res.status(200).json({
			status: true,
			message: 'Daily trainer report updated',
			data: mapDailyReport(report),
		});
	} catch (error) {
		console.error('Error updating daily trainer report:', error);
		return res.status(error.status || 500).json({
			status: false,
			message: error.message || 'Server error',
		});
	}
});

module.exports = router;
