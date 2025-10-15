import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AddCourseContent() {
    // State Management
    const [curriculum, setCurriculum] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [loading, setLoading] = useState(false);
    const [expandedChapters, setExpandedChapters] = useState([]);
    const [expandedTopics, setExpandedTopics] = useState([]);
    
    // Media Upload Modal States
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [mediaFiles, setMediaFiles] = useState({
        videos: [],
        images: [],
        pdfs: []
    });
    const [uploadingFiles, setUploadingFiles] = useState(false);

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const token = JSON.parse(sessionStorage.getItem('token'));

    // Fetch Courses
    useEffect(() => {
        fetchCourses();
    }, []);

    // Fetch Batches when course is selected
    useEffect(() => {
        if (selectedCourse) {
            fetchBatches(selectedCourse);
        } else {
            setBatches([]);
        }
    }, [selectedCourse]);

    // Fetch Curriculum when both course and batch are selected
    useEffect(() => {
        if (selectedCourse && selectedBatch) {
            fetchCurriculum();
        }
    }, [selectedCourse, selectedBatch]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/college/gettrainersbycourse`, {
                headers: { 'x-auth': token }
            });

            if (response.data && response.data.status && response.data.data) {
                const allCourses = [];
                response.data.data.forEach(trainer => {
                    if (trainer.assignedCourses && trainer.assignedCourses.length > 0) {
                        trainer.assignedCourses.forEach(course => {
                            if (!allCourses.find(c => c._id === course._id)) {
                                allCourses.push(course);
                            }
                        });
                    }
                });
                setCourses(allCourses);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            alert('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    const fetchBatches = async (courseId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/college/getbatchesbytrainerandcourse`, {
                params: { courseId },
                headers: { 'x-auth': token }
            });

            if (response.data && response.data.status && response.data.data) {
                setBatches(response.data.data.batches || []);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
            alert('Failed to fetch batches');
        } finally {
            setLoading(false);
        }
    };

    const fetchCurriculum = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/college/getCurriculum`, {
                params: { 
                    courseId: selectedCourse, 
                    batchId: selectedBatch 
                },
                headers: { 'x-auth': token }
            });
            
            if (response.data.status) {
                const curriculumData = response.data.data;
                if (curriculumData && curriculumData.chapters) {
                    const formattedCurriculum = curriculumData.chapters.map(chapter => ({
                        id: Date.now() + Math.random(), 
                        chapterNumber: chapter.chapterNumber,
                        chapterTitle: chapter.chapterTitle,
                        description: chapter.description,
                        duration: chapter.duration,
                        objectives: chapter.objectives,
                        media: chapter.media || { videos: [], images: [], pdfs: [] },
                        topics: chapter.topics.map(topic => ({
                            id: Date.now() + Math.random(),
                            topicNumber: topic.topicNumber,
                            topicTitle: topic.topicTitle,
                            description: topic.description,
                            duration: topic.duration,
                            resources: topic.resources,
                            media: topic.media || { videos: [], images: [], pdfs: [] },
                            subTopics: topic.subTopics.map(subTopic => ({
                                id: Date.now() + Math.random(),
                                subTopicTitle: subTopic.subTopicTitle,
                                description: subTopic.description,
                                duration: subTopic.duration,
                                content: subTopic.content,
                                media: subTopic.media || { videos: [], images: [], pdfs: [] }
                            }))
                        }))
                    }));
                    setCurriculum(formattedCurriculum);
                } else {
                    setCurriculum([]);
                }
            } else {
                setCurriculum([]);
            }
        } catch (error) {
            console.error('Error fetching curriculum:', error);
            alert('Failed to fetch curriculum');
            setCurriculum([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleChapter = (chapterId) => {
        setExpandedChapters(prev =>
            prev.includes(chapterId)
                ? prev.filter(id => id !== chapterId)
                : [...prev, chapterId]
        );
    };

    const toggleTopic = (topicId) => {
        setExpandedTopics(prev =>
            prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId]
        );
    };

    const openMediaModal = (item) => {
        setSelectedItem(item);
        setMediaFiles({
            videos: [],
            images: [],
            pdfs: []
        });
        setShowMediaModal(true);
    };

    const handleFileSelect = (e, fileType) => {
        const files = Array.from(e.target.files);
        setMediaFiles(prev => ({
            ...prev,
            [fileType]: [...prev[fileType], ...files]
        }));
    };

    const removeSelectedFile = (fileType, index) => {
        setMediaFiles(prev => ({
            ...prev,
            [fileType]: prev[fileType].filter((_, i) => i !== index)
        }));
    };

const handleUploadMedia = async () => {
    setLoading(true)
    try{
        const response = await axios.post(`${backendUrl}/college/addcoursecontent`, {
            courseId: selectedCourse,
            batchId: selectedBatch,
            content: curriculum,
            files: mediaFiles
        }, {
            headers: { 'x-auth': token }
        })
    }
    catch(err){
        console.log('Error uploading media' , err)
    }finally{
        setLoading(false)
    }
}

    return (
        <div className="curriculum-container">
            {/* Header */}
            <div className="curriculum-header">
                <div className="header-left">
                    <h2 className="page-title">
                        <i className="fas fa-photo-video me-2"></i>
                        Add Course Media & Content
                    </h2>
                    <p className="page-subtitle">Upload videos, images, and PDFs to chapters, topics, and sub-topics</p>
                </div>
            </div>

            {/* Course & Batch Selection */}
            <div className="selection-bar">
                <div className="selection-group">
                    <label>Select Course *</label>
                    <select
                        className="form-control"
                        value={selectedCourse}
                        onChange={(e) => {
                            setSelectedCourse(e.target.value);
                            setSelectedBatch('');
                            setCurriculum([]);
                        }}
                        disabled={loading || courses.length === 0}
                    >
                        <option value="">
                            {loading ? 'Loading courses...' : courses.length === 0 ? 'No courses available' : 'Select Course'}
                        </option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>
                                {course.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="selection-group">
                    <label>Select Batch *</label>
                    <select
                        className="form-control"
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        disabled={!selectedCourse || batches.length === 0}
                    >
                        <option value="">
                            {!selectedCourse ? 'Select Course First' : batches.length === 0 ? 'No Batches Available' : 'Select Batch'}
                        </option>
                        {batches.map(batch => (
                            <option key={batch._id} value={batch._id}>
                                {batch.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Curriculum Content */}
            {selectedCourse && selectedBatch && (
                <div className="curriculum-content">
                    <div className="table-of-contents">
                        <div className="toc-header">
                            <h3>
                                <i className="fas fa-table me-2"></i>
                                Course Curriculum - Add Media
                            </h3>
                            <p className="text-muted">Click on "Upload Media" button to add videos, images, and PDFs to any item</p>
                        </div>

                        {curriculum.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-book-open"></i>
                                <h4>No Curriculum Found</h4>
                                <p>Please add curriculum first from the Timetable page</p>
                            </div>
                        ) : (
                            <div className="chapters-list">
                                {curriculum.map((chapter) => (
                                    <div key={chapter.id} className="chapter-item">
                                        <div className="chapter-header">
                                            <div className="chapter-left" onClick={() => toggleChapter(chapter.id)}>
                                                <button className="expand-btn">
                                                    <i className={`fas fa-chevron-${expandedChapters.includes(chapter.id) ? 'down' : 'right'}`}></i>
                                                </button>
                                                <div className="chapter-number">
                                                    Chapter {chapter.chapterNumber}
                                                </div>
                                                <div className="chapter-title">
                                                    {chapter.chapterTitle}
                                                </div>
                                            </div>
                                            <div className="chapter-actions">
                                                <span className="media-badge">
                                                    <i className="fas fa-video"></i> {chapter.media?.videos?.length || 0}
                                                    <i className="fas fa-image ml-2"></i> {chapter.media?.images?.length || 0}
                                                    <i className="fas fa-file-pdf ml-2"></i> {chapter.media?.pdfs?.length || 0}
                                                </span>

                                            </div>
                                        </div>

                                        {expandedChapters.includes(chapter.id) && (
                                            <div className="chapter-content">
                                                {chapter.description && (
                                                    <div className="chapter-description">
                                                        {chapter.description}
                                                    </div>
                                                )}

                                                {/* Show Uploaded Media */}
                                                {(chapter.media?.videos?.length > 0 || chapter.media?.images?.length > 0 || chapter.media?.pdfs?.length > 0) && (
                                                    <div className="media-preview-section">
                                                        <h5>Uploaded Media:</h5>
                                                        <div className="media-grid">
                                                            {chapter.media.videos?.map((video, idx) => (
                                                                <div key={idx} className="media-item">
                                                                    <i className="fas fa-video"></i>
                                                                    <span>{video.name || `Video ${idx + 1}`}</span>
                                                                </div>
                                                            ))}
                                                            {chapter.media.images?.map((image, idx) => (
                                                                <div key={idx} className="media-item">
                                                                    <i className="fas fa-image"></i>
                                                                    <span>{image.name || `Image ${idx + 1}`}</span>
                                                                </div>
                                                            ))}
                                                            {chapter.media.pdfs?.map((pdf, idx) => (
                                                                <div key={idx} className="media-item">
                                                                    <i className="fas fa-file-pdf"></i>
                                                                    <span>{pdf.name || `PDF ${idx + 1}`}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {chapter.topics && chapter.topics.length > 0 ? (
                                                    <div className="topics-list">
                                                        {chapter.topics.map((topic) => (
                                                            <div key={topic.id} className="topic-item">
                                                                <div className="topic-header">
                                                                    <div className="topic-left" onClick={() => toggleTopic(topic.id)}>
                                                                        <button className="expand-btn">
                                                                            <i className={`fas fa-chevron-${expandedTopics.includes(topic.id) ? 'down' : 'right'}`}></i>
                                                                        </button>
                                                                        <div className="topic-number">
                                                                            {topic.topicNumber}
                                                                        </div>
                                                                        <div className="topic-title">
                                                                            {topic.topicTitle}
                                                                        </div>
                                                                    </div>
                                                                    <div className="topic-actions">
                                                                        <span className="media-badge small">
                                                                            <i className="fas fa-video"></i> {topic.media?.videos?.length || 0}
                                                                            <i className="fas fa-image ml-1"></i> {topic.media?.images?.length || 0}
                                                                            <i className="fas fa-file-pdf ml-1"></i> {topic.media?.pdfs?.length || 0}
                                                                        </span>
                                                                        <button
                                                                            className="btn-action btn-upload small"
                                                                            onClick={() => openMediaModal({ 
                                                                                type: 'topic', 
                                                                                data: topic,
                                                                                chapterNumber: chapter.chapterNumber 
                                                                            })}
                                                                            title="Upload Media"
                                                                        >
                                                                            <i className="fas fa-upload"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {expandedTopics.includes(topic.id) && (
                                                                    <div className="topic-content">
                                                                        {topic.description && (
                                                                            <div className="topic-description">
                                                                                {topic.description}
                                                                            </div>
                                                                        )}

                                                                        {/* Show Uploaded Media */}
                                                                        {(topic.media?.videos?.length > 0 || topic.media?.images?.length > 0 || topic.media?.pdfs?.length > 0) && (
                                                                            <div className="media-preview-section">
                                                                                <h6>Uploaded Media:</h6>
                                                                                <div className="media-grid">
                                                                                    {topic.media.videos?.map((video, idx) => (
                                                                                        <div key={idx} className="media-item small">
                                                                                            <i className="fas fa-video"></i>
                                                                                            <span>{video.name || `Video ${idx + 1}`}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                    {topic.media.images?.map((image, idx) => (
                                                                                        <div key={idx} className="media-item small">
                                                                                            <i className="fas fa-image"></i>
                                                                                            <span>{image.name || `Image ${idx + 1}`}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                    {topic.media.pdfs?.map((pdf, idx) => (
                                                                                        <div key={idx} className="media-item small">
                                                                                            <i className="fas fa-file-pdf"></i>
                                                                                            <span>{pdf.name || `PDF ${idx + 1}`}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                       
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="empty-topics">
                                                        <p>No topics found</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Media Upload Modal */}
            {showMediaModal && selectedItem && (
                <div className="modal-overlay" onClick={() => setShowMediaModal(false)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-upload me-2"></i>
                                Upload Media to {selectedItem.type === 'chapter' ? 'Chapter' : selectedItem.type === 'topic' ? 'Topic' : 'Sub-topic'}
                            </h3>
                            <button className="btn-close" onClick={() => setShowMediaModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="upload-info-box">
                                <strong>Uploading to:</strong> {selectedItem.data.chapterTitle || selectedItem.data.topicTitle || selectedItem.data.subTopicTitle}
                            </div>

                            {/* Video Upload */}
                            <div className="upload-section">
                                <h4>
                                    <i className="fas fa-video me-2"></i>
                                    Videos
                                </h4>
                                <input
                                    type="file"
                                    accept="video/*"
                                    multiple
                                    onChange={(e) => handleFileSelect(e, 'videos')}
                                    className="file-input"
                                />
                                {mediaFiles.videos.length > 0 && (
                                    <div className="selected-files">
                                        <p className="selected-count">{mediaFiles.videos.length} video(s) selected:</p>
                                        {mediaFiles.videos.map((file, idx) => (
                                            <div key={idx} className="file-item">
                                                <span><i className="fas fa-video"></i> {file.name}</span>
                                                <button 
                                                    className="btn-remove-file"
                                                    onClick={() => removeSelectedFile('videos', idx)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Image Upload */}
                            <div className="upload-section">
                                <h4>
                                    <i className="fas fa-image me-2"></i>
                                    Images
                                </h4>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleFileSelect(e, 'images')}
                                    className="file-input"
                                />
                                {mediaFiles.images.length > 0 && (
                                    <div className="selected-files">
                                        <p className="selected-count">{mediaFiles.images.length} image(s) selected:</p>
                                        {mediaFiles.images.map((file, idx) => (
                                            <div key={idx} className="file-item">
                                                <span><i className="fas fa-image"></i> {file.name}</span>
                                                <button 
                                                    className="btn-remove-file"
                                                    onClick={() => removeSelectedFile('images', idx)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* PDF Upload */}
                            <div className="upload-section">
                                <h4>
                                    <i className="fas fa-file-pdf me-2"></i>
                                    PDFs
                                </h4>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    multiple
                                    onChange={(e) => handleFileSelect(e, 'pdfs')}
                                    className="file-input"
                                />
                                {mediaFiles.pdfs.length > 0 && (
                                    <div className="selected-files">
                                        <p className="selected-count">{mediaFiles.pdfs.length} PDF(s) selected:</p>
                                        {mediaFiles.pdfs.map((file, idx) => (
                                            <div key={idx} className="file-item">
                                                <span><i className="fas fa-file-pdf"></i> {file.name}</span>
                                                <button 
                                                    className="btn-remove-file"
                                                    onClick={() => removeSelectedFile('pdfs', idx)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-outline" 
                                onClick={() => setShowMediaModal(false)}
                                disabled={uploadingFiles}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleUploadMedia}
                                disabled={uploadingFiles}
                            >
                                {uploadingFiles ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin me-2"></i>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-upload me-2"></i>
                                        Upload Media
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .curriculum-container {
                    padding: 2rem;
                    background: #f5f7fa;
                    min-height: 100vh;
                }

                .curriculum-header {
                    margin-bottom: 2rem;
                }

                .page-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 0.5rem;
                }

                .page-subtitle {
                    color: #7f8c8d;
                    font-size: 1rem;
                }

                .selection-bar {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    display: flex;
                    gap: 1.5rem;
                    align-items: flex-end;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    flex-wrap: wrap;
                }

                .selection-group {
                    flex: 1;
                    min-width: 250px;
                    display: flex;
                    flex-direction: column;
                }

                .selection-group label {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 0.5rem;
                }

                .curriculum-content {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    overflow: hidden;
                }

                .table-of-contents {
                    padding: 2rem;
                }

                .toc-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 3px solid #f5f7fa;
                }

                .toc-header h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin: 0 0 0.5rem 0;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: #7f8c8d;
                }

                .empty-state i {
                    font-size: 4rem;
                    color: #e0e0e0;
                    margin-bottom: 1rem;
                }

                .empty-state h4 {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                    color: #95a5a6;
                }

                .chapters-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .chapter-item {
                    border: 2px solid #e3f2fd;
                    border-radius: 12px;
                    overflow: hidden;
                    transition: all 0.3s;
                }

                .chapter-item:hover {
                    border-color: #2196f3;
                    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.1);
                }

                .chapter-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1.25rem 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                }

                .chapter-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex: 1;
                }

                .expand-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    color: white;
                }

                .expand-btn:hover {
                    background: rgba(255,255,255,0.3);
                }

                .chapter-number {
                    background: rgba(255,255,255,0.2);
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 0.9rem;
                }

                .chapter-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                }

                .chapter-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .media-badge {
                    background: rgba(255,255,255,0.2);
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .media-badge.small {
                    padding: 0.4rem 0.8rem;
                    font-size: 0.75rem;
                }

                .media-badge i {
                    margin-right: 0.25rem;
                }

                .ml-1 {
                    margin-left: 0.5rem;
                }

                .ml-2 {
                    margin-left: 1rem;
                }

                .btn-action {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    color: white;
                }

                .btn-action.small {
                    width: 30px;
                    height: 30px;
                }

                .btn-action:hover {
                    background: rgba(255,255,255,0.3);
                    transform: scale(1.1);
                }

                .btn-action.btn-upload:hover {
                    background: #4caf50;
                }

                .chapter-content {
                    padding: 1.5rem;
                    background: #fafbfc;
                }

                .chapter-description {
                    padding: 1rem;
                    background: #e3f2fd;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    color: #1565c0;
                    font-style: italic;
                }

                .media-preview-section {
                    background: #f9fafb;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .media-preview-section.small {
                    padding: 0.75rem;
                }

                .media-preview-section h5, .media-preview-section h6 {
                    margin: 0 0 0.75rem 0;
                    color: #2c3e50;
                    font-weight: 600;
                }

                .media-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 0.75rem;
                }

                .media-item {
                    background: white;
                    padding: 0.75rem;
                    border-radius: 6px;
                    border: 1px solid #e0e0e0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .media-item.small {
                    padding: 0.5rem;
                    font-size: 0.85rem;
                }

                .media-item i {
                    color: #3498db;
                }

                .media-item span {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .topics-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .topic-item {
                    border: 2px solid #e8f5e9;
                    border-radius: 8px;
                    overflow: hidden;
                    background: white;
                }

                .topic-header {
                    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                    color: white;
                    padding: 1rem 1.25rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                }

                .topic-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex: 1;
                }

                .topic-number {
                    background: rgba(255,255,255,0.2);
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 0.85rem;
                }

                .topic-title {
                    font-size: 1.05rem;
                    font-weight: 600;
                }

                .topic-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .topic-content {
                    padding: 1.25rem;
                    background: #f9fafb;
                }

                .topic-description {
                    padding: 0.75rem;
                    background: #e8f5e9;
                    border-radius: 6px;
                    margin-bottom: 1rem;
                    color: #2e7d32;
                    font-style: italic;
                    font-size: 0.95rem;
                }

                .subtopics-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .subtopic-item {
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    overflow: hidden;
                    background: white;
                }

                .subtopic-header {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    padding: 0.75rem 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .subtopic-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex: 1;
                }

                .subtopic-bullet {
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .subtopic-title {
                    font-size: 0.95rem;
                    font-weight: 600;
                }

                .subtopic-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .empty-topics, .empty-subtopics {
                    padding: 2rem;
                    text-align: center;
                    color: #95a5a6;
                    font-style: italic;
                }

                .btn {
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: inline-flex;
                    align-items: center;
                }

                .btn-primary {
                    background: #3498db;
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #2980b9;
                    transform: translateY(-2px);
                }

                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-outline {
                    background: white;
                    color: #3498db;
                    border: 2px solid #3498db;
                }

                .btn-outline:hover:not(:disabled) {
                    background: #3498db;
                    color: white;
                }

                .btn-outline:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .form-control {
                    padding: 0.75rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.3s;
                    width: 100%;
                }

                .form-control:focus {
                    outline: none;
                    border-color: #3498db;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }

                .modal-large {
                    max-width: 700px;
                }

                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 2px solid #f5f7fa;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 1.5rem;
                }

                .btn-close {
                    background: transparent;
                    border: none;
                    font-size: 2rem;
                    cursor: pointer;
                    color: #95a5a6;
                    line-height: 1;
                    transition: all 0.3s;
                }

                .btn-close:hover {
                    color: #e74c3c;
                    transform: rotate(90deg);
                }

                .modal-body {
                    padding: 1.5rem;
                }

                .modal-footer {
                    padding: 1.5rem;
                    border-top: 2px solid #f5f7fa;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .upload-info-box {
                    background: #e3f2fd;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    color: #1565c0;
                }

                .upload-section {
                    margin-bottom: 2rem;
                }

                .upload-section h4 {
                    color: #2c3e50;
                    font-size: 1.1rem;
                    margin-bottom: 1rem;
                }

                .file-input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px dashed #3498db;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .file-input:hover {
                    border-color: #2980b9;
                    background: #f8f9fa;
                }

                .selected-files {
                    margin-top: 1rem;
                    background: #f9fafb;
                    padding: 1rem;
                    border-radius: 8px;
                }

                .selected-count {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 0.75rem;
                }

                .file-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem;
                    background: white;
                    border-radius: 6px;
                    margin-bottom: 0.5rem;
                    border: 1px solid #e0e0e0;
                }

                .file-item span {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .file-item i {
                    color: #3498db;
                }

                .btn-remove-file {
                    background: #e74c3c;
                    color: white;
                    border: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                }

                .btn-remove-file:hover {
                    background: #c0392b;
                    transform: scale(1.1);
                }

                .me-2 {
                    margin-right: 0.5rem;
                }

                .text-muted {
                    color: #7f8c8d;
                }

                @media (max-width: 768px) {
                    .curriculum-container {
                        padding: 1rem;
                    }

                    .selection-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .chapter-header, .topic-header, .subtopic-header {
                        flex-direction: column;
                        gap: 1rem;
                        align-items: stretch;
                    }

                    .chapter-left, .topic-left, .subtopic-left {
                        flex-wrap: wrap;
                    }

                    .chapter-actions, .topic-actions, .subtopic-actions {
                        justify-content: flex-end;
                    }

                    .media-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default AddCourseContent;