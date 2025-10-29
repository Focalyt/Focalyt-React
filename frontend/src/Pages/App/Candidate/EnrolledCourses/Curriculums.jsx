import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import { 
  Award, Calendar, CheckCircle2, Circle, Download, Play, 
  Settings, Maximize, Volume2, SkipBack, FileText, Clock, 
  User, CheckCircle, XCircle, AlertCircle, BookOpen, 
  Video, Film, FileVideo
} from 'lucide-react';

import Assignment from '../Assignment/Assignment';

function Enrolled() {
    const { courseId } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attendanceFilter, setAttendanceFilter] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
    const [curriculum, setCurriculum] = useState([]);
    const [expandedChapters, setExpandedChapters] = useState([]);
    const [expandedTopics, setExpandedTopics] = useState([]);
    
    // Media Viewer Modal States
    const [showMediaViewer, setShowMediaViewer] = useState(false);
    const [viewerMedia, setViewerMedia] = useState(null);
    
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);
    const getFullUrl = (filePath) => {
        if (!filePath) return "";
        // Already contains full bucket URL
        if (filePath.startsWith(bucketUrl)) return filePath;
        // Is relative path, so prepend bucket URL
        return `${bucketUrl}/${filePath}`;
      };
    const fetchCourseDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching course details for courseId:', courseId);
            
            // Fetch course details from applied courses
            const response = await axios.get(`${backendUrl}/candidate/appliedCourses`, {
                headers: {
                    'x-auth': localStorage.getItem('token')
                }
            });
            
            // Find the course with matching courseId
            const appliedCourses = response.data?.courses || [];
            // Be defensive: compare as strings to handle ObjectId vs string mismatch
            const appliedCourse = appliedCourses.find(ac => String(ac._course?._id) === String(courseId));
            
            if (appliedCourse && appliedCourse._course) {
                const courseData = appliedCourse._course;
                console.log('Course data received:', courseData);
                setCourse(courseData);
            } else {
                console.warn('Course not found in applied courses');
                setError("Course not found. Please try again.");
            }
        } catch (err) {
            console.error("Error fetching course details:", err);
            setError("Failed to load course details. Please try again.");
        } finally {
            setLoading(false);
        }
    };
useEffect(() => {
    fetchCurriculum();
}, [courseId]);

const fetchCurriculum = async () => {
    try {
        const response = await axios.get(`${backendUrl}/candidate/curriculum/${courseId}`, {
            headers: {
                'x-auth': localStorage.getItem('token')
            }
        });
        // console.log("response data", response);
        if (response.data && response.data.length > 0) {
            const curriculumData = response.data[0];
            const chapters = curriculumData.chapters || [];
            const processedChapters = chapters.map((chapter, idx) => ({
                ...chapter,
                id: chapter._id || `chapter-${idx}`,
                topics: (chapter.topics || []).map((topic, topicIdx) => ({
                    ...topic,
                    id: topic._id || `topic-${idx}-${topicIdx}`,
                    subTopics: (topic.subTopics || []).map((subTopic, subTopicIdx) => ({
                        ...subTopic,
                        id: subTopic._id || `subtopic-${idx}-${topicIdx}-${subTopicIdx}`
                    }))
                }))
            }));
            
            setCurriculum(processedChapters);
            console.log("Curriculum set:", processedChapters);
        } else {
            setCurriculum([]);
        }
    } catch (err) {
        console.log("Error Fetching Curriculum", err);
        setCurriculum([]);
    }
}

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

    // Media Viewer Functions
    const openMediaViewer = (media, type) => {
        setViewerMedia({ ...media, type });
        setShowMediaViewer(true);
    };

    const closeMediaViewer = () => {
        setShowMediaViewer(false);
        setViewerMedia(null);
    };

    const getChapterMediaCount = (chapter) => {
        let totalVideos = 0;
        let totalImages = 0;
        let totalPdfs = 0;

        if (chapter.media) {
            totalVideos += chapter.media.videos?.length || 0;
            totalImages += chapter.media.images?.length || 0;
            totalPdfs += chapter.media.pdfs?.length || 0;
        }

        if (chapter.topics && chapter.topics.length > 0) {
            chapter.topics.forEach(topic => {
                if (topic.media) {
                    totalVideos += topic.media.videos?.length || 0;
                    totalImages += topic.media.images?.length || 0;
                    totalPdfs += topic.media.pdfs?.length || 0;
                }

                if (topic.subTopics && topic.subTopics.length > 0) {
                    topic.subTopics.forEach(subTopic => {
                        if (subTopic.media) {
                            totalVideos += subTopic.media.videos?.length || 0;
                            totalImages += subTopic.media.images?.length || 0;
                            totalPdfs += subTopic.media.pdfs?.length || 0;
                        }
                    });
                }
            });
        }

        return { videos: totalVideos, images: totalImages, pdfs: totalPdfs };
    };

    const tabs = [
        { id: 'overview', label: 'Curriculum' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'assignment', label: 'Assignment' },

    ];

    // Demo Attendance Data
    const attendanceData = [
        { id: 1, date: '2024-01-15', status: 'present'},
        { id: 2, date: '2024-01-18', status: 'present'},
        { id: 3, date: '2024-01-20', status: 'absent'},
        { id: 4, date: '2024-01-22', status: 'present'},
        { id: 5, date: '2024-01-25', status: 'present'},
        { id: 6, date: '2024-01-28', status: 'absent'},
        { id: 7, date: '2024-01-30', status: 'present'},
        { id: 8, date: '2024-02-02', status: 'present'},
        { id: 9, date: '2024-02-05', status: 'present'},
        { id: 10, date: '2024-02-08', status: 'present'},
    ];

    // Filter attendance data
    const filteredAttendance = attendanceData.filter(item => {
        if (attendanceFilter === 'all') return true;
        return item.status === attendanceFilter;
    });

    // Calculate statistics
    const totalSessions = attendanceData.length;
    const presentCount = attendanceData.filter(item => item.status === 'present').length;
    const absentCount = attendanceData.filter(item => item.status === 'absent').length;
    const attendancePercentage = Math.round((presentCount / totalSessions) * 100);

    if (loading) {
        return (
            <div className="container mt-3">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-3">Loading course details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-3">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container mt-3">
                <div className="alert alert-warning" role="alert">
                    Course not found.
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-3">
            
            <div className="row" style={{alignItems: 'flex-start', height: 'calc(100vh - 100px)'}}>
                <div className="col-lg-8 custom-scrollbar" style={{
                    height: '100%',
                    overflowY: 'auto',
                    paddingRight: '10px',
                    scrollBehavior: 'smooth'
                }}>
                    <h1 className="h2 fw-bold mb-4">{course.name || 'Course Name'}</h1>

                    <div className="row mb-4">
                        <div className="col-md-5">
                            <div className="position-relative rounded overflow-hidden" >
                                <img
                                    src={course.thumbnail ? getFullUrl(course.thumbnail) : "/Assets/public_assets/images/newjoblisting/course_img.svg"}
                                    alt={course.name || 'Course'}
                                    className="w-100 h-100 object-fit-cover"
                                    style={{opacity: 0.9}}
                                />
                            </div>
                        </div>
                        <div className="col-md-7">
                            <div className="h-100 d-flex flex-column justify-content-center">
                                <div className="mb-3">
                                    <h3 className="fw-bold mb-1">{course.progress || 0}%</h3>
                                    <p className="text-muted small mb-2">{course.lessonsCompleted || 0} lessons completed</p>
                                    <div className="progress" style={{height: '8px'}}>
                                        <div 
                                            className="progress-bar bg-primary" 
                                            role="progressbar" 
                                            style={{width: `${course.progress || 0}%`}}
                                            aria-valuenow={course.progress || 0} 
                                            aria-valuemin="0" 
                                            aria-valuemax="100"
                                        ></div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-6">
                                        <h4 className="fw-bold mb-0">{course.duration || 'N/A'}</h4>
                                        <small className="text-muted">Course Duration</small>
                                    </div>
                                    <div className="col-6">
                                        <p className="fw-semibold mb-0">Last Updated</p>
                                        <small className="text-muted">{moment(course.updatedAt || course.createdAt).format('MMM DD, YYYY')}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ul className="nav nav-tabs mb-4">
                        {tabs.map(tab => (
                            <li className="nav-item" key={tab.id}>
                                <button 
                                    className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="tab-content">
                        {activeTab === 'overview' && (
                            <div className="tab-pane fade show active">
                                {/* Table of Contents */}
                                <div className="curriculum-toc">
                                    <div className="toc-header mb-4">
                                        <h5 className="fw-bold mb-2">
                                            <BookOpen size={20} className="me-2" style={{display: 'inline'}} />
                                            Course Curriculum
                                        </h5>
                                    </div>

                                    {curriculum.length === 0 ? (
                                        <div className="empty-state text-center py-5">
                                            <BookOpen size={48} className="text-muted mb-3" />
                                            <h6 className="text-muted">No Curriculum Available</h6>
                                            <p className="text-muted small">The course curriculum will be added soon</p>
                                        </div>
                                    ) : (
                                        <div className="chapters-list">
                                            {curriculum.map((chapter, chapterIndex) => (
                                                <div key={chapter.id} className="chapter-item mb-3">
                                                    <div 
                                                        className="chapter-header" 
                                                        onClick={() => toggleChapter(chapter.id)}
                                                    >
                                                        <div className="chapter-left">
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
                                                                <Video size={14} /> {getChapterMediaCount(chapter).videos}
                                                                <FileText size={14} className="ms-2" /> {getChapterMediaCount(chapter).pdfs}
                                                                <Film size={14} className="ms-2" /> {getChapterMediaCount(chapter).images}
                                                            </span>
                                                            <span className="duration-badge">
                                                                <Clock size={14} /> {chapter.duration}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {expandedChapters.includes(chapter.id) && (
                                                        <div className="chapter-content">
                                                        
                                                            {chapter.topics && chapter.topics.length > 0 ? (
                                                                <div className="topics-list">
                                                                    {chapter.topics.map((topic, topicIndex) => (
                                                                        <div key={topic.id} className="topic-item mb-2">
                                                                            <div 
                                                                                className="topic-header" 
                                                                                onClick={() => toggleTopic(topic.id)}
                                                                            >
                                                                                <div className="topic-left">
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
                                                                                        <Video size={12} /> {topic.media?.videos?.length || 0}
                                                                                        <FileText size={12} className="ms-1" /> {topic.media?.pdfs?.length || 0}
                                                                                        <Film size={12} className="ms-1" /> {topic.media?.images?.length || 0}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            {expandedTopics.includes(topic.id) && (
                                                                                <div className="topic-content">
                                                                                  
                                                                                    {(topic.media?.videos?.length > 0 || topic.media?.images?.length > 0 || topic.media?.pdfs?.length > 0) && (
                                                                                        <div className="media-preview-section">
                                                                                            <h6 className="fw-semibold mb-2">Learning Materials:</h6>
                                                                                            <div className="media-grid">
                                                                                                {topic.media.videos?.map((video, idx) => (
                                                                                                    <div key={idx} className="media-item small video-container">
                                                                                                        <video
                                                                                                            controls
                                                                                                            src={video.url}
                                                                                                            className="embedded-video"
                                                                                                            preload="metadata"
                                                                                                        >
                                                                                                            Your browser does not support the video tag.
                                                                                                        </video>
                                                                                                        <span className="video-name">{video.name || `Video ${idx + 1}`}</span>
                                                                                                    </div>
                                                                                                ))}
                                                                                                {topic.media.images?.map((image, idx) => (
                                                                                                    <div 
                                                                                                        key={idx} 
                                                                                                        className="media-item small image-container"
                                                                                                        onClick={() => openMediaViewer(image, 'image')}
                                                                                                        style={{ cursor: 'pointer' }}
                                                                                                        title="Click to view full image"
                                                                                                    >
                                                                                                        <img
                                                                                                            src={image.url}
                                                                                                            alt={image.name || `Image ${idx + 1}`}
                                                                                                            className="embedded-image"
                                                                                                            loading="lazy"
                                                                                                        />
                                                                                                        <span className="image-name">{image.name || `Image ${idx + 1}`}</span>
                                                                                                    </div>
                                                                                                ))}
                                                                                                {topic.media.pdfs?.map((pdf, idx) => (
                                                                                                    <div 
                                                                                                        key={idx} 
                                                                                                        className="media-item small pdf-container"
                                                                                                        onClick={() => openMediaViewer(pdf, 'pdf')}
                                                                                                        style={{ cursor: 'pointer' }}
                                                                                                        title="Click to view full PDF"
                                                                                                    >
                                                                                                        <iframe
                                                                                                            src={pdf.url}
                                                                                                            title={pdf.name || `PDF ${idx + 1}`}
                                                                                                            className="embedded-pdf"
                                                                                                            style={{ pointerEvents: 'none' }}
                                                                                                        >
                                                                                                            Your browser does not support PDFs.
                                                                                                        </iframe>
                                                                                                        <span className="pdf-name">{pdf.name || `PDF ${idx + 1}`}</span>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Sub-topics */}
                                                                                    {topic.subTopics && topic.subTopics.length > 0 && (
                                                                                        <div className="subtopics-list mt-3">
                                                                                            <h6 className="fw-semibold mb-2">Sub-topics:</h6>
                                                                                            {topic.subTopics.map((subTopic, subTopicIndex) => (
                                                                                                <div key={subTopic.id} className="subtopic-item mb-2">
                                                                                                    <div className="subtopic-header">
                                                                                                        <div className="subtopic-left">
                                                                                                            <span className="subtopic-number">
                                                                                                                {subTopic.subTopicNumber}
                                                                                                            </span>
                                                                                                            <span className="subtopic-title">
                                                                                                                {subTopic.subTopicTitle}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    {subTopic.description && (
                                                                                                        <div className="subtopic-description">
                                                                                                            <p className="mb-0">{subTopic.description}</p>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    {/* Sub-topic Media */}
                                                                                                    {(subTopic.media?.videos?.length > 0 || subTopic.media?.images?.length > 0 || subTopic.media?.pdfs?.length > 0) && (
                                                                                                        <div className="media-preview-section mt-2">
                                                                                                            <div className="media-grid">
                                                                                                                {subTopic.media.videos?.map((video, idx) => (
                                                                                                                    <div key={idx} className="media-item small video-container">
                                                                                                                        <video
                                                                                                                            controls
                                                                                                                            src={video.url}
                                                                                                                            className="embedded-video"
                                                                                                                            preload="metadata"
                                                                                                                        />
                                                                                                                        <span className="video-name">{video.name || `Video ${idx + 1}`}</span>
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                                {subTopic.media.images?.map((image, idx) => (
                                                                                                                    <div key={idx} className="media-item small image-container">
                                                                                                                        <img
                                                                                                                            src={image.url}
                                                                                                                            alt={image.name || `Image ${idx + 1}`}
                                                                                                                            className="embedded-image"
                                                                                                                            loading="lazy"
                                                                                                                        />
                                                                                                                        <span className="image-name">{image.name || `Image ${idx + 1}`}</span>
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                                {subTopic.media.pdfs?.map((pdf, idx) => (
                                                                                                                    <div key={idx} className="media-item small pdf-container">
                                                                                                                        <iframe
                                                                                                                            src={pdf.url}
                                                                                                                            title={pdf.name || `PDF ${idx + 1}`}
                                                                                                                            className="embedded-pdf"
                                                                                                                        />
                                                                                                                        <span className="pdf-name">{pdf.name || `PDF ${idx + 1}`}</span>
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="empty-topics text-center py-3">
                                                                    <p className="text-muted mb-0">No topics added yet</p>
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

                         {activeTab === 'attendance' && (
                            <div className="tab-pane fade show active">
                                <div className="mb-4">
                                    <h5 className="fw-bold mb-3">Attendance Record</h5>
                                    <p className="text-muted mb-4">Track your attendance for live sessions and classes</p>
                                </div>

                                {/* Attendance Stats */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <div className="card border-0 shadow-sm bg-success bg-opacity-10">
                                            <div className="card-body text-center">
                                                <CheckCircle size={32} className="text-success mb-2" />
                                                <h3 className="fw-bold mb-1">{attendancePercentage}%</h3>
                                                <p className="text-muted small mb-0">Overall Attendance</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
                                            <div className="card-body text-center">
                                                <CheckCircle size={32} className="text-primary mb-2" />
                                                <h3 className="fw-bold mb-1">{presentCount}/{totalSessions}</h3>
                                                <p className="text-muted small mb-0">Present</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card border-0 shadow-sm bg-danger bg-opacity-10">
                                            <div className="card-body text-center">
                                                <XCircle size={32} className="text-danger mb-2" />
                                                <h3 className="fw-bold mb-1">{absentCount}</h3>
                                                <p className="text-muted small mb-0">Absent</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold mb-2">Filter by Status:</label>
                                                <div className="btn-group" role="group">
                                                    <button 
                                                        type="button" 
                                                        className={`btn ${attendanceFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setAttendanceFilter('all')}
                                                    >
                                                        All ({totalSessions})
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className={`btn ${attendanceFilter === 'present' ? 'btn-success' : 'btn-outline-success'}`}
                                                        onClick={() => setAttendanceFilter('present')}
                                                    >
                                                        Present ({presentCount})
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className={`btn ${attendanceFilter === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`}
                                                        onClick={() => setAttendanceFilter('absent')}
                                                    >
                                                        Absent ({absentCount})
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold mb-2">Select Month:</label>
                                                <input 
                                                    type="month" 
                                                    className="form-control" 
                                                    value={selectedMonth}
                                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Attendance Table */}
                                <div className="card border-0 shadow-sm">
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{width: '15%'}}>Date</th>
                                                        <th style={{width: '20%'}}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredAttendance.length > 0 ? (
                                                        filteredAttendance.map((item) => (
                                                            <tr key={item.id}>
                                                                <td>
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <Calendar size={16} className="text-muted" />
                                                                        <span>{moment(item.date).format('MMM DD, YYYY')}</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {item.status === 'present' ? (
                                                                        <span className="badge bg-success">
                                                                            <CheckCircle size={12} className="me-1" />
                                                                            Present
                                                                        </span>
                                                                    ) : (
                                                                        <span className="badge bg-danger">
                                                                            <XCircle size={12} className="me-1" />
                                                                            Absent
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="text-center py-4">
                                                                <AlertCircle size={32} className="text-muted mb-2" />
                                                                <p className="text-muted mb-0">No attendance records found for this filter</p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Attendance Progress & Warning */}
                                <div className="row g-3 mt-3">
                                    <div className="col-md-8">
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-body">
                                                <h6 className="fw-bold mb-3">Attendance Progress</h6>
                                                <div className="mb-2">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span className="text-muted small">Current: {attendancePercentage}%</span>
                                                        <span className="text-muted small">Required: 75%</span>
                                                    </div>
                                                    <div className="progress" style={{height: '25px'}}>
                                                        <div 
                                                            className={`progress-bar ${attendancePercentage >= 75 ? 'bg-success' : attendancePercentage >= 60 ? 'bg-warning' : 'bg-danger'}`}
                                                            role="progressbar" 
                                                            style={{width: `${attendancePercentage}%`}}
                                                            aria-valuenow={attendancePercentage} 
                                                            aria-valuemin="0" 
                                                            aria-valuemax="100"
                                                        >
                                                            {attendancePercentage}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                    <small className="text-muted">
                                                        {attendancePercentage >= 75 
                                                            ? '✅ You are eligible for the final exam' 
                                                            : `⚠️ You need ${75 - attendancePercentage}% more attendance`
                                                        }
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className={`card border-0 shadow-sm ${attendancePercentage >= 75 ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
                                            <div className="card-body text-center">
                                                {attendancePercentage >= 75 ? (
                                                    <>
                                                        <CheckCircle size={40} className="text-success mb-2" />
                                                        <h6 className="fw-bold text-success mb-1">Eligible</h6>
                                                        <p className="text-muted small mb-0">You can appear for the final exam</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle size={40} className="text-warning mb-2" />
                                                        <h6 className="fw-bold text-warning mb-1">Not Eligible</h6>
                                                        <p className="text-muted small mb-0">Improve your attendance</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="row g-3 mt-2">
                                    <div className="col-12">
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-body">
                                                <h6 className="fw-bold mb-3">Quick Summary</h6>
                                                <div className="row text-center">
                                                    <div className="col-md-4">
                                                        <div className="border-end">
                                                            <h4 className="fw-bold text-primary mb-1">{totalSessions}</h4>
                                                            <small className="text-muted">Total Sessions</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="border-end">
                                                            <h4 className="fw-bold text-success mb-1">{presentCount}</h4>
                                                            <small className="text-muted">Attended</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <h4 className="fw-bold text-danger mb-1">{absentCount}</h4>
                                                        <small className="text-muted">Missed</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                                {activeTab === 'assignment' && (
                                     <div className="tab-pane fade show active">
                                         <Assignment courseId={course._id} />
                                     </div>
                                )}

                        {/*
                        {activeTab === 'reviews' && (
                            <div className="tab-pane fade show active">
                                <p>Reviews content will go here...</p>
                            </div>
                        )} */}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4 custom-scrollbar" style={{
                    height: '100%',
                    overflowY: 'auto',
                    scrollBehavior: 'smooth'
                }}>
                    <div style={{
                        position: 'sticky',
                        top: '20px',
                        alignSelf: 'flex-start',
                        width: '100%'
                    }}>
                        <button className="btn btn-primary w-100 mb-3 py-3">
                            Continue Learning
                        </button>

                        {/* Certificate Card */}
                        <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25 mb-3">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <Award size={28} className="text-primary me-3" />
                                    <div>
                                        <h6 className="mb-0">Certificate</h6>
                                        <small>of Completion</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructor Card */}
                        {course.instructor && (
                        <div className="card mb-3">
                            <div className="card-body">
                                <h6 className="card-subtitle mb-3">Instructor</h6>
                                <div className="d-flex align-items-center">
                                    <img
                                            src={course.instructor.profilePicture ? `${bucketUrl}/${course.instructor.profilePicture}` : "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200"}
                                            alt={course.instructor.name || 'Instructor'}
                                        className="rounded-circle me-3"
                                        style={{width: '48px', height: '48px', objectFit: 'cover'}}
                                    />
                                    <div>
                                            <p className="mb-0 fw-semibold">{course.instructor.name || 'N/A'}</p>
                                            <small className="text-muted">{course.instructor.designation || 'Course Instructor'}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Course Details Card */}
                        <div className="card mb-3">
                            <div className="card-body">
                                <h6 className="card-subtitle mb-3">Course Details</h6>
                                <div className="mb-2">
                                    <small className="text-muted d-block">Level</small>
                                    <p className="mb-0 fw-semibold">{course.courseLevel || 'N/A'}</p>
                                </div>
                                <div className="mb-2">
                                    <small className="text-muted d-block">Duration</small>
                                    <p className="mb-0 fw-semibold">{course.duration || 'N/A'}</p>
                                </div>
                                <div className="mb-2">
                                    <small className="text-muted d-block">Certification</small>
                                    <p className="mb-0 fw-semibold">{course.certifyingAgency || 'N/A'}</p>
                                </div>
                                {course.sectors && course.sectors.length > 0 && (
                                    <div>
                                        <small className="text-muted d-block">Sector</small>
                                        <p className="mb-0 fw-semibold">{course.sectors[0].name || 'N/A'}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Live Session Card */}
                        {course.nextSession && (
                        <div className="card mb-3">
                            <div className="card-body">
                                <h6 className="card-subtitle mb-3">Upcoming Live Session</h6>
                                <div className="d-flex">
                                    <Calendar size={16} className="text-muted me-2 mt-1" />
                                    <div>
                                            <p className="mb-0">{moment(course.nextSession.date).format('MMM DD, YYYY')}</p>
                                            <small className="text-muted">{course.nextSession.time || '6:00 PM IST'}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Achievements Card */}
                        <div className="card">
                            <div className="card-body">
                                <h6 className="card-subtitle mb-3">Achievements</h6>
                                <div className="d-flex align-items-center mb-2">
                                    <CheckCircle2 size={16} className="text-success me-2" />
                                    <small>Completion milestone</small>
                                </div>
                                <div className="d-flex align-items-center">
                                    <CheckCircle2 size={16} className="text-success me-2" />
                                    <small>Streak milestone</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


<style>{`
    html, body {
            height: 100%;
            overflow: hidden;
        }
    .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
    }
                
    p {
        font-size:13px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
    .custom-scrollbar{
        padding-bottom:50px;
    }

    /* Curriculum Table of Contents Styles */
    .curriculum-toc {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .toc-header {
        padding-bottom: 1rem;
        border-bottom: 2px solid #f5f7fa;
    }

    .toc-header h5 {
        color: #2c3e50;
        margin: 0;
    }

    .empty-state {
        padding: 3rem 2rem;
        color: #7f8c8d;
    }

    .chapters-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .chapter-item {
        border: 2px solid #e3f2fd;
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s;
    }

    .chapter-item:hover {
        border-color: #fc2b5a;
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.1);
    }

    .chapter-header {
        background: linear-gradient(135deg, #fc2b5a 0%, #ed3f66cf 100%);
        color: white;
        padding: 1.25rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s;
    }

    .chapter-header:hover {
        background: linear-gradient(135deg, #ed3f66cf 0%, #fc2b5a 100%);
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
        gap: 0.75rem;
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

    .duration-badge {
        background: rgba(255,255,255,0.2);
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .chapter-content {
        padding: 1.5rem;
        background: #fafbfc;
    }

    .chapter-description {
        padding: 1rem;
        background: #e3f2fd;
        border-radius: 8px;
        color: #1565c0;
        font-style: italic;
    }

    .topics-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .topic-item {
        border: 2px solid #e8f5e9;
        border-radius: 8px;
        overflow: hidden;
        background: white;
    }

    .topic-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s;
    }

    .topic-header:hover {
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
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
        color: #2e7d32;
        font-style: italic;
        font-size: 0.95rem;
    }

    .media-preview-section {
        background: #f9fafb;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
    }

    .media-preview-section h6 {
        margin: 0 0 0.75rem 0;
        color: #2c3e50;
        font-weight: 600;
    }

    .media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.75rem;
        width: 100%;
    }

    .video-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 5px;
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: #f9f9f9;
        margin-bottom: 5px;
    }

    .embedded-video {
        width: 100%;
        max-height: 120px;
        object-fit: cover;
        border-radius: 3px;
        margin-bottom: 5px;
    }

    .video-name {
        font-size: 0.8rem;
        color: #555;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
    }

    .image-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 5px;
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: #f9f9f9;
        margin-bottom: 5px;
        overflow: hidden;
        max-width: 100%;
        min-height: 160px;
    }

    .embedded-image {
        width: 100%;
        max-height: 105px;
        height: 105px;
        object-fit: cover;
        border-radius: 3px;
        margin-bottom: 5px;
        cursor: pointer;
        transition: transform 0.3s;
        display: block;
    }

    .embedded-image:hover {
        transform: scale(1.05);
    }

    .image-name {
        font-size: 0.75rem;
        color: #555;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        margin-top: 5px;
        padding: 2px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 3px;
        font-weight: 500;
    }

    .pdf-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 5px;
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: #f9f9f9;
        margin-bottom: 5px;
        overflow: hidden;
        max-width: 100%;
        min-height: 160px;
    }

    .embedded-pdf {
        width: 100%;
        max-height: 105px;
        height: 105px;
        border: none;
        border-radius: 3px;
        margin-bottom: 5px;
        display: block;
    }

    .pdf-name {
        font-size: 0.75rem;
        color: #555;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        margin-top: 5px;
        padding: 2px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 3px;
        font-weight: 500;
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
        padding: 0.75rem;
    }

    .subtopic-header {
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

    .subtopic-number {
        background: rgba(252, 43, 90, 0.1);
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.85rem;
        color: #fc2b5a;
        min-width: 40px;
        text-align: center;
    }

    .subtopic-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .subtopic-description {
        padding: 0.75rem 1rem;
        background: #fff5f8;
        color: #c2185b;
        font-style: italic;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        border-radius: 6px;
    }

    .empty-topics {
        padding: 2rem;
        text-align: center;
        color: #95a5a6;
        font-style: italic;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .chapter-header, .topic-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .chapter-left, .topic-left {
            flex-wrap: wrap;
        }

        .chapter-actions, .topic-actions {
            justify-content: flex-end;
        }

        .media-grid {
            grid-template-columns: 1fr;
        }
    }

    /* Media Viewer Modal Styles */
    .media-viewer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        padding: 1rem;
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .media-viewer-content {
        background: white;
        border-radius: 12px;
        width: 50%;
        height: 100%;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
        from {
            transform: translateY(50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .media-viewer-header {
        padding: 1.5rem;
        border-bottom: 2px solid #f5f7fa;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px 12px 0 0;
    }

    .media-viewer-header h3 {
        margin: 0;
        font-size: 1.5rem;
        display: flex;
        align-items: center;
    }

    .media-viewer-body {
        flex: 1;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
        background: #f5f7fa;
    }

    .viewer-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .viewer-pdf {
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 8px;
    }

    .media-viewer-footer {
        padding: 1.5rem;
        border-top: 2px solid #f5f7fa;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        background: white;
        border-radius: 0 0 12px 12px;
    }

    .embedded-image:hover {
        transform: scale(1.05);
    }

    .pdf-container:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .image-container:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* Hover Effects */
    .hover-shadow {
        transition: all 0.3s ease;
    }
    
    .hover-shadow:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
    }

    /* Video Play Button Hover */
    .hover-shadow .btn:hover {
        background-color: #fff !important;
        transform: scale(1.1);
    }

    /* Card Hover Effects */
    .card.hover-shadow {
        cursor: pointer;
    }

    /* Table Row Hover */
    .table-hover tbody tr:hover {
        background-color: #f8f9fa;
        cursor: pointer;
    }

    /* Badge Animations */
    .badge {
        transition: all 0.2s ease;
    }

    .badge:hover {
        transform: scale(1.05);
    }

    /* Button Hover Effects */
    .btn-outline-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,123,255,0.3);
    }

    /* Download Button Icon Animation */
    .btn:hover svg {
        animation: bounce 0.5s ease;
    }

    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
    }

    /* Attendance Stats Cards */
    .card.bg-success.bg-opacity-10:hover,
    .card.bg-primary.bg-opacity-10:hover,
    .card.bg-danger.bg-opacity-10:hover {
        transform: scale(1.05);
        transition: all 0.3s ease;
    }

    /* Attendance Filter Buttons */
    .btn-group .btn {
        font-size: 0.875rem;
        padding: 0.5rem 0.75rem;
    }

    /* Progress Bar Styling */
    .progress {
        background-color: #e9ecef;
        border-radius: 10px;
        overflow: hidden;
    }

    .progress-bar {
        font-size: 0.875rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Table Styling */
    .table th {
        font-weight: 600;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #6c757d;
    }

    .table td {
        vertical-align: middle;
        font-size: 0.9rem;
    }

    /* Responsive Design for Attendance */
    @media (max-width: 768px) {
        .btn-group {
            display: flex;
            flex-direction: column;
            width: 100%;
        }
        
        .btn-group .btn {
            border-radius: 0.375rem !important;
            margin-bottom: 0.5rem;
        }

        .attendance-stats .col-md-3 {
            margin-bottom: 1rem;
        }

        .border-end {
            border-right: none !important;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 1rem;
            margin-bottom: 1rem;
        }
    }
`}
</style>

            {/* Media Viewer Modal */}
            {showMediaViewer && viewerMedia && (
                <div className="media-viewer-overlay" onClick={closeMediaViewer}>
                    <div className="media-viewer-content" onClick={(e) => e.stopPropagation()}>
                        <div className="media-viewer-header">
                            <h3>
                                <i className={`fas fa-${viewerMedia.type === 'image' ? 'image' : 'file-pdf'} me-2`}></i>
                                {viewerMedia.name || `${viewerMedia.type === 'image' ? 'Image' : 'PDF'} Viewer`}
                            </h3>
                            <button className="btn-close" onClick={closeMediaViewer}></button>
                        </div>
                        <div className="media-viewer-body">
                            {viewerMedia.type === 'image' ? (
                                <img
                                    src={viewerMedia.url}
                                    alt={viewerMedia.name || 'Image'}
                                    className="viewer-image"
                                />
                            ) : (
                                <iframe
                                    src={`${viewerMedia.url}#toolbar=0&navpanes=0&scrollbar=1`}
                                    title={viewerMedia.name || 'PDF'}
                                    className="viewer-pdf"
                                >
                                    Your browser does not support PDFs.
                                </iframe>
                            )}
                        </div>
                        <div className="media-viewer-footer">
                            <a
                                href={viewerMedia.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                            >
                                <i className="fas fa-external-link-alt me-2"></i>
                                Open in New Tab
                            </a>
                            <button className="btn btn-outline" onClick={closeMediaViewer}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Enrolled;