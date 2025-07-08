const ClassroomMedia = require('../models/ClassroomMedia');
const path = require('path');
const uuid = require('uuid/v1');

const { bucketName, region } = require('../../config');
const fs = require('fs');
const AWS = require("aws-sdk");


// Get media type from MIME type
const s3 = new AWS.S3({ region, signatureVersion: 'v4' });

const getMediaType = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.includes('powerpoint')) return 'presentation';
    return 'document';
};

// Upload classroom media
const uploadMedia = async (req, res) => {
    try {
        console.log('=== Upload Request Debug ===');
        console.log('Body:', req.body);
        console.log('Files:', req.files);
        console.log('Files keys:', req.files ? Object.keys(req.files) : 'No files');

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        // Handle mediaFiles (single or multiple)
        let filesArray = [];
        if (req.files.mediaFiles) {
            filesArray = Array.isArray(req.files.mediaFiles)
                ? req.files.mediaFiles
                : [req.files.mediaFiles];
        }

        console.log('Files array length:', filesArray.length);

        // ✅ FILE SIZE CHECK
        const maxFileSize = 100 * 1024 * 1024; // 100MB in bytes
        const invalidFiles = [];

        filesArray.forEach((file, index) => {
            console.log(`File ${index + 1}: ${file.name} - Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);

            if (file.size > maxFileSize) {
                invalidFiles.push({
                    name: file.name,
                    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                    maxAllowed: `${maxFileSize / (1024 * 1024)} MB`
                });
            }
        });

        // If any file exceeds size limit
        if (invalidFiles.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some files exceed the maximum size limit',
                invalidFiles: invalidFiles,
                maxSizeAllowed: `${maxFileSize / (1024 * 1024)} MB`
            });
        }

        const { description, batchId, date } = req.body;

        if (!batchId || batchId === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'Batch ID is required'
            });
        }

        // ✅ ADDITIONAL FILE TYPE CHECK (Optional)
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg',
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];

        const invalidFileTypes = [];
        filesArray.forEach((file, index) => {
            if (!allowedTypes.includes(file.mimetype)) {
                invalidFileTypes.push({
                    name: file.name,
                    type: file.mimetype
                });
            }
        });

        if (invalidFileTypes.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some files have invalid file types',
                invalidFileTypes: invalidFileTypes,
                allowedTypes: [
                    'Images: JPEG, PNG, GIF, WebP, JPG, jpg',
                    'Videos: MP4, AVI, MOV, WMV, FLV',
                    'Audio: MP3, WAV, OGG',
                    'Presentations: PPT, PPTX'
                ]
            });
        }


        // Process files
        const fileDataArray = [];
       
        const uploadPromises = [];

        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'mp3', 'wav', 'ogg'];
        const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'web']
        const allowedVideoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv'];

        filesArray.forEach((item) => {
            const { name, mimetype } = item;
            const ext = name?.split('.').pop().toLowerCase();

            if (!allowedExtensions.includes(ext)) {
                throw new Error(`File type not supported: ${ext}`);
            }

            let fileType = "";
            if (allowedImageExtensions.includes(ext)) {
                fileType = "image";
            } else if (allowedVideoExtensions.includes(ext)) {
                fileType = "video";
            }

            const key = `ClassroomMedia/${batchId}/${date}/${uuid()}.${ext}`;
            console.log('key', key);
            const params = {
                Bucket: bucketName,
                Key: key,
                Body: item.data,
                ContentType: mimetype,
            };

            uploadPromises.push(
                s3.upload(params).promise().then((uploadResult) => {
                    fileDataArray.push({
                        fileUrl: uploadResult.Location,
                        mediaType:fileType,
                    });
                })
            );
        });

        await Promise.all(uploadPromises);

        console.log('fileDataArray', fileDataArray);

        // Database logic
        let classroomMedia = await ClassroomMedia.findOne({
            batchId,
            date: date ? new Date(date) : new Date(),
            isDeleted: false
        });

        if (classroomMedia) {
            classroomMedia.files.push(...fileDataArray);
            await classroomMedia.save();
        } else {
            const mediaData = {
                date: date ? new Date(date) : new Date(),
                description: description || '',
                files: fileDataArray,
                batchId,
                uploadedBy: req.user._id
            };

            classroomMedia = new ClassroomMedia(mediaData);
            await classroomMedia.save();
        }

        res.status(201).json({
            success: true,
            message: 'Media uploaded successfully',
            data: classroomMedia,
            uploadedFiles: filesArray.length,
            totalSize: `${(filesArray.reduce((total, file) => total + file.size, 0) / (1024 * 1024)).toFixed(2)} MB`
        });
    } catch (error) {
        console.error('Upload media error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};



// Get classroom media with filters
const getClassroomMedia = async (req, res) => {
    try {
        const {
            batchId,
            date,
            search,
            page = 1,
            limit = 20,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {
            isDeleted: false
        };

        if (batchId) query.batchId = batchId;
        if (date) query.date = new Date(date);

        // Text search
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Sorting
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const media = await ClassroomMedia.find(query)
            .populate('uploadedBy', 'name email')
            .populate('batchId', 'name')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ClassroomMedia.countDocuments(query);

        res.json({
            success: true,
            data: media,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get classroom media error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get single media item
const getMediaById = async (req, res) => {
    try {
        const { id } = req.params;

        const media = await ClassroomMedia.findOne({
            _id: id,
            isDeleted: false
        })
            .populate('uploadedBy', 'name email')
            .populate('batchId', 'name');

        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }



        res.json({
            success: true,
            data: media
        });
    } catch (error) {
        console.error('Get media by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update media
const updateMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const media = await ClassroomMedia.findById(id);
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }

        // Check if user has permission to update
        const user = req.user;
        if (media.uploadedBy.toString() !== user._id.toString() && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        // Update allowed fields
        const allowedFields = ['description', 'date'];
        const updates = {};

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updates[field] = updateData[field];
            }
        });

        const updatedMedia = await ClassroomMedia.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('uploadedBy', 'name email');

        res.json({
            success: true,
            message: 'Media updated successfully',
            data: updatedMedia
        });
    } catch (error) {
        console.error('Update media error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete media (soft delete)
const deleteMedia = async (req, res) => {
    try {
        const { id } = req.params;

        const media = await ClassroomMedia.findById(id);
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }

        // Check if user has permission to delete
        const user = req.user;
        if (media.uploadedBy.toString() !== user._id.toString() && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        await media.softDelete(user._id);

        res.json({
            success: true,
            message: 'Media deleted successfully'
        });
    } catch (error) {
        console.error('Delete media error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};



// Download media
const downloadMedia = async (req, res) => {
    try {
        const { id, fileIndex } = req.params;

        const media = await ClassroomMedia.findById(id);
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }

        const fileIndexNum = parseInt(fileIndex);
        if (fileIndexNum < 0 || fileIndexNum >= media.files.length) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        const file = media.files[fileIndexNum];

        // Get file path
        const filePath = path.join(__dirname, '../../', file.fileUrl);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        res.download(filePath, file.originalFileName);
    } catch (error) {
        console.error('Download media error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get media statistics
const getMediaStatistics = async (req, res) => {
    try {
        const { batchId } = req.query;

        const query = {
            isDeleted: false
        };

        if (batchId) query.batchId = batchId;

        const stats = await ClassroomMedia.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalEntries: { $sum: 1 },
                    totalFiles: { $sum: { $size: '$files' } },
                    totalSize: { $sum: { $reduce: { input: '$files', initialValue: 0, in: { $add: ['$$value', '$$this.fileSize'] } } } }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                total: stats[0] || {
                    totalEntries: 0,
                    totalFiles: 0,
                    totalSize: 0
                }
            }
        });
    } catch (error) {
        console.error('Get media statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    uploadMedia,
    getClassroomMedia,
    getMediaById,
    updateMedia,
    deleteMedia,
    downloadMedia,
    getMediaStatistics
}; 