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
		console.log(`Found ${statuses.length} statuses for college: ${college._id}`);

		// Get total count
		const totalLeads = await Lead.countDocuments(baseQuery);
		console.log(`Total leads: ${totalLeads}`);

		// Get count by status
		const statusCounts = await Promise.all(
			statuses.map(async (status) => {
				const count = await Lead.countDocuments({
					...baseQuery,
					status: status._id
				});
				console.log(`Status: ${status.title}, Count: ${count}`);
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
		console.log(`Null status count: ${nullStatusCount}`);

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
			sortOrder = 'desc'
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
				...(typeOfB2B ? [{ typeOfB2B }] : [])
			]
		};

		console.log('Search query:', search);
		console.log('Final query:', JSON.stringify(finalQuery, null, 2));

		// Sorting options
		const sortOptions = {};
		sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

		// Pagination logic
		const skip = (page - 1) * limit;

		// Get total lead count for pagination
		const totalLeads = await Lead.countDocuments(finalQuery);
		const totalPages = Math.ceil(totalLeads / limit);

		console.log('Total leads found:', totalLeads);

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

// Create new lead
router.post('/add-lead', isCollege, async (req, res) => {
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
			remark
		} = req.body;


		// Validate required fields
		if (!leadCategory || !typeOfB2B || !businessName || !concernPersonName || !email || !mobile) {
			return res.status(400).json({
				status: false,
				message: 'Required fields missing: leadCategory, typeOfB2B, businessName, concernPersonName, email, mobile'
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
			coordinates,
			concernPersonName,
			designation,
			email,
			mobile,
			whatsapp,
			leadOwner,
			leadAddedBy: req.user._id,
			remark,
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
		
		console.log('Status update request:', {
			leadId: id,
			status,
			subStatus,
			remarks,
			userId: req.user._id
		});

		// Validate required fields
		if (!status) {
			return res.status(400).json({
				status: false,
				message: 'Status is required'
			});
		}

		// Find the lead
		const lead = await Lead.findById(id);
		console.log('Lead found:', lead ? lead._id : 'Not found');
		
		if (!lead) {
			return res.status(404).json({
				status: false,
				message: 'Lead not found'
			});
		}

		// Check ownership
		let teamMembers = await getAllTeamMembers(req.user._id);
		console.log('Team members:', teamMembers);
		console.log('Lead ownership:', {
			leadAddedBy: lead.leadAddedBy,
			leadOwner: lead.leadOwner
		});
		
		const isOwner = teamMembers.some(member => 
			lead.leadAddedBy.toString() === member.toString() || 
			lead.leadOwner.toString() === member.toString()
		);
		
		console.log('Is owner:', isOwner);

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
			oldStatusName = oldStatusDoc ? oldStatusDoc.name : 'Unknown Status';
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
		newStatusName = newStatusDoc ? newStatusDoc.name : 'Unknown Status';

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

		console.log('Updating lead with:', {
			status,
			subStatus,
			updatedBy: req.user._id
		});

		console.log('Status Change Details:', {
			from: `${oldStatusName} (${oldSubStatusName})`,
			to: `${newStatusName} (${newSubStatusName})`,
			leadId: id,
			userId: req.user._id
		});

		// Add to logs with detailed status change information
		lead.logs.push({
			user: req.user._id,
			timestamp: new Date(),
			action: `Status changed from ${oldStatusName} (${oldSubStatusName}) to ${newStatusName} (${newSubStatusName})`,
			remarks: remarks || `Status updated from ${oldStatusName} to ${newStatusName}`
		});

		await lead.save();
		console.log('Lead updated successfully');

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
			leadOwner
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

module.exports = router;
