const express = require('express');
const router = express.Router();
const classroomMediaController = require('../../../controllers/college/classroomMediaController');
const { isCollege } = require('../../../helpers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/classroom-media';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'video': ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
    'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
    'presentation': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
  };

  const isAllowed = Object.values(allowedTypes).flat().includes(file.mimetype);
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});



// Apply authentication middleware to all routes
router.use(isCollege);

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

// Download media
router.get('/:id/download/:fileIndex', classroomMediaController.downloadMedia);

// Get media statistics
router.get('/statistics/overview', classroomMediaController.getMediaStatistics);

module.exports = router; 