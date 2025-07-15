const express = require("express");
const axios = require("axios");
const moment = require("moment");
let fs = require("fs");
let path = require("path");
const { isCollege } = require("../../../../helpers");
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
		if(status){
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
		if(status){
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

module.exports = router;
