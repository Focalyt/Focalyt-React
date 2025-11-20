import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TimeTable() {
    // State Management
    const [curriculum, setCurriculum] = useState([]);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showSubTopicModal, setShowSubTopicModal] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [expandedChapters, setExpandedChapters] = useState([]);
    const [expandedTopics, setExpandedTopics] = useState([]);
    const [trainers, setTrainers] = useState([]);

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const token = JSON.parse(sessionStorage.getItem('token'));
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(null);
    const [viewDetailModal, setViewDetailModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Media Upload Modal States
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaFiles, setMediaFiles] = useState({
        videos: [],
        images: [],
        pdfs: []
    });
    const [uploadingFiles, setUploadingFiles] = useState(false);

    // Media Viewer Modal States
    const [showMediaViewer, setShowMediaViewer] = useState(false);
    const [viewerMedia, setViewerMedia] = useState(null);


    // Form States
    const [chapterForm, setChapterForm] = useState({
        chapterNumber: '',
        chapterTitle: '',
        description: '',
        duration: '',
        objectives: ''
    });

    const [topicForm, setTopicForm] = useState({
        topicNumber: '',
        topicTitle: '',
        description: '',
        duration: '',
        resources: ''
    });

    const [subTopicForm, setSubTopicForm] = useState({
        subTopicNumber: '',
        subTopicTitle: '',
        description: '',
        duration: '',
        content: ''
    });

    useEffect(() => {
        fetchCourses();
        fetchTrainers();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchBatches(selectedCourse);
        } else {
            setBatches([]);
        }
    }, [selectedCourse]);

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

            console.log('Courses API Response:', response.data);

            if (response.data && response.data.status && response.data.data) {
                const allCourses = [];
                response.data.data.forEach(trainer => {
                    if (trainer.assignedCourses && trainer.assignedCourses.length > 0) {
                        trainer.assignedCourses.forEach(course => {
                            // Check if course already exists by _id
                            const existingCourse = allCourses.find(c => c._id === course._id);
                            if (!existingCourse) {
                                allCourses.push(course);
                            }
                        });
                    }
                });
                console.log('Extracted courses:', allCourses);
                setCourses(allCourses);
            } else {
                console.warn('No courses found in response:', response.data);
                setCourses([]);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            console.error('Error details:', error.response?.data || error.message);
            setCourses([]);
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
        } finally {
            setLoading(false);
        }
    };

    const fetchTrainers = async () => {
        try {
            const response = await axios.get(`${backendUrl}/college/trainers`, {
                headers: { 'x-auth': token }
            });
            if (response.data.status && response.data.data) {
                setTrainers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching trainers:', error);
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
                    const formattedCurriculum = curriculumData.chapters.map((chapter, chapterIndex) => ({
                        id: chapter._id || `chapter-${chapter.chapterNumber}-${chapterIndex}`,
                        chapterNumber: chapter.chapterNumber,
                        chapterTitle: chapter.chapterTitle,
                        description: chapter.description,
                        duration: chapter.duration,
                        objectives: chapter.objectives,
                        media: chapter.media || { videos: [], images: [], pdfs: [] },
                        topics: chapter.topics.map((topic, topicIndex) => ({
                            id: topic._id || `topic-${chapter.chapterNumber}-${topic.topicNumber}-${topicIndex}`,
                            topicNumber: topic.topicNumber,
                            topicTitle: topic.topicTitle,
                            description: topic.description,
                            duration: topic.duration,
                            resources: topic.resources,
                            media: topic.media || { videos: [], images: [], pdfs: [] },
                            subTopics: topic.subTopics.map((subTopic, subTopicIndex) => ({
                                id: subTopic._id || `subtopic-${chapter.chapterNumber}-${topic.topicNumber}-${subTopicIndex}`,
                                subTopicNumber: subTopic.subTopicNumber,
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
            setCurriculum([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChapter = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const chapterData = {
                courseId: selectedCourse,
                batchId: selectedBatch,
                courseName: courses.find(c => c._id === selectedCourse)?.name || '',
                batchName: batches.find(b => b._id === selectedBatch)?.name || '',
                chapterNumber: parseInt(chapterForm.chapterNumber),
                chapterTitle: chapterForm.chapterTitle,
                description: chapterForm.description,
                duration: chapterForm.duration,
                objectives: chapterForm.objectives
            };

            console.log('Sending chapter data:', chapterData);

            const response = await axios.post(`${backendUrl}/college/addNewChapter`, chapterData, {
                headers: {
                    'x-auth': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status) {
                // Add chapter to local state
                const newChapter = {
                    id: response.data.data?._id || `chapter-${chapterForm.chapterNumber}-${Date.now()}`,
                    chapterNumber: parseInt(chapterForm.chapterNumber),
                    chapterTitle: chapterForm.chapterTitle,
                    description: chapterForm.description,
                    duration: chapterForm.duration,
                    objectives: chapterForm.objectives,
                    topics: []
                };

                setCurriculum([...curriculum, newChapter]);
                setShowChapterModal(false);
                resetChapterForm();
                alert('Chapter added successfully!');
            } else {
                alert(response.data.message || 'Failed to add chapter');
            }

        } catch (error) {
            console.error('Error adding chapter:', error);
            alert(error?.response?.data?.message || 'Failed to add chapter');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTopic = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const topicData = {
                courseId: selectedCourse,
                batchId: selectedBatch,
                chapterNumber: selectedChapter.chapterNumber,
                topicNumber: topicForm.topicNumber,
                topicTitle: topicForm.topicTitle,
                description: topicForm.description,
                duration: topicForm.duration,
                resources: topicForm.resources
            };

            // console.log('Sending topic data:', topicData);

            const response = await axios.post(`${backendUrl}/college/addNewTopic`, topicData, {
                headers: {
                    'x-auth': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status) {
                // Add topic to local state
                const updatedCurriculum = curriculum.map(chapter => {
                    if (chapter.chapterNumber === selectedChapter.chapterNumber) {
                        return {
                            ...chapter,
                            topics: [...(chapter.topics || []), {
                                id: response.data.data?._id || `topic-${chapter.chapterNumber}-${topicForm.topicNumber}-${Date.now()}`,
                                topicNumber: topicForm.topicNumber,
                                topicTitle: topicForm.topicTitle,
                                description: topicForm.description,
                                duration: topicForm.duration,
                                resources: topicForm.resources,
                                subTopics: []
                            }]
                        };
                    }
                    return chapter;
                });

                setCurriculum(updatedCurriculum);
                setShowTopicModal(false);
                resetTopicForm();
                alert('Topic added successfully!');
            } else {
                alert(response.data.message || 'Failed to add topic');
            }

        } catch (error) {
            console.error('Error adding topic:', error);
            alert(error?.response?.data?.message || 'Failed to add topic');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubTopic = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const subTopicData = {
                courseId: selectedCourse,
                batchId: selectedBatch,
                chapterNumber: selectedChapter.chapterNumber,
                topicNumber: selectedTopic.topicNumber,
                subTopicNumber: subTopicForm.subTopicNumber,
                subTopicTitle: subTopicForm.subTopicTitle,
                description: subTopicForm.description,
                duration: subTopicForm.duration,
                content: subTopicForm.content
            };

            console.log('Sending sub-topic data:', subTopicData);

            const response = await axios.post(`${backendUrl}/college/addNewSubTopic`, subTopicData, {
                headers: {
                    'x-auth': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status) {
                // Add sub-topic to local state
                const updatedCurriculum = curriculum.map(chapter => {
                    if (chapter.chapterNumber === selectedChapter.chapterNumber) {
                        return {
                            ...chapter,
                            topics: chapter.topics.map(topic => {
                                if (topic.topicNumber === selectedTopic.topicNumber) {
                                    return {
                                        ...topic,
                                        subTopics: [...(topic.subTopics || []), {
                                            id: response.data.data?._id || `subtopic-${selectedChapter.chapterNumber}-${selectedTopic.topicNumber}-${Date.now()}`,
                                            subTopicNumber: subTopicForm.subTopicNumber,
                                            subTopicTitle: subTopicForm.subTopicTitle,
                                            description: subTopicForm.description,
                                            duration: subTopicForm.duration,
                                            content: subTopicForm.content
                                        }]
                                    };
                                }
                                return topic;
                            })
                        };
                    }
                    return chapter;
                });

                setCurriculum(updatedCurriculum);
                setShowSubTopicModal(false);
                resetSubTopicForm();
                alert('Sub-topic added successfully!');
            } else {
                alert(response.data.message);
            }

        } catch (error) {
            console.error('Error adding sub-topic:', error);
            alert(error?.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChapter = (chapterId) => {
        if (window.confirm('Are you sure you want to delete this chapter?')) {
            setCurriculum(curriculum.filter(c => c.id !== chapterId));
        }
    };

    const handleDeleteTopic = (chapterId, topicId) => {
        if (window.confirm('Are you sure you want to delete this topic?')) {
            const updatedCurriculum = curriculum.map(chapter => {
                if (chapter.id === chapterId) {
                    return {
                        ...chapter,
                        topics: chapter.topics.filter(t => t.id !== topicId)
                    };
                }
                return chapter;
            });
            setCurriculum(updatedCurriculum);
        }
    };

    const handleDeleteSubTopic = (chapterId, topicId, subTopicId) => {
        if (window.confirm('Are you sure you want to delete this sub-topic?')) {
            const updatedCurriculum = curriculum.map(chapter => {
                if (chapter.id === chapterId) {
                    return {
                        ...chapter,
                        topics: chapter.topics.map(topic => {
                            if (topic.id === topicId) {
                                return {
                                    ...topic,
                                    subTopics: topic.subTopics.filter(st => st.id !== subTopicId)
                                };
                            }
                            return topic;
                        })
                    };
                }
                return chapter;
            });
            setCurriculum(updatedCurriculum);
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

    const resetChapterForm = () => {
        setChapterForm({
            chapterNumber: '',
            chapterTitle: '',
            description: '',
            duration: '',
            objectives: ''
        });
    };

    const resetTopicForm = () => {
        setTopicForm({
            topicNumber: '',
            topicTitle: '',
            description: '',
            duration: '',
            resources: ''
        });
    };

    const resetSubTopicForm = () => {
        setSubTopicForm({
            subTopicNumber: '',
            subTopicTitle: '',
            description: '',
            duration: '',
            content: ''
        });
    };

    // Dynamic numbering functions
    const getNextChapterNumber = () => {
        if (curriculum.length === 0) return 1;
        const maxChapterNumber = Math.max(...curriculum.map(chapter => chapter.chapterNumber));
        return maxChapterNumber + 1;
    };

    const getNextTopicNumber = (chapterNumber) => {
        const chapter = curriculum.find(ch => ch.chapterNumber === chapterNumber);
        if (!chapter || !chapter.topics || chapter.topics.length === 0) return 1;
        const maxTopicNumber = Math.max(...chapter.topics.map(topic => parseInt(topic.topicNumber) || 0));
        return maxTopicNumber + 1;
    };

    const getNextSubTopicNumber = (chapterNumber, topicNumber) => {
        const chapter = curriculum.find(ch => ch.chapterNumber === chapterNumber);
        if (!chapter) return `${topicNumber}.1`;

        const topic = chapter.topics.find(t => t.topicNumber === topicNumber.toString());
        if (!topic || !topic.subTopics || topic.subTopics.length === 0) return `${topicNumber}.1`;

        const maxSubTopicNumber = Math.max(...topic.subTopics.map(subTopic => {
            const parts = subTopic.subTopicTitle?.split('.') || ['0'];
            return parseInt(parts[parts.length - 1]) || 0;
        }));
        return `${topicNumber}.${maxSubTopicNumber + 1}`;
    };

    // Calculate total media count for a chapter (including all topics and subtopics)
    const getChapterMediaCount = (chapter) => {
        let totalVideos = 0;
        let totalImages = 0;
        let totalPdfs = 0;

        // Count chapter's own media
        if (chapter.media) {
            totalVideos += chapter.media.videos?.length || 0;
            totalImages += chapter.media.images?.length || 0;
            totalPdfs += chapter.media.pdfs?.length || 0;
        }

        // Count all topics' media
        if (chapter.topics && chapter.topics.length > 0) {
            chapter.topics.forEach(topic => {
                if (topic.media) {
                    totalVideos += topic.media.videos?.length || 0;
                    totalImages += topic.media.images?.length || 0;
                    totalPdfs += topic.media.pdfs?.length || 0;
                }

                // Count all subtopics' media
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

    // Media Upload Functions
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
        setUploadingFiles(true);
        try {
            const formData = new FormData();
            formData.append('courseId', selectedCourse);
            formData.append('batchId', selectedBatch);
            formData.append('mediaType', selectedItem.type);

            formData.append('chapterNumber', selectedItem.chapterNumber);
            formData.append('topicNumber', selectedItem.data.topicNumber);

            mediaFiles.videos.forEach(file => {
                formData.append('videos', file);
            });

            mediaFiles.images.forEach(file => {
                formData.append('images', file);
            });

            mediaFiles.pdfs.forEach(file => {
                formData.append('pdfs', file);
            });

            const response = await axios.post(`${backendUrl}/college/uploadmedia`, formData, {
                headers: {
                    'x-auth': token,
                    'Content-Type': 'multipart/form-data'
                }
            });


            if (response.data.status) {
                alert(`Media uploaded successfully!`);
                setShowMediaModal(false);
                await fetchCurriculum();
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error('Error uploading media:', error);
            alert(error?.response?.data?.message);
        } finally {
            setUploadingFiles(false);
        }
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


    return (
        <div className="curriculum-container">
            {/* Header */}
            <div className="curriculum-header">
                <div className="header-left">
                    <h2 className="page-title">
                        <i className="fas fa-book me-2"></i>
                        Course Curriculum Manager
                    </h2>
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

                {selectedCourse && selectedBatch && (
                    <button className="btn btn-primary" onClick={() => {
                        const nextChapterNumber = getNextChapterNumber();
                        setChapterForm({
                            ...chapterForm,
                            chapterNumber: nextChapterNumber.toString()
                        });
                        setShowChapterModal(true);
                    }}>
                        <i className="fas fa-plus me-2"></i>
                        Add New Chapter
                    </button>
                )}
            </div>

            {/* Statistics */}
            {selectedCourse && selectedBatch && (
                <div className="stats-row">
                    <div className="stat-card stat-primary">
                        <div className="stat-icon">
                            <i className="fas fa-book-open"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{curriculum.length}</div>
                            <div className="stat-label">Total Chapters</div>
                        </div>
                    </div>
                    <div className="stat-card stat-success">
                        <div className="stat-icon">
                            <i className="fas fa-list"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">
                                {curriculum.reduce((acc, ch) => acc + (ch.topics?.length || 0), 0)}
                            </div>
                            <div className="stat-label">Total Topics</div>
                        </div>
                    </div>
                    <div className="stat-card stat-info">
                        <div className="stat-icon">
                            <i className="fas fa-stream"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">
                                {curriculum.reduce((acc, ch) =>
                                    acc + (ch.topics?.reduce((tacc, t) => tacc + (t.subTopics?.length || 0), 0) || 0), 0
                                )}
                            </div>
                            <div className="stat-label">Total Sub-topics</div>
                        </div>
                    </div>
                    <div className="stat-card stat-warning">
                        <div className="stat-icon">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">
                                {curriculum.reduce((acc, ch) => {
                                    const weeks = parseInt(ch.duration) || 0;
                                    return acc + weeks;
                                }, 0)}
                            </div>
                            <div className="stat-label">Total Duration (weeks)</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Curriculum Content */}
            {selectedCourse && selectedBatch && (
                <div className="curriculum-content">
                    <div className="table-of-contents">
                        <div className="toc-header">
                            <h3>
                                <i className="fas fa-table me-2"></i>
                                Table of Contents
                            </h3>
                        </div>

                        {curriculum.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-book-open"></i>
                                <h4>No Curriculum Added Yet</h4>
                                <p>Start by adding your first chapter</p>

                            </div>
                        ) : (
                            <div className="chapters-list">
                                {curriculum.map((chapter, chapterIndex) => (
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
                                                <div className="topic-actions">
                                                    <span className="media-badge small">
                                                        <i className="fas fa-video"></i> {getChapterMediaCount(chapter).videos}
                                                        <i className="fas fa-image ml-1"></i> {getChapterMediaCount(chapter).images}
                                                        <i className="fas fa-file-pdf ml-1"></i> {getChapterMediaCount(chapter).pdfs}
                                                    </span>
                                                </div>
                                                <span className="duration-badge">
                                                    <i className="fas fa-clock"></i> {chapter.duration}
                                                </span>
                                                <button
                                                    className="btn-action btn-add"
                                                    onClick={() => {
                                                        setSelectedChapter(chapter);
                                                        const nextTopicNumber = getNextTopicNumber(chapter.chapterNumber);
                                                        setTopicForm({
                                                            ...topicForm,
                                                            topicNumber: nextTopicNumber.toString()
                                                        });
                                                        setShowTopicModal(true);
                                                    }}
                                                    title="Add Topic"
                                                >
                                                    <i className="fas fa-plus"></i>
                                                </button>
                                            </div>
                                        </div>

                                        {expandedChapters.includes(chapter.id) && (
                                            <div className="chapter-content">

                                                {chapter.topics && chapter.topics.length > 0 ? (
                                                    <div className="topics-list">
                                                        {chapter.topics.map((topic, topicIndex) => (
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
                                                                        
                                                                        {/* Show Uploaded Media */}
                                                                        {(topic.media?.videos?.length > 0 || topic.media?.images?.length > 0 || topic.media?.pdfs?.length > 0) && (
                                                                            <div className="media-preview-section">
                                                                                <h6>Uploaded Media:</h6>
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
                                                                    
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="empty-topics">
                                                        <p>No topics added yet</p>
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

            {/* Add Chapter Modal */}
            {showChapterModal && (
                <div className="modal-overlay" onClick={() => setShowChapterModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-book me-2"></i>
                                Add New Chapter
                            </h3>
                            <button className="btn-close" onClick={() => setShowChapterModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddChapter}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Chapter Number *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={chapterForm.chapterNumber}
                                            readOnly
                                            required
                                            style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Duration *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={chapterForm.duration}
                                            onChange={(e) => setChapterForm({ ...chapterForm, duration: e.target.value })}
                                            required
                                            placeholder="e.g., 2 weeks"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Chapter Title *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={chapterForm.chapterTitle}
                                            onChange={(e) => setChapterForm({ ...chapterForm, chapterTitle: e.target.value })}
                                            required
                                            placeholder="e.g., Introduction to Programming"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={chapterForm.description}
                                            onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                                            placeholder="Brief description of the chapter..."
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Learning Objectives</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={chapterForm.objectives}
                                            onChange={(e) => setChapterForm({ ...chapterForm, objectives: e.target.value })}
                                            placeholder="What students will learn in this chapter..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowChapterModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <i className="fas fa-save me-2"></i>
                                    Add Chapter
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Topic Modal */}
            {showTopicModal && (
                <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-list me-2"></i>
                                Add New Topic
                            </h3>
                            <button className="btn-close" onClick={() => setShowTopicModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddTopic}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Topic Number *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={topicForm.topicNumber}
                                            readOnly
                                            required
                                            style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Duration *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={topicForm.duration}
                                            onChange={(e) => setTopicForm({ ...topicForm, duration: e.target.value })}
                                            required
                                            placeholder="e.g., 3 days"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Topic Title *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={topicForm.topicTitle}
                                            onChange={(e) => setTopicForm({ ...topicForm, topicTitle: e.target.value })}
                                            required
                                            placeholder="e.g., Variables and Data Types"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={topicForm.description}
                                            onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                                            placeholder="Brief description of the topic..."
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Resources</label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            value={topicForm.resources}
                                            onChange={(e) => setTopicForm({ ...topicForm, resources: e.target.value })}
                                            placeholder="Books, videos, links, etc..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowTopicModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <i className="fas fa-save me-2"></i>
                                    Add Topic
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Sub-topic Modal */}
            {showSubTopicModal && (
                <div className="modal-overlay" onClick={() => setShowSubTopicModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <i className="fas fa-stream me-2"></i>
                                Add New Sub-topic
                            </h3>
                            <button className="btn-close" onClick={() => setShowSubTopicModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddSubTopic}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Sub Topic Number *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={subTopicForm.subTopicNumber}
                                            readOnly
                                            required
                                            style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Duration</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={subTopicForm.duration}
                                            onChange={(e) => setSubTopicForm({ ...subTopicForm, duration: e.target.value })}
                                            placeholder="e.g., 30 mins"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Sub Topic Title *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={subTopicForm.subTopicTitle}
                                            onChange={(e) => setSubTopicForm({ ...subTopicForm, subTopicTitle: e.target.value })}
                                            required
                                            placeholder="e.g., Introduction to Variables"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowSubTopicModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <i className="fas fa-save me-2"></i>
                                    Add Sub-topic
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            {viewDetailModal && selectedItem && (
                <div className="modal-overlay" onClick={() => setViewDetailModal(false)}>
                    <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <i className={`fas fa-${selectedItem.type === 'chapter' ? 'book' : selectedItem.type === 'topic' ? 'list' : 'stream'} me-2`}></i>
                                {selectedItem.type === 'chapter' ? 'Chapter' : selectedItem.type === 'topic' ? 'Topic' : 'Sub-topic'} Details
                            </h3>
                            <button className="btn-close" onClick={() => setViewDetailModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {selectedItem.type === 'chapter' && (
                                <>
                                    <div className="detail-row">
                                        <strong>Chapter Number:</strong>
                                        <span>{selectedItem.data.chapterNumber}</span>
                                    </div>
                                    <div className="detail-row">
                                        <strong>Title:</strong>
                                        <span>{selectedItem.data.chapterTitle}</span>
                                    </div>
                                    <div className="detail-row">
                                        <strong>Duration:</strong>
                                        <span>{selectedItem.data.duration}</span>
                                    </div>
                                    {selectedItem.data.description && (
                                        <div className="detail-row">
                                            <strong>Description:</strong>
                                            <span>{selectedItem.data.description}</span>
                                        </div>
                                    )}
                                    {selectedItem.data.objectives && (
                                        <div className="detail-row">
                                            <strong>Objectives:</strong>
                                            <span>{selectedItem.data.objectives}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            {selectedItem.type === 'topic' && (
                                <>
                                    <div className="detail-row">
                                        <strong>Topic Number:</strong>
                                        <span>{selectedItem.data.topicNumber}</span>
                                    </div>
                                    <div className="detail-row">
                                        <strong>Title:</strong>
                                        <span>{selectedItem.data.topicTitle}</span>
                                    </div>
                                    <div className="detail-row">
                                        <strong>Duration:</strong>
                                        <span>{selectedItem.data.duration}</span>
                                    </div>
                                    {selectedItem.data.description && (
                                        <div className="detail-row">
                                            <strong>Description:</strong>
                                            <span>{selectedItem.data.description}</span>
                                        </div>
                                    )}
                                    {selectedItem.data.resources && (
                                        <div className="detail-row">
                                            <strong>Resources:</strong>
                                            <span>{selectedItem.data.resources}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            {selectedItem.type === 'subtopic' && (
                                <>
                                    <div className="detail-row">
                                        <strong>Sub Topic Number:</strong>
                                        <span>{selectedItem.data.subTopicNumber}</span>
                                    </div>
                                    <div className="detail-row">
                                        <strong>Title:</strong>
                                        <span>{selectedItem.data.subTopicTitle}</span>
                                    </div>
                                    <div className="detail-row">
                                        <strong>Duration:</strong>
                                        <span>{selectedItem.data.duration}</span>
                                    </div>
                                    {selectedItem.data.content && (
                                        <div className="detail-row">
                                            <strong>Content:</strong>
                                            <span>{selectedItem.data.content}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setViewDetailModal(false)}>
                                Close
                            </button>
                        </div>
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

            {/* Media Viewer Modal */}
            {showMediaViewer && viewerMedia && (
                <div className="media-viewer-overlay" onClick={closeMediaViewer}>
                    <div className="media-viewer-content" onClick={(e) => e.stopPropagation()}>
                        <div className="media-viewer-header">
                            <h3>
                                <i className={`fas fa-${viewerMedia.type === 'image' ? 'image' : 'file-pdf'} me-2`}></i>
                                {viewerMedia.name || `${viewerMedia.type === 'image' ? 'Image' : 'PDF'} Viewer`}
                            </h3>
                            <button className="btn-close" onClick={closeMediaViewer}>×</button>
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

            {/* Styles */}
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

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    transition: transform 0.3s, box-shadow 0.3s;
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
                }

                .stat-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    margin-right: 1rem;
                }

                .stat-primary .stat-icon { background: #e3f2fd; color: #2196f3; }
                .stat-success .stat-icon { background: #e8f5e9; color: #4caf50; }
                .stat-info .stat-icon { background: #e0f7fa; color: #00bcd4; }
                .stat-warning .stat-icon { background: #fff3e0; color: #ff9800; }

                .stat-content {
                    flex: 1;
                }

                .stat-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #2c3e50;
                }

                .stat-label {
                    color: #7f8c8d;
                    font-size: 0.9rem;
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
                    margin: 0;
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

                .empty-state p {
                    margin-bottom: 2rem;
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
                    border-color: #fc2b5a;
                    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.1);
                }

                .chapter-header {
                    // background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    background: linear-gradient(135deg, #fc2b5a 0%, #ed3f66cf 100%);
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

                .duration-badge {
                    background: rgba(255,255,255,0.2);
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .duration-badge.small {
                    padding: 0.4rem 0.8rem;
                    font-size: 0.75rem;
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

                .btn-action.btn-add:hover {
                    background: #4caf50;
                }

                .btn-action.btn-view:hover {
                    background: #2196f3;
                }

                .btn-action.btn-delete:hover {
                    background: #e74c3c;
                }

                .btn-action.btn-upload:hover {
                    background: #4caf50;
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

                .media-preview-section {
                    background: #f9fafb;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
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
                    width: 100%;
                }

                .media-item {
                    background: white;
                    padding: 0.75rem;
                    border-radius: 6px;
                    border: 1px solid #e0e0e0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    width: 100%;
                    box-sizing: border-box;
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

                .modal-large {
                    max-width: 700px;
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
                    // background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                    background: rgba(255,255,255,0.2);
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    min-width: 40px;
                    text-align: center;
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

                .subtopic-description {
                    padding: 0.75rem 1rem;
                    background: #fff5f8;
                    color: #c2185b;
                    font-style: italic;
                    font-size: 0.9rem;
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

                .btn-primary:hover {
                    background: #2980b9;
                    transform: translateY(-2px);
                }

                .btn-outline {
                    background: white;
                    color: #3498db;
                    border: 2px solid #3498db;
                }

                .btn-outline:hover {
                    background: #3498db;
                    color: white;
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

                .modal-small {
                    max-width: 500px;
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

                .form-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group label {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 0.5rem;
                }

                .detail-row {
                    display: flex;
                    flex-direction: column;
                    padding: 1rem;
                    border-bottom: 1px solid #f5f7fa;
                    gap: 0.5rem;
                }

                .detail-row strong {
                    color: #2c3e50;
                    font-size: 0.9rem;
                }

                .detail-row span {
                    color: #555;
                }

                .me-2 {
                    margin-right: 0.5rem;
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

                @media (max-width: 768px) {
                    .curriculum-container {
                        padding: 1rem;
                    }

                    .selection-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .stats-row {
                        grid-template-columns: 1fr;
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

                    .media-viewer-content {
                        max-width: 100vw;
                        max-height: 100vh;
                        border-radius: 0;
                    }

                    .media-viewer-header {
                        border-radius: 0;
                    }

                    .media-viewer-footer {
                        border-radius: 0;
                        flex-direction: column;
                    }

                    .media-viewer-footer .btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .media-viewer-body {
                        padding: 0.5rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default TimeTable;
