# Classroom Media API Documentation

## Overview
The Classroom Media API provides comprehensive functionality for managing media files (images, videos, documents, audio, presentations) in educational environments. It supports upload, retrieval, filtering, commenting, rating, and analytics.

## Base URL
```
/college/classroom-media
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Upload Media
**POST** `/upload`

Upload a new media file to the classroom.

**Request Body (multipart/form-data):**
```javascript
{
  mediaFile: File,           // Required: The file to upload
  title: String,             // Required: Media title
  description: String,       // Optional: Media description
  classroomId: ObjectId,     // Required: Classroom ID
  courseId: ObjectId,        // Required: Course ID
  batchId: ObjectId,         // Required: Batch ID
  centerId: ObjectId,        // Required: Center ID
  category: String,          // Optional: 'lecture', 'assignment', 'project', 'tutorial', 'reference', 'assessment', 'other'
  tags: String,              // Optional: Comma-separated tags
  visibility: String,        // Optional: 'public', 'private', 'restricted'
  sessionId: ObjectId,       // Optional: Related session ID
  sessionDate: Date          // Optional: Session date
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Media uploaded successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "React Tutorial",
    "description": "Introduction to React JS",
    "mediaType": "video",
    "fileUrl": "/uploads/classroom-media/1234567890-abc123.mp4",
    "fileName": "1234567890-abc123.mp4",
    "originalFileName": "react-tutorial.mp4",
    "fileSize": 15728640,
    "formattedFileSize": "15.0 MB",
    "uploadedBy": "60f7b3b3b3b3b3b3b3b3b3b4",
    "uploadedByName": "John Doe",
    "uploadedByRole": "teacher",
    "classroomId": "60f7b3b3b3b3b3b3b3b3b3b5",
    "courseId": "60f7b3b3b3b3b3b3b3b3b3b6",
    "batchId": "60f7b3b3b3b3b3b3b3b3b3b7",
    "centerId": "60f7b3b3b3b3b3b3b3b3b3b8",
    "category": "lecture",
    "tags": ["react", "tutorial", "frontend"],
    "visibility": "public",
    "status": "approved",
    "viewCount": 0,
    "downloadCount": 0,
    "averageRating": 0,
    "totalRatings": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**File Type Restrictions:**
- **Images**: JPEG, PNG, GIF, WebP
- **Videos**: MP4, AVI, MOV, WMV, FLV
- **Documents**: PDF, DOC, DOCX, TXT
- **Audio**: MP3, WAV, OGG
- **Presentations**: PPT, PPTX

**File Size Limit:** 100MB

---

### 2. Get Classroom Media
**GET** `/`

Retrieve media files with filtering, search, and pagination.

**Query Parameters:**
```javascript
{
  classroomId: ObjectId,     // Optional: Filter by classroom
  courseId: ObjectId,        // Optional: Filter by course
  batchId: ObjectId,         // Optional: Filter by batch
  mediaType: String,         // Optional: 'all', 'image', 'video', 'document', 'audio', 'presentation'
  category: String,          // Optional: Filter by category
  search: String,            // Optional: Text search in title, description, tags
  page: Number,              // Optional: Page number (default: 1)
  limit: Number,             // Optional: Items per page (default: 20)
  sortBy: String,            // Optional: Sort field (default: 'createdAt')
  sortOrder: String          // Optional: 'asc' or 'desc' (default: 'desc')
}
```

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "React Tutorial",
      "description": "Introduction to React JS",
      "mediaType": "video",
      "fileUrl": "/uploads/classroom-media/1234567890-abc123.mp4",
      "thumbnailUrl": "/uploads/classroom-media/thumbnails/1234567890-abc123.jpg",
      "fileName": "1234567890-abc123.mp4",
      "originalFileName": "react-tutorial.mp4",
      "fileSize": 15728640,
      "formattedFileSize": "15.0 MB",
      "duration": 2700,
      "formattedDuration": "45:00",
      "dimensions": {
        "width": 1920,
        "height": 1080
      },
      "uploadedBy": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "uploadedByName": "John Doe",
      "uploadedByRole": "teacher",
      "classroomId": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
        "name": "Classroom A"
      },
      "courseId": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
        "name": "Web Development"
      },
      "batchId": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
        "name": "Batch 2024"
      },
      "centerId": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b8",
        "name": "Main Center"
      },
      "category": "lecture",
      "tags": ["react", "tutorial", "frontend"],
      "visibility": "public",
      "status": "approved",
      "viewCount": 25,
      "downloadCount": 8,
      "averageRating": 4.5,
      "totalRatings": 12,
      "comments": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b9",
          "user": {
            "_id": "60f7b3b3b3b3b3b3b3b3b3ba",
            "name": "Jane Smith",
            "email": "jane@example.com",
            "role": "student"
          },
          "userName": "Jane Smith",
          "userRole": "student",
          "comment": "Great tutorial! Very helpful.",
          "createdAt": "2024-01-15T11:00:00.000Z"
        }
      ],
      "ratings": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3bb",
          "user": "60f7b3b3b3b3b3b3b3b3b3ba",
          "rating": 5,
          "review": "Excellent content",
          "createdAt": "2024-01-15T11:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### 3. Get Single Media Item
**GET** `/:id`

Retrieve a specific media item by ID. Automatically increments view count.

**Response:**
```javascript
{
  "success": true,
  "data": {
    // Same structure as above with full details
  }
}
```

---

### 4. Update Media
**PUT** `/:id`

Update media metadata (only uploader or admin can update).

**Request Body:**
```javascript
{
  title: String,             // Optional: New title
  description: String,       // Optional: New description
  category: String,          // Optional: New category
  tags: String,              // Optional: Comma-separated tags
  visibility: String         // Optional: New visibility
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Media updated successfully",
  "data": {
    // Updated media object
  }
}
```

---

### 5. Delete Media
**DELETE** `/:id`

Soft delete a media item (only uploader or admin can delete).

**Response:**
```javascript
{
  "success": true,
  "message": "Media deleted successfully"
}
```

---

### 6. Add Comment
**POST** `/:id/comments`

Add a comment to a media item.

**Request Body:**
```javascript
{
  comment: String            // Required: Comment text
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Comment added successfully"
}
```

---

### 7. Add Rating
**POST** `/:id/ratings`

Add or update a rating for a media item.

**Request Body:**
```javascript
{
  rating: Number,            // Required: Rating (1-5)
  review: String             // Optional: Review text
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Rating added successfully"
}
```

---

### 8. Download Media
**GET** `/:id/download`

Download a media file. Automatically increments download count.

**Response:** File download

---

### 9. Get Media Statistics
**GET** `/statistics/overview`

Get comprehensive statistics for media files.

**Query Parameters:**
```javascript
{
  classroomId: ObjectId,     // Optional: Filter by classroom
  courseId: ObjectId,        // Optional: Filter by course
  batchId: ObjectId          // Optional: Filter by batch
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "byType": [
      {
        "_id": "image",
        "count": 45,
        "totalSize": 157286400,
        "totalViews": 1250,
        "totalDownloads": 320,
        "averageRating": 4.2
      },
      {
        "_id": "video",
        "count": 23,
        "totalSize": 5242880000,
        "totalViews": 890,
        "totalDownloads": 156,
        "averageRating": 4.5
      },
      {
        "_id": "document",
        "count": 67,
        "totalSize": 31457280,
        "totalViews": 2100,
        "totalDownloads": 890,
        "averageRating": 4.1
      }
    ],
    "total": {
      "totalFiles": 135,
      "totalSize": 5412864000,
      "totalViews": 4240,
      "totalDownloads": 1366,
      "averageRating": 4.3
    }
  }
}
```

---

## Error Responses

### 400 Bad Request
```javascript
{
  "success": false,
  "message": "Missing required fields"
}
```

### 401 Unauthorized
```javascript
{
  "success": false,
  "message": "User not authenticated"
}
```

### 403 Forbidden
```javascript
{
  "success": false,
  "message": "Permission denied"
}
```

### 404 Not Found
```javascript
{
  "success": false,
  "message": "Media not found"
}
```

### 500 Internal Server Error
```javascript
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Usage Examples

### Frontend Integration

```javascript
// Upload media
const uploadMedia = async (formData) => {
  const response = await fetch('/college/classroom-media/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};

// Get media with filters
const getMedia = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/college/classroom-media?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Add comment
const addComment = async (mediaId, comment) => {
  const response = await fetch(`/college/classroom-media/${mediaId}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ comment })
  });
  return response.json();
};

// Download media
const downloadMedia = async (mediaId) => {
  const response = await fetch(`/college/classroom-media/${mediaId}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filename.ext';
    a.click();
    window.URL.revokeObjectURL(url);
  }
};
```

---

## Database Schema

The Classroom Media system uses MongoDB with the following schema:

### ClassroomMedia Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  mediaType: String, // 'image', 'video', 'document', 'audio', 'presentation'
  fileUrl: String,
  thumbnailUrl: String,
  fileName: String,
  originalFileName: String,
  fileSize: Number,
  fileExtension: String,
  mimeType: String,
  duration: Number, // for videos/audio
  dimensions: {
    width: Number,
    height: Number
  },
  classroomId: ObjectId,
  courseId: ObjectId,
  batchId: ObjectId,
  centerId: ObjectId,
  uploadedBy: ObjectId,
  uploadedByRole: String,
  uploadedByName: String,
  sessionId: ObjectId,
  sessionDate: Date,
  category: String,
  tags: [String],
  visibility: String,
  allowedRoles: [String],
  allowedUsers: [ObjectId],
  status: String,
  approvedBy: ObjectId,
  approvedAt: Date,
  rejectionReason: String,
  viewCount: Number,
  downloadCount: Number,
  lastViewed: Date,
  lastDownloaded: Date,
  comments: [{
    user: ObjectId,
    userName: String,
    userRole: String,
    comment: String,
    createdAt: Date,
    isEdited: Boolean,
    editedAt: Date
  }],
  ratings: [{
    user: ObjectId,
    rating: Number,
    review: String,
    createdAt: Date
  }],
  averageRating: Number,
  totalRatings: Number,
  metadata: Map,
  version: Number,
  previousVersions: [{
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    uploadedAt: Date,
    uploadedBy: ObjectId
  }],
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Users can only modify their own uploads (except admins)
3. **File Validation**: Strict file type and size validation
4. **Input Sanitization**: All user inputs are validated and sanitized
5. **Soft Delete**: Files are not permanently deleted, only marked as deleted
6. **Access Control**: Visibility settings control who can view media
7. **Rate Limiting**: Consider implementing rate limiting for uploads

---

## Performance Optimizations

1. **Indexing**: Database indexes on frequently queried fields
2. **Pagination**: Large result sets are paginated
3. **File Compression**: Consider implementing file compression
4. **CDN Integration**: For production, consider using CDN for file storage
5. **Caching**: Implement caching for frequently accessed media
6. **Thumbnail Generation**: Automatic thumbnail generation for images/videos

---

## Future Enhancements

1. **Video Streaming**: Implement video streaming for large files
2. **File Versioning**: Enhanced version control system
3. **Bulk Operations**: Bulk upload, download, and delete
4. **Advanced Search**: Full-text search with filters
5. **Analytics Dashboard**: Detailed usage analytics
6. **Integration**: Integration with LMS and other educational tools
7. **Mobile Optimization**: Mobile-specific optimizations
8. **Offline Support**: Offline media access capabilities 