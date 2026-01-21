const express = require("express");
const { RewardStatus, Candidate } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);

// Route to render rewardStatus.ejs template
router.route("/").get(async (req, res) => {
	try {
		const selectedCandidateId = req.query.candidateId || null;
		
		const candidates = await Candidate.find({ status: true, isDeleted: { $ne: true } })
			.select('_id name mobile')
			.sort({ name: 1 })
			.limit(1000) // Limit to prevent performance issues
			.lean();

		let query = {};
		if (selectedCandidateId) {
			query = { candidate: selectedCandidateId };
		} else {
			query = { candidate: null };
		}

		const statuses = await RewardStatus.find(query)
			.sort({ index: 1 })
			.lean();

		// Format statuses for the template
		const formattedStatuses = statuses.map((status, index) => ({
			_id: status._id,
			id: status.index + 1,
			title: status.title,
			milestone: status.milestone || '',
			description: status.description || '',
			rewardType: status.rewardType || 'other',
			substatuses: status.substatuses || [],
			requiredDocuments: status.requiredDocuments || [],
			requiresFeedback: status.requiresFeedback || false,
			feedbackLabel: status.feedbackLabel || 'Feedback',
			index: status.index,
			candidate: status.candidate || null
		}));

		return res.render(`${req.vPath}/admin/statuses/rewardsStatus`, {
			menu: 'rewardStatus',
			statuses: formattedStatuses,
			// New candidate-based selector
			candidates: candidates,
			selectedCandidateId: selectedCandidateId,
			// Backward compatibility for existing EJS template (still uses "colleges"/"selectedCollegeId")
			colleges: candidates,
			selectedCollegeId: selectedCandidateId
		});
	} catch (err) {
		console.error('Error fetching rewardStatus:', err);
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

// GET API endpoint for fetching statuses (for React app or API calls)
router.get('/api', async (req, res) => {
	try {
		const candidateId = req.query.candidateId || null;
	
		let query = {};
		if (candidateId) {
			query = { candidate: candidateId };
		} else {
			query = { candidate: null };
		}

		const statuses = await RewardStatus.find(query)
			.sort({ index: 1 })
			.lean();

		return res.status(200).json({ 
			success: true, 
			message: 'Reward statuses fetched successfully', 
			data: statuses 
		});
	} catch (err) {
		console.error('Error fetching rewardStatus:', err);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

router.post('/add', async (req, res) => {
	try {
		const { title, description, milestone, candidateId, rewardType, requiredDocuments, requiresFeedback, feedbackLabel } = req.body;
	
		// Validate candidateId if provided
		let validatedCandidateId = null;
		if (candidateId) {
			const candidate = await Candidate.findById(candidateId);
			if (!candidate) {
				return res.status(400).json({ 
					success: false, 
					message: 'Invalid candidate ID provided' 
				});
			}
			validatedCandidateId = candidateId;
		}
		
		let indexQuery = {};
		if (validatedCandidateId) {
			indexQuery = { candidate: validatedCandidateId };
		} else {
			indexQuery = { candidate: null };
		}
		
		const highestIndexStatus = await RewardStatus.findOne(indexQuery).sort('-index');
		const newIndex = highestIndexStatus ? highestIndexStatus.index + 1 : 0;
		
		const newStatus = new RewardStatus({
			title,
			description: description || '',
			milestone: milestone || '',
			rewardType: rewardType || 'other',
			index: newIndex,
			substatuses: [],
			requiredDocuments: requiredDocuments || [],
			requiresFeedback: requiresFeedback || false,
			feedbackLabel: feedbackLabel || 'Feedback',
			candidate: validatedCandidateId || null
		});
	
		const data = await newStatus.save();
		
		return res.status(201).json({ success: true, message: 'Reward status created successfully', data: data });
	} catch (err) {
		console.error(err.message);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

router.put('/edit/:id', async (req, res) => {
	try {
		const { title, description, milestone, rewardType, requiredDocuments, requiresFeedback, feedbackLabel } = req.body;
		
		const status = await RewardStatus.findById(req.params.id);
		
		if (!status) {
			return res.status(404).json({ success: false, message: 'Reward status not found' });
		}
		
		if (title !== undefined) status.title = title;
		if (description !== undefined) status.description = description;
		if (milestone !== undefined) status.milestone = milestone;
		if (rewardType !== undefined) status.rewardType = rewardType;
		if (requiredDocuments !== undefined) status.requiredDocuments = requiredDocuments || [];
		if (requiresFeedback !== undefined) status.requiresFeedback = requiresFeedback || false;
		if (feedbackLabel !== undefined) status.feedbackLabel = feedbackLabel || 'Feedback';
		
		const data = await status.save();
		
		return res.status(200).json({
			success: true,
			message: 'Reward status updated successfully',
			data: data
		});
	} catch (err) {
		console.error(err.message);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

router.delete('/delete/:id', async (req, res) => {
	try {
		const status = await RewardStatus.findById(req.params.id);
		if (!status) {
			return res.status(404).json({ success: false, message: 'Reward status not found' });
		}
		
		const candidateId = status.candidate;
		
		await status.deleteOne();
		
		let reindexQuery = {};
		if (candidateId) {
			reindexQuery = {
				$or: [
					{ candidate: candidateId },
					{ candidate: null }
				]
			};
		} else {
			reindexQuery = { candidate: null };
		}
		
		const remainingStatuses = await RewardStatus.find(reindexQuery).sort('index');
		for (let i = 0; i < remainingStatuses.length; i++) {
			remainingStatuses[i].index = i;
			await remainingStatuses[i].save();
		}
		
		return res.status(200).json({
			success: true,
			message: 'Reward status deleted successfully'
		});
	} catch (err) {
		console.error(err.message);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

router.put('/reorder', async (req, res) => {
	try {
		const { statusOrder, candidateId } = req.body;
		
		if (!Array.isArray(statusOrder)) {
			return res.status(400).json({ success: false, message: 'Invalid statusOrder array' });
		}
		
		const statusIds = statusOrder.map(s => s._id).filter(id => require('mongoose').Types.ObjectId.isValid(id));
		
		if (statusIds.length === 0) {
			return res.status(400).json({ success: false, message: 'No valid status IDs provided' });
		}
		const statusesToReorder = await RewardStatus.find({ _id: { $in: statusIds } });
		
		const expectedCandidateId = candidateId || null;
		for (const status of statusesToReorder) {
			const statusCandidateId = status.candidate ? status.candidate.toString() : null;
			if (statusCandidateId !== expectedCandidateId) {
				return res.status(400).json({ 
					success: false, 
					message: `Cannot reorder: Status "${status.title}" belongs to a different candidate context` 
				});
			}
		}
		
		for (let i = 0; i < statusOrder.length; i++) {
			const { _id, index } = statusOrder[i];
			
			if (!require('mongoose').Types.ObjectId.isValid(_id)) {
				return res.status(400).json({ success: false, message: `Invalid status ID at position ${i}` });
			}
			
			await RewardStatus.findByIdAndUpdate(_id, { index: index });
		}
		
		return res.status(200).json({
			success: true,
			message: 'Reward status order updated successfully'
		});
	} catch (error) {
		console.error('Error in reorder:', error.message);
		return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
	}
});

router.post('/:statusId/substatus', async (req, res) => {
	try {
		const { title, description, hasRemarks, hasFollowup, hasAttachment } = req.body;
		
		const status = await RewardStatus.findById(req.params.statusId);
		
		if (!status) {
			return res.status(404).json({ success: false, message: 'Reward status not found' });
		}
		
		const newSubstatus = {
			title,
			description,
			hasRemarks: hasRemarks || false,
			hasFollowup: hasFollowup || false,
			hasAttachment: hasAttachment || false
		};
		
		status.substatuses.push(newSubstatus);
		
		const data = await status.save();
		return res.status(201).json({ success: true, message: 'Sub status created successfully', data: data });
	} catch (err) {
		console.error(err.message);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

router.put('/:statusId/substatus/:substatusId', async (req, res) => {
	try {
		const { title, description, hasRemarks, hasFollowup, hasAttachment } = req.body;
		
		const status = await RewardStatus.findById(req.params.statusId);
		
		if (!status) {
			return res.status(404).json({ success: false, message: 'Reward status not found' });
		}
		
		// Find the substatus
		const substatus = status.substatuses.id(req.params.substatusId);
		
		if (!substatus) {
			return res.status(404).json({ success: false, message: 'Substatus not found' });
		}
		
		// Update substatus
		if (title !== undefined) substatus.title = title;
		if (description !== undefined) substatus.description = description;
		if (hasRemarks !== undefined) substatus.hasRemarks = hasRemarks;
		if (hasFollowup !== undefined) substatus.hasFollowup = hasFollowup;
		if (hasAttachment !== undefined) substatus.hasAttachment = hasAttachment;
		
		const data = await status.save();
		return res.status(200).json({ success: true, message: 'Sub status updated successfully', data: data });
	} catch (err) {
		console.error(err.message);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

router.delete('/deleteSubStatus/:statusId/substatus/:substatusId', async (req, res) => {
	try {
		const status = await RewardStatus.findById(req.params.statusId);
		
		if (!status) {
			return res.status(404).json({ success: false, message: 'Reward status not found' });
		}
		
		// Find the substatus index
		const substatusIndex = status.substatuses.findIndex(
			sub => sub._id.toString() === req.params.substatusId
		);
		
		if (substatusIndex === -1) {
			return res.status(404).json({ success: false, message: 'Substatus not found' });
		}
		
		// Remove the substatus
		status.substatuses.splice(substatusIndex, 1);
		
		await status.save();
		return res.status(200).json({
			success: true,
			message: 'Substatus deleted successfully'
		});
	} catch (err) {
		console.error(err.message);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

module.exports = router;

