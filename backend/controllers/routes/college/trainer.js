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
	Skill, CollegeDocuments, CandidateProfile, SubQualification, Import, CoinsAlgo, AppliedJobs, HiringStatus, Company, Vertical, Project, Batch, Status, StatusB2b, Center, Courses, B2cFollowup, TrainerTimeTable ,AssignmentQuestions, TrainingSession, SessionFeedback, SessionAttendance  } = require("../../models");


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

		const sessionDoc = await TrainingSession.findOne({
			_id: sessionId,
			college: college._id,
		});

		if (!sessionDoc) {
			return res.status(404).json({ status: false, message: 'Session not found' });
		}

		const evidenceDoc = sessionDoc.evidenceDocs.id(docId);
		if (!evidenceDoc) {
			return res.status(404).json({ status: false, message: 'Document slot not found in this session' });
		}

		const ext = getFileExtension(file.name);
		const allowedForType = getAllowedExtensionsForDocType(evidenceDoc.type);
		if (!allowedForType.includes(ext)) {
			return res.status(400).json({
				status: false,
				message: `Invalid file for ${evidenceDoc.type}. Allowed: ${allowedForType.join(', ')}`,
			});
		}

		const fileKey = await uploadSessionFileToStorage(file, sessionId, docId);
		const detectedType = inferEvidenceTypeFromFile(file.name, file.mimetype);

		evidenceDoc.status = 'Uploaded';
		evidenceDoc.fileName = file.name;
		evidenceDoc.fileUrl = fileKey;
		evidenceDoc.type = detectedType;

		await sessionDoc.save();

		const populatedSession = await TrainingSession.findById(sessionDoc._id)
			.populate('trainer', 'name email mobile')
			.populate('batch', 'name')
			.lean();

		if (populatedSession?.evidenceDocs?.length) {
			populatedSession.evidenceDocs = populatedSession.evidenceDocs.map((doc) => ({
				...doc,
				fileUrl: doc.fileUrl ? resolvePublicUrl(doc.fileUrl) : '',
			}));
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
				return res.status(403).json({
					success: false,
					message: 'You are not assigned to this batch',
				});
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
			res.status(403).json({
				status: false,
				message: 'You are not assigned to this batch',
			});
			return null;
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

		const sessionDoc = await TrainingSession.findById(sessionId);
		if (!sessionDoc) {
			return res.status(404).json({ status: false, message: 'Session not found' });
		}

		const batchDoc = await assertBatchTrainingAccess(req, res, sessionDoc.batch);
		if (!batchDoc) return;

		if (String(sessionDoc.college) !== String(req.college._id)) {
			return res.status(403).json({
				status: false,
				message: 'You do not have permission to update this session',
			});
		}

		const attendanceDate = normalizeAttendanceDate(sessionDoc.sessionDate);
		const allowedStatuses = ['Present', 'Absent', 'Not Marked'];
		const appliedCourseIds = rows.map((row) => String(row.appliedCourseId || row.id)).filter(Boolean);

		const enrollments = await AppliedCourses.find({
			_id: { $in: appliedCourseIds },
			batch: sessionDoc.batch,
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
							batch: sessionDoc.batch,
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

		sessionDoc.totalCandidates = total;
		sessionDoc.presentCandidates = present;
		sessionDoc.absentCandidates = absent;
		sessionDoc.attendancePercent = attendancePercent;
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
		const populatedSession = await TrainingSession.findById(sessionDoc._id)
			.populate('trainer', 'name email mobile')
			.populate('batch', 'name')
			.lean();

		return res.status(200).json({
			status: true,
			message: 'Attendance saved successfully',
			data: {
				session: populatedSession,
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


module.exports = router;
