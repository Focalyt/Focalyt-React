const express = require("express");
const { RewardClaim, RewardStatus, Candidate } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);

// Route to render rewardClaims.ejs template (list all claims)
router.route("/").get(async (req, res) => {
	try {
		const { status, rewardType, candidateId } = req.query;
		
		// Build query
		let query = {};
		if (status && status !== 'all') {
			query.status = status;
		}
		if (candidateId) {
			query._candidate = candidateId;
		}

		// Fetch claims with populated data
		let claims = await RewardClaim.find(query)
			.populate('_candidate', 'name mobile email')
			.populate('_rewardStatus', 'title description rewardType milestone')
			.sort({ createdAt: -1 })
			.lean();

		// Filter by rewardType if provided
		if (rewardType && rewardType !== 'all') {
			claims = claims.filter(claim => claim._rewardStatus?.rewardType === rewardType);
		}

		// Get candidates list for filter dropdown
		const candidates = await Candidate.find({ status: true, isDeleted: { $ne: true } })
			.select('_id name mobile')
			.sort({ name: 1 })
			.limit(1000)
			.lean();

		// Format claims for display
		const formattedClaims = claims.map(claim => ({
			...claim,
			candidateName: claim._candidate?.name || 'N/A',
			candidateMobile: claim._candidate?.mobile || 'N/A',
			candidateEmail: claim._candidate?.email || 'N/A',
			rewardTitle: claim._rewardStatus?.title || 'N/A',
			rewardDescription: claim._rewardStatus?.description || '',
			rewardType: claim._rewardStatus?.rewardType || 'other',
			claimedAtFormatted: claim.claimedAt ? new Date(claim.claimedAt).toLocaleString('en-IN') : 'N/A',
			approvedAtFormatted: claim.approvedAt ? new Date(claim.approvedAt).toLocaleString('en-IN') : null,
			rejectedAtFormatted: claim.rejectedAt ? new Date(claim.rejectedAt).toLocaleString('en-IN') : null,
			disbursedAtFormatted: claim.disbursedAt ? new Date(claim.disbursedAt).toLocaleString('en-IN') : null
		}));

		// Get statistics
		const stats = {
			total: await RewardClaim.countDocuments({}),
			pending: await RewardClaim.countDocuments({ status: 'pending' }),
			approved: await RewardClaim.countDocuments({ status: 'approved' }),
			rejected: await RewardClaim.countDocuments({ status: 'rejected' })
		};

		return res.render(`${req.vPath}/admin/claims/rewardClaims`, {
			menu: 'rewardClaims',
			currentUser: req.session.user,
			claims: formattedClaims,
			candidates: candidates,
			stats: stats,
			filters: {
				status: status || 'all',
				rewardType: rewardType || 'all',
				candidateId: candidateId || ''
			}
		});
	} catch (err) {
		console.error('Error fetching reward claims:', err);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

// API route to get single claim details
router.get('/:id', async (req, res) => {
	try {
		const claim = await RewardClaim.findById(req.params.id)
			.populate('_candidate', 'name mobile email')
			.populate('_rewardStatus', 'title description rewardType milestone requiredDocuments')
			.lean();

		if (!claim) {
			return res.status(404).json({ success: false, message: 'Claim not found' });
		}

		return res.status(200).json({
			success: true,
			data: claim
		});
	} catch (err) {
		console.error('Error fetching claim:', err);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

// API route to approve a claim
router.put('/:id/approve', async (req, res) => {
	try {
		const { adminRemarks } = req.body;
		
		const claim = await RewardClaim.findById(req.params.id);
		
		if (!claim) {
			return res.status(404).json({ success: false, message: 'Claim not found' });
		}

		if (claim.status === 'approved') {
			return res.status(400).json({ success: false, message: 'Claim already approved' });
		}

		claim.status = 'approved';
		claim.approvedAt = new Date();
		if (adminRemarks) {
			claim.adminRemarks = adminRemarks;
		}

		await claim.save();

		return res.status(200).json({
			success: true,
			message: 'Claim approved successfully',
			data: claim
		});
	} catch (err) {
		console.error('Error approving claim:', err);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

// API route to reject a claim
router.put('/:id/reject', async (req, res) => {
	try {
		const { adminRemarks } = req.body;
		
		if (!adminRemarks || !adminRemarks.trim()) {
			return res.status(400).json({ success: false, message: 'Admin remarks are required for rejection' });
		}

		const claim = await RewardClaim.findById(req.params.id);
		
		if (!claim) {
			return res.status(404).json({ success: false, message: 'Claim not found' });
		}

		if (claim.status === 'rejected') {
			return res.status(400).json({ success: false, message: 'Claim already rejected' });
		}

		claim.status = 'rejected';
		claim.rejectedAt = new Date();
		claim.adminRemarks = adminRemarks;

		await claim.save();

		return res.status(200).json({
			success: true,
			message: 'Claim rejected successfully',
			data: claim
		});
	} catch (err) {
		console.error('Error rejecting claim:', err);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

// API route to mark claim as disbursed
router.put('/:id/disburse', async (req, res) => {
	try {
		const claim = await RewardClaim.findById(req.params.id);
		
		if (!claim) {
			return res.status(404).json({ success: false, message: 'Claim not found' });
		}

		if (claim.status !== 'approved') {
			return res.status(400).json({ success: false, message: 'Only approved claims can be marked as disbursed' });
		}

		claim.disbursedAt = new Date();
		await claim.save();

		return res.status(200).json({
			success: true,
			message: 'Claim marked as disbursed successfully',
			data: claim
		});
	} catch (err) {
		console.error('Error marking claim as disbursed:', err);
		return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
	}
});

module.exports = router;

