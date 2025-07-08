const express = require('express');
const router = express.Router();
const classroomMediaController = require('../../controllers/college/classroomMediaController');
const { authenticateToken } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Upload classroom media
router.post('/upload', classroomMediaController.uploadMedia);

// Get classroom media with filters
router.get('/', classroomMediaController.getClassroomMedia);

// Get single media item
router.get('/:id', classroomMediaController.getMediaById);

// Update media
router.put('/:id', classroomMediaController.updateMedia);

// Delete media (soft delete)
router.delete('/:id', classroomMediaController.deleteMedia);

// Add comment to media
router.post('/:id/comments', classroomMediaController.addComment);

// Add rating to media
router.post('/:id/ratings', classroomMediaController.addRating);

// Download media
router.get('/:id/download', classroomMediaController.downloadMedia);

// Get media statistics
router.get('/statistics/overview', classroomMediaController.getMediaStatistics);

module.exports = router; 