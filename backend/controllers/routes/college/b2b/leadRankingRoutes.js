const express = require('express');
const mongoose = require('mongoose');
const { isCollege } = require('../../../../helpers');
const LeadRanking = require('../../../models/b2b/leadRanking');

const router = express.Router();

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(String(id));

// GET /college/b2b/lead-rankings
router.get('/lead-rankings', isCollege, async (req, res) => {
	try {
		const { status } = req.query;
		const query = {};

		if (status !== undefined && status !== '') {
			query.isActive = status === 'true' || status === true;
		}

		const rankings = await LeadRanking.find(query)
			.populate('addedBy', 'name email')
			.sort({ createdAt: 1 });

		res.json({
			status: true,
			data: rankings,
			message: 'Lead rankings retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting lead rankings:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve lead rankings',
			error: error.message
		});
	}
});

// GET /college/b2b/lead-rankings/:id
router.get('/lead-rankings/:id', isCollege, async (req, res) => {
	try {
		if (!isValidId(req.params.id)) {
			return res.status(400).json({
				status: false,
				message: 'Invalid lead ranking id'
			});
		}

		const ranking = await LeadRanking.findById(req.params.id)
			.populate('addedBy', 'name email');

		if (!ranking) {
			return res.status(404).json({
				status: false,
				message: 'Lead ranking not found'
			});
		}

		res.json({
			status: true,
			data: ranking,
			message: 'Lead ranking retrieved successfully'
		});
	} catch (error) {
		console.error('Error getting lead ranking:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to retrieve lead ranking',
			error: error.message
		});
	}
});

// POST /college/b2b/lead-rankings
router.post('/lead-rankings', isCollege, async (req, res) => {
	try {
		const { name, description } = req.body;

		if (!name || !String(name).trim()) {
			return res.status(400).json({
				status: false,
				message: 'Lead ranking name is required'
			});
		}

		const trimmedName = String(name).trim();
		const existingRanking = await LeadRanking.findOne({ name: trimmedName });
		if (existingRanking) {
			return res.status(400).json({
				status: false,
				message: 'Lead ranking with this name already exists'
			});
		}

		const newRanking = new LeadRanking({
			name: trimmedName,
			description,
			addedBy: req.user._id
		});

		const savedRanking = await newRanking.save();
		await savedRanking.populate([
			{ path: 'addedBy', select: 'name email' }
		]);

		res.status(201).json({
			status: true,
			data: savedRanking,
			message: 'Lead ranking created successfully'
		});
	} catch (error) {
		console.error('Error creating lead ranking:', error);
		if (error.code === 11000) {
			return res.status(400).json({
				status: false,
				message: 'Lead ranking with this name already exists'
			});
		}
		res.status(500).json({
			status: false,
			message: 'Failed to create lead ranking',
			error: error.message
		});
	}
});

// PUT /college/b2b/lead-rankings/:id
router.put('/lead-rankings/:id', isCollege, async (req, res) => {
	try {
		const { name, description, isActive } = req.body;
		const rankingId = req.params.id;

		if (!isValidId(rankingId)) {
			return res.status(400).json({
				status: false,
				message: 'Invalid lead ranking id'
			});
		}

		const currentRanking = await LeadRanking.findById(rankingId);
		if (!currentRanking) {
			return res.status(404).json({
				status: false,
				message: 'Lead ranking not found'
			});
		}

		if (name !== undefined) {
			const trimmedName = String(name).trim();
			if (!trimmedName) {
				return res.status(400).json({
					status: false,
					message: 'Lead ranking name is required'
				});
			}

			const existingRanking = await LeadRanking.findOne({
				name: trimmedName,
				_id: { $ne: rankingId }
			});
			if (existingRanking) {
				return res.status(400).json({
					status: false,
					message: 'Lead ranking with this name already exists'
				});
			}
		}

		const updatePayload = {};
		if (name !== undefined) updatePayload.name = String(name).trim();
		if (description !== undefined) updatePayload.description = description;
		if (isActive !== undefined) updatePayload.isActive = isActive;

		const updatedRanking = await LeadRanking.findByIdAndUpdate(
			rankingId,
			updatePayload,
			{ new: true, runValidators: true }
		).populate([
			{ path: 'addedBy', select: 'name email' }
		]);

		res.json({
			status: true,
			data: updatedRanking,
			message: 'Lead ranking updated successfully'
		});
	} catch (error) {
		console.error('Error updating lead ranking:', error);
		if (error.code === 11000) {
			return res.status(400).json({
				status: false,
				message: 'Lead ranking with this name already exists'
			});
		}
		res.status(500).json({
			status: false,
			message: 'Failed to update lead ranking',
			error: error.message
		});
	}
});

// DELETE /college/b2b/lead-rankings/:id
router.delete('/lead-rankings/:id', isCollege, async (req, res) => {
	try {
		const rankingId = req.params.id;

		if (!isValidId(rankingId)) {
			return res.status(400).json({
				status: false,
				message: 'Invalid lead ranking id'
			});
		}

		const deletedRanking = await LeadRanking.findByIdAndDelete(rankingId);

		if (!deletedRanking) {
			return res.status(404).json({
				status: false,
				message: 'Lead ranking not found'
			});
		}

		res.json({
			status: true,
			message: 'Lead ranking deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting lead ranking:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to delete lead ranking',
			error: error.message
		});
	}
});

module.exports = router;
