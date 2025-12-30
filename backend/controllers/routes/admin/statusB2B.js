const express = require("express");
const { StatusB2b, College } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);

// Route to render statusB2B.ejs template
router.route("/").get(async (req, res) => {
	try {
		const selectedCollegeId = req.query.collegeId || null;
		
		const colleges = await College.find({ status: true, isDeleted: { $ne: true } })
			.select('_id name')
			.sort({ name: 1 })
			.lean();

		let query = {};
		if (selectedCollegeId) {
			query = { college: selectedCollegeId };
		} else {
			query = { college: null };
		}

		const statuses = await StatusB2b.find(query)
			.sort({ index: 1 })
			.lean();

		// Format statuses for the template
		const formattedStatuses = statuses.map((status, index) => ({
			_id: status._id,
			id: status.index + 1,
			title: status.title,
			milestone: status.milestone || '',
			description: status.description || '',
			substatuses: status.substatuses || [],
			index: status.index,
			college: status.college || null
		}));

		return res.render(`${req.vPath}/admin/statuses/statusB2B`, {
			menu: 'statusB2B',
			statuses: formattedStatuses,
			colleges: colleges,
			selectedCollegeId: selectedCollegeId
		});
	} catch (err) {
		console.error('Error fetching statusB2B:', err);
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

// GET API endpoint for fetching statuses (for React app or API calls)
router.get('/api', async (req, res) => {
	try {
		const collegeId = req.query.collegeId || null;
	
		let query = {};
		if (collegeId) {
			query = { college: collegeId };
		} else {
			query = { college: null };
		}

		const statuses = await StatusB2b.find(query)
			.sort({ index: 1 })
			.lean();

		return res.status(200).json({ 
			success: true, 
			message: 'Statuses fetched successfully', 
			data: statuses 
		});
	} catch (err) {
		console.error('Error fetching statusB2B:', err);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

// API Endpoints for CRUD operations (for EJS templates and React app - Admin only, no college token needed)
router.post('/add', async (req, res) => {
	try {
		const { title, description, milestone, collegeId } = req.body;
	
		// Validate collegeId if provided
		let validatedCollegeId = null;
		if (collegeId) {
			const college = await College.findById(collegeId);
			if (!college) {
				return res.status(400).json({ 
					success: false, 
					message: 'Invalid college ID provided' 
				});
			}
			validatedCollegeId = collegeId;
		}
		
		let indexQuery = {};
		if (validatedCollegeId) {
			indexQuery = { college: validatedCollegeId };
		} else {
			indexQuery = { college: null };
		}
		
		const highestIndexStatus = await StatusB2b.findOne(indexQuery).sort('-index');
		const newIndex = highestIndexStatus ? highestIndexStatus.index + 1 : 0;
		
		const newStatus = new StatusB2b({
			title,
			description: description || '',
			milestone: milestone || '',
			index: newIndex,
			substatuses: [],
			college: validatedCollegeId || null
		});
		
		const data = await newStatus.save();
		
		return res.status(201).json({ success: true, message: 'Status created successfully', data: data });
	} catch (err) {
		console.error(err.message);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

router.put('/edit/:id', async (req, res) => {
	try {
		const { title, description, milestone } = req.body;
		
		const status = await StatusB2b.findById(req.params.id);
		
		if (!status) {
			return res.status(404).json({ success: false, message: 'Status not found' });
		}
		
		if (title !== undefined) status.title = title;
		if (description !== undefined) status.description = description;
		if (milestone !== undefined) status.milestone = milestone;
		
		const data = await status.save();
		
		return res.status(200).json({
			success: true,
			message: 'Status updated successfully',
			data: data
		});
	} catch (err) {
		console.error(err.message);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

router.delete('/delete/:id', async (req, res) => {
	try {
		const status = await StatusB2b.findById(req.params.id);
		if (!status) {
			return res.status(404).json({ success: false, message: 'Status not found' });
		}
		
		const collegeId = status.college;
		
		await status.deleteOne();
		
		let reindexQuery = {};
		if (collegeId) {
			reindexQuery = {
				$or: [
					{ college: collegeId },
					{ college: null }
				]
			};
		} else {
			reindexQuery = { college: null };
		}
		
		const remainingStatuses = await StatusB2b.find(reindexQuery).sort('index');
		for (let i = 0; i < remainingStatuses.length; i++) {
			remainingStatuses[i].index = i;
			await remainingStatuses[i].save();
		}
		
		return res.status(200).json({
			success: true,
			message: 'Status deleted successfully'
		});
	} catch (err) {
		console.error(err.message);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

router.put('/reorder', async (req, res) => {
	try {
		const { statusOrder, collegeId } = req.body;
		
		if (!Array.isArray(statusOrder)) {
			return res.status(400).json({ success: false, message: 'Invalid statusOrder array' });
		}
		
		const statusIds = statusOrder.map(s => s._id).filter(id => require('mongoose').Types.ObjectId.isValid(id));
		
		if (statusIds.length === 0) {
			return res.status(400).json({ success: false, message: 'No valid status IDs provided' });
		}
		const statusesToReorder = await StatusB2b.find({ _id: { $in: statusIds } });
		
		const expectedCollegeId = collegeId || null;
		for (const status of statusesToReorder) {
			const statusCollegeId = status.college ? status.college.toString() : null;
			if (statusCollegeId !== expectedCollegeId) {
				return res.status(400).json({ 
					success: false, 
					message: `Cannot reorder: Status "${status.title}" belongs to a different college context` 
				});
			}
		}
		
		for (let i = 0; i < statusOrder.length; i++) {
			const { _id, index } = statusOrder[i];
			
			if (!require('mongoose').Types.ObjectId.isValid(_id)) {
				return res.status(400).json({ success: false, message: `Invalid status ID at position ${i}` });
			}
			
			await StatusB2b.findByIdAndUpdate(_id, { index: index });
		}
		
		return res.status(200).json({
			success: true,
			message: 'Status order updated successfully'
		});
	} catch (error) {
		console.error('Error in reorder:', error.message);
		return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
	}
});

router.post('/:statusId/substatus', async (req, res) => {
	try {
		const { title, description, hasRemarks, hasFollowup, hasAttachment } = req.body;
		
		const status = await StatusB2b.findById(req.params.statusId);
		
		if (!status) {
			return res.status(404).json({ success: false, message: 'Status not found' });
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
		
		const status = await StatusB2b.findById(req.params.statusId);
		
		if (!status) {
			return res.status(404).json({ success: false, message: 'Status not found' });
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
		const status = await StatusB2b.findById(req.params.statusId);
		
		if (!status) {
			return res.status(404).json({ success: false, message: 'Status not found' });
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

