const express = require("express");
const axios = require("axios");
const moment = require("moment");
let fs = require("fs");
let path = require("path");
const { isCollege, getAllTeamMembers } = require("../../../../helpers");
const fileupload = require("express-fileupload");
const readXlsxFile = require("read-excel-file/node");
const mongoose = require("mongoose");
// const csv = require("csv-parser");
const csv = require("fast-csv");
const uuid = require('uuid/v1');
const multer = require('multer');
const AWS = require('aws-sdk');
const {
	accessKeyId,

	secretAccessKey,
	region,
	bucketName,
	mimetypes,
} = require('../../../../config');


AWS.config.update({
	accessKeyId,
	secretAccessKey,
	region,
});

const s3 = new AWS.S3({ region, signatureVersion: 'v4' });

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
const LeadCategory = require("../../../models/b2b/leadCategory");
const Lead = require("../../../models/b2b/lead");
const FollowUp = require("../../../models/b2b/followUp");
const StatusB2b = require("../../../models/statusB2b");
const Candidate = require("../../../models/candidateProfile");

const { generatePassword, sendMail } = require("../../../../helpers");
const users = require("../../../models/users");

const router = express.Router();



// ==================== TYPE OF B2B ROUTES ====================

// Get all Type of B2B
router.get('/type-of-b2b', isCollege, async (req, res) => {
	try {

		const status = req.query.status;
		const query = {};
		if (status) {
			query.isActive = status;
		}
		const types = await TypeOfB2B.find(query)
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
		const { name, description } = req.body;

		// Validate required fields
		if (!name) {
			return res.status(400).json({
				status: false,
				message: 'Name is required'
			});
		}

		// Check if name already exists
		const existingType = await TypeOfB2B.findOne({ name });
		if (existingType) {
			return res.status(400).json({
				status: false,
				message: 'Type of B2B with this name already exists'
			});
		}

		const newType = new TypeOfB2B({
			name,
			description,
			addedBy: req.user._id
		});

		const savedType = await newType.save();
		await savedType.populate('addedBy', 'name email');

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
		const { name, description, isActive } = req.body;

		// Check if name already exists (excluding current record)
		if (name) {
			const existingType = await TypeOfB2B.findOne({
				name,
				_id: { $ne: req.params.id }
			});
			if (existingType) {
				return res.status(400).json({
					status: false,
					message: 'Type of B2B with this name already exists'
				});
			}
		}

		const updatedType = await TypeOfB2B.findByIdAndUpdate(
			req.params.id,
			{ name, description, isActive },
			{ new: true, runValidators: true }
		).populate('addedBy', 'name email');

		if (!updatedType) {
			return res.status(404).json({
				status: false,
				message: 'Type of B2B not found'
			});
		}

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

// Delete Type of B2B (soft delete)
router.delete('/type-of-b2b/:id', isCollege, async (req, res) => {
	try {
		const deletedType = await TypeOfB2B.findByIdAndUpdate(
			req.params.id,
			{ isActive: false },
			{ new: true }
		);

		if (!deletedType) {
			return res.status(404).json({
				status: false,
				message: 'Type of B2B not found'
			});
		}

		res.json({
			status: true,
			message: 'Type of B2B deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting type of B2B:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to delete type of B2B',
			error: error.message
		});
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
			.populate('addedBy', 'name email');

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
		const { name, description } = req.body;

		// Validate required fields
		if (!name) {
			return res.status(400).json({
				status: false,
				message: 'Name is required'
			});
		}

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
			addedBy: req.user._id
		});

		const savedCategory = await newCategory.save();
		await savedCategory.populate('addedBy', 'name email');

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
		const { name, description, isActive } = req.body;

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

		const updatedCategory = await LeadCategory.findByIdAndUpdate(
			req.params.id,
			{ name, description, isActive },
			{ new: true, runValidators: true }
		).populate('addedBy', 'name email');

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

// Delete Lead Category (soft delete)
router.delete('/lead-categories/:id', isCollege, async (req, res) => {
	try {
		const deletedCategory = await LeadCategory.findByIdAndUpdate(
			req.params.id,
			{ isActive: false },
			{ new: true }
		);

		if (!deletedCategory) {
			return res.status(404).json({
				status: false,
				message: 'Lead category not found'
			});
		}

		res.json({
			status: true,
			message: 'Lead category deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting lead category:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to delete lead category',
			error: error.message
		});
	}
});

// ==================== B2B LEAD MANAGEMENT ROUTES ====================

// Get all leads with filtering and pagination
// Get leads status count
router.get('/leads/status-count', isCollege, async (req, res) => {
	try {
		let teamMembers = await getAllTeamMembers(req.user._id);

		// Ownership Conditions for team members
		const ownershipConditions = teamMembers.map(member => ({
			$or: [{ leadAddedBy: member }, { leadOwner: member }]
		}));

		// Base query with ownership conditions
		const baseQuery = {
			$and: [
				...(ownershipConditions.length > 0 ? [{ $or: ownershipConditions.flatMap(c => c.$or || [c]) }] : [])
			]
		};

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
				collegeId: college._id
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

router.get('/leads', isCollege, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			status,
			leadCategory,
			typeOfB2B,
			search,
			sortBy = 'createdAt',
			sortOrder = 'desc',
			subStatus
		} = req.query;



		let teamMembers = await getAllTeamMembers(req.user._id);
		const query = {};

		// Ownership Conditions for team members
		const ownershipConditions = teamMembers.map(member => ({
			$or: [{ leadAddedBy: member }, { leadOwner: member }]
		}));

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

		// Build the final query
		const finalQuery = {
			$and: [
				// Ownership condition
				{ $or: ownershipConditions.flatMap(c => c.$or) },
				// Search condition (if search is provided)
				...(search ? [searchConditions] : []),
				// Other filters
				...(status ? [{ status }] : []),
				...(leadCategory ? [{ leadCategory }] : []),
				...(typeOfB2B ? [{ typeOfB2B }] : []),
				...(subStatus ? [{ subStatus }] : [])
			]
		};



		// Sorting options
		const sortOptions = {};
		sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

		// Pagination logic
		const skip = (page - 1) * limit;

		// Get total lead count for pagination
		const totalLeads = await Lead.countDocuments(finalQuery);
		const totalPages = Math.ceil(totalLeads / limit);



		// Fetch leads based on the query, sorted and paginated
		const leads = await Lead.find(finalQuery)
			.populate('leadCategory', 'name')
			.populate('typeOfB2B', 'name')
			.populate('status', 'name title substatuses')
			.populate('followUp', 'scheduledDate status')
			.populate('leadAddedBy', 'name email')
			.populate('leadOwner', 'name email')
			.sort(sortOptions)
			.skip(skip)
			.limit(Number(limit));


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

// Get lead by ID
router.get('/leads/:id', isCollege, async (req, res) => {
	try {
		const lead = await Lead.findOne({
			_id: req.params.id,
			leadAddedBy: req.user._id
		})
			.populate('leadCategory', 'name')
			.populate('typeOfB2B', 'name')
			.populate('status', 'name')
			.populate('followUp', 'followUpType description status scheduledDate completedDate')
			.populate('leadAddedBy', 'name email')
			.populate('remark.addedBy', 'name email');

		if (!lead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
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
			landlineNumber
		} = req.body;

		const requiredFields = [leadCategory, typeOfB2B, businessName, concernPersonName, mobile];

		let missingFields = [];
		requiredFields.forEach(field => {
			if (!field) {
				missingFields.push(field);
			}
		});

		if (missingFields.length > 0) {
			return res.status(400).json({
				status: false,
				message: `Required fields missing: ${missingFields.join(", ")}`
			});
		}

		// Check if email already exists
		const existingLead = await Lead.findOne({
			email,
			leadAddedBy: req.user._id
		});

		if (existingLead) {
			return res.status(400).json({
				status: false,
				message: 'Lead with this email already exists'
			});
		}

		// Create new lead (default status will be set by schema middleware)
		const newLead = new Lead({
			leadCategory,
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
			leadAddedBy: req.user._id,
			remark,
			landlineNumber
		});



		let savedLead = await newLead.save();

		if (savedLead) {
			savedLead.logs.push({
				user: req.user._id,
				timestamp: new Date(),
				action: 'Lead added with default status',
				remarks: remark || 'Lead created with default status'
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

// Update lead status
router.put('/leads/:id/status', isCollege, async (req, res) => {
	try {
		const { id } = req.params;
		const { status, subStatus, remarks } = req.body;



		// Validate required fields
		if (!status) {
			return res.status(400).json({
				status: false,
				message: 'Status is required'
			});
		}

		// Find the lead
		const lead = await Lead.findById(id);

		if (!lead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		// Check ownership
		let teamMembers = await getAllTeamMembers(req.user._id);


		const isOwner = teamMembers.some(member =>
			lead.leadAddedBy.toString() === member.toString() ||
			lead.leadOwner.toString() === member.toString()
		);


		if (!isOwner) {
			return res.status(403).json({
				status: false,
				message: 'You do not have permission to update this lead'
			});
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



		// Add to logs with detailed status change information
		lead.logs.push({
			user: req.user._id,
			timestamp: new Date(),
			action: `Status changed from ${oldStatusName} (${oldSubStatusName}) to ${newStatusName} (${newSubStatusName})`,
			remarks: remarks || `Status updated from ${oldStatusName} to ${newStatusName}`
		});

		await lead.save();

		// Populate the updated lead
		const updatedLead = await Lead.findById(id)
			.populate('leadCategory', 'name')
			.populate('typeOfB2B', 'name')
			.populate('status', 'name title substatuses')
			.populate('leadAddedBy', 'name email')
			.populate('leadOwner', 'name email');

		res.json({
			status: true,
			data: updatedLead,
			message: 'Lead status updated successfully'
		});
	} catch (error) {
		console.error('Error updating lead status:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to update lead status',
			error: error.message
		});
	}
});

// Update lead
router.put('/leads/:id', isCollege, async (req, res) => {
	try {
		const {
			leadCategory,
			typeOfB2B,
			businessName,
			address,
			coordinates,
			concernPersonName,
			designation,
			email,
			mobile,
			whatsapp,
			leadOwner,
			landlineNumber
		} = req.body;

		const user = req.user;

		// Check if lead exists and belongs to the user
		const existingLead = await Lead.findOne({
			_id: req.params.id,
			leadAddedBy: req.user._id
		});

		if (!existingLead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		// Check if email already exists (excluding current lead)
		if (email && email !== existingLead.email) {
			const emailExists = await Lead.findOne({
				email,
				leadAddedBy: req.user._id,
				_id: { $ne: req.params.id }
			});

			if (emailExists) {
				return res.status(400).json({
					status: false,
					message: 'Lead with this email already exists'
				});
			}
		}

		// Update lead
		const updatedLead = await Lead.findByIdAndUpdate(
			req.params.id,
			{
				leadCategory,
				typeOfB2B,
				businessName,
				address,
				coordinates,
				concernPersonName,
				designation,
				email,
				mobile,
				whatsapp,
				leadOwner,
				landlineNumber,
				leadAddedBy: user._id
			},
			{ new: true, runValidators: true }
		).populate([
			{ path: 'leadCategory', select: 'name' },
			{ path: 'typeOfB2B', select: 'name' },
			{ path: 'leadAddedBy', select: 'name email' }
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
		const deletedLead = await Lead.findOneAndDelete({
			_id: req.params.id,
			leadAddedBy: req.user._id
		});

		if (!deletedLead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

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

		// Check if lead exists
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

		// Combine date and time
		const [hours, minutes] = scheduledTime.split(':');
		const scheduledDateTime = new Date(scheduledDate);
		scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

		// Create new follow-up
		const newFollowUp = new FollowUp({
			leadId: req.params.id,
			followUpType: followUpType || 'Call',
			description: description || 'Follow-up call',
			scheduledDate: scheduledDateTime,
			remarks: remarks,
			addedBy: req.user._id
		});

		const savedFollowUp = await newFollowUp.save();

		// Update lead with follow-up reference and add to logs
		lead.followUp = savedFollowUp._id;
		lead.logs.push({
			user: req.user._id,
			timestamp: new Date(),
			action: `Follow-up scheduled for ${scheduledDateTime.toLocaleDateString()} at ${scheduledTime}`,
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
					accessToken: req.user.googleAuthToken.accessToken,
					event: event
				});

				// Update follow-up with Google Calendar event ID
				savedFollowUp.googleCalendarEventId = googleEvent.data.id;
				await savedFollowUp.save();

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

		// Check if lead exists and belongs to user
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

// Change lead status with optional follow-up
router.put('/leads/:id/status', isCollege, async (req, res) => {
	try {
		const {
			status,
			subStatus,
			followUpDate,
			followUpTime,
			remarks,
			googleCalendarEvent = false
		} = req.body;

		if (!status) {
			return res.status(400).json({
				status: false,
				message: 'Status is required'
			});
		}

		// Check if lead exists and belongs to user
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

		// Prepare update data
		const updateData = {
			status,
			subStatus
		};

		// Add follow-up if provided
		let followUp = null;
		if (followUpDate && followUpTime) {
			const [hours, minutes] = followUpTime.split(':');
			const scheduledDateTime = new Date(followUpDate);
			scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

			followUp = new FollowUp({
				leadId: req.params.id,
				followUpType: 'Status Change Follow-up',
				description: `Status changed to ${status}`,
				scheduledDate: scheduledDateTime,
				remarks: remarks,
				addedBy: req.user._id
			});

			await followUp.save();
			updateData.followUp = followUp._id;
		}

		// Update lead status and add to logs
		const updatedLead = await Lead.findByIdAndUpdate(
			req.params.id,
			updateData,
			{ new: true }
		).populate([
			{ path: 'leadCategory', select: 'name' },
			{ path: 'typeOfB2B', select: 'name' },
			{ path: 'status', select: 'name' },
			{ path: 'leadAddedBy', select: 'name email' }
		]);

		// Add to logs
		updatedLead.logs.push({
			user: req.user._id,
			timestamp: new Date(),
			action: `Status changed to ${status}`,
			remarks: remarks
		});

		if (followUp) {
			updatedLead.logs.push({
				user: req.user._id,
				timestamp: new Date(),
				action: `Follow-up scheduled for ${scheduledDateTime.toLocaleDateString()} at ${followUpTime}`,
				remarks: remarks
			});
		}

		await updatedLead.save();

		// Create Google Calendar event if requested (optional)
		let googleEvent = null;
		if (googleCalendarEvent && followUp && req.user.googleAuthToken?.accessToken) {
			try {
				const { createGoogleCalendarEvent } = require('../../services/googleservice');

				const event = {
					summary: `B2B Follow-up: ${lead.businessName}`,
					description: `Status Change Follow-up with ${lead.concernPersonName} (${lead.designation || 'N/A'})\n\nBusiness: ${lead.businessName}\nContact: ${lead.mobile}\nEmail: ${lead.email}\nStatus: ${status}\n\nRemarks: ${remarks || 'No remarks'}`,
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
					accessToken: req.user.googleAuthToken.accessToken,
					event: event
				});

				// Update follow-up with Google Calendar event ID
				followUp.googleCalendarEventId = googleEvent.data.id;
				await followUp.save();

			} catch (googleError) {
				console.error('Google Calendar Error:', googleError);
				// Don't fail the entire request if Google Calendar fails
			}
		}

		res.json({
			status: true,
			data: {
				lead: updatedLead,
				followUp: followUp,
				googleEvent: googleEvent?.data || null
			},
			message: 'Lead status updated successfully' + (followUp ? ' with follow-up scheduled' : '') + (googleEvent ? ' and added to Google Calendar' : '')
		});
	} catch (error) {
		console.error('Error updating lead status:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to update lead status',
			error: error.message
		});
	}
});

// Bulk import leads from CSV/Excel
router.post('/leads/import', isCollege, upload, async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				status: false,
				message: 'Please upload a file'
			});
		}

		const filePath = req.file.path;
		const fileExtension = path.extname(req.file.originalname).toLowerCase();

		let leads = [];

		if (fileExtension === '.csv') {
			// Parse CSV
			const csvData = fs.readFileSync(filePath, 'utf8');
			leads = await new Promise((resolve, reject) => {
				csv.parseString(csvData, { headers: true })
					.on('data', (row) => {
						leads.push(row);
					})
					.on('end', () => {
						resolve(leads);
					})
					.on('error', reject);
			});
		} else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
			// Parse Excel
			leads = await readXlsxFile(filePath);
			const headers = leads[0];
			leads = leads.slice(1).map(row => {
				const obj = {};
				headers.forEach((header, index) => {
					obj[header] = row[index];
				});
				return obj;
			});
		} else {
			return res.status(400).json({
				status: false,
				message: 'Unsupported file format. Please upload CSV or Excel file'
			});
		}

		// Process and validate leads
		const processedLeads = [];
		const errors = [];

		for (let i = 0; i < leads.length; i++) {
			const row = leads[i];
			try {
				// Validate required fields
				if (!row.businessName || !row.concernPersonName || !row.email || !row.mobile) {
					errors.push(`Row ${i + 2}: Missing required fields`);
					continue;
				}

				// Check if email already exists
				const existingLead = await Lead.findOne({
					email: row.email,
					leadAddedBy: req.user._id
				});

				if (existingLead) {
					errors.push(`Row ${i + 2}: Email ${row.email} already exists`);
					continue;
				}

				// Create lead object
				const leadData = {
					businessName: row.businessName,
					concernPersonName: row.concernPersonName,
					email: row.email,
					mobile: row.mobile,
					businessAddress: row.businessAddress || '',
					designation: row.designation || '',
					whatsapp: row.whatsapp || '',
					leadOwner: row.leadOwner || '',
					leadAddedBy: req.user._id
				};

				// Add coordinates if provided
				if (row.latitude && row.longitude) {
					leadData.coordinates = {
						coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)]
					};
				}

				// Add leadCategory and typeOfB2B if provided
				if (row.leadCategory) {
					const leadCategory = await LeadCategory.findOne({ name: row.leadCategory, isActive: true });
					if (leadCategory) {
						leadData.leadCategory = leadCategory._id;
					}
				}

				if (row.typeOfB2B) {
					const typeOfB2B = await TypeOfB2B.findOne({ name: row.typeOfB2B, isActive: true });
					if (typeOfB2B) {
						leadData.typeOfB2B = typeOfB2B._id;
					}
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

		// Clean up uploaded file
		fs.unlinkSync(filePath);

		res.json({
			status: true,
			data: {
				inserted: insertedLeads.length,
				errors: errors.length,
				errorDetails: errors
			},
			message: `Import completed. ${insertedLeads.length} leads imported successfully${errors.length > 0 ? `, ${errors.length} errors found` : ''}`
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

		let teamMembers = await getAllTeamMembers(req.user._id);

		// Ownership Conditions for team members
		const ownershipConditions = teamMembers.map(member => ({
			$or: [{ leadAddedBy: member }, { leadOwner: member }]
		}));

		// Base query with ownership conditions
		const baseQuery = {
			$and: [
				...(ownershipConditions.length > 0 ? [{ $or: ownershipConditions.flatMap(c => c.$or || [c]) }] : [])
			]
		};

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

		const finalQuery = {
			$and: [baseQuery, dateFilter]
		};

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

		const user = req.user;
		const lead = await Lead.findById(leadId);
		if (!lead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}
		const olduser = await User.findById(lead.leadOwner);
		const newUser = await User.findById(counselorId);
		lead.previousLeadOwners.push(lead.leadOwner);
		lead.leadOwner = counselorId;
		lead.updatedBy = user._id;

		const logEntry = {
			user: user._id,
			action: `Lead referred from ${olduser.name} to ${newUser.name}`,
			timestamp: new Date(),
			remarks: ''
		};


		lead.logs.push(logEntry);



		await lead.save();
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

module.exports = router;
