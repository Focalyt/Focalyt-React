import React, { useState } from 'react';

function AddCourseContent() {
    // Mock existing courses - yeh API se fetch ho sakti hain
    const existingCourses = [
        { id: 1, title: 'Multi-copter Drone Building Course', status: 'Active' },
        { id: 2, title: 'AI and Machine Learning Fundamentals', status: 'Active' },
        { id: 3, title: 'Web Development Bootcamp', status: 'Draft' },
        { id: 4, title: 'Digital Marketing Masterclass', status: 'Active' }
    ];

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [course, setCourse] = useState({
        status: 'Draft',
        video: null,
        thumbnail: null,
        learnPoints: [''],
        includes: [''],
        sections: [
            {
                title: '',
                lectures: [
                    {
                        title: '',
                        components: ['']
                    }
                ],
            },
        ],
    });

    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [videoPreview, setVideoPreview] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    const updateValue = (path, value) => {
        setCourse((prev) => {
            const next = { ...prev };
            const keys = Array.isArray(path) ? path : path.split('.');
            let ref = next;
            for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]];
            ref[keys[keys.length - 1]] = value;
            return next;
        });
    };

    // Course selection handler
    const handleCourseSelection = (e) => {
        const courseId = e.target.value;
        setSelectedCourseId(courseId);
        
        // Optional: Auto-populate status based on selected course
        const selectedCourse = existingCourses.find(c => c.id === parseInt(courseId));
        if (selectedCourse) {
            updateValue('status', selectedCourse.status);
        }
    };

    // File upload handlers
    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (videoPreview) {
                URL.revokeObjectURL(videoPreview);
            }
            const videoUrl = URL.createObjectURL(file);
            setVideoPreview(videoUrl);
            updateValue('video', file);
        }
    };

    const handleThumbnailUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (thumbnailPreview) {
                URL.revokeObjectURL(thumbnailPreview);
            }
            const imageUrl = URL.createObjectURL(file);
            setThumbnailPreview(imageUrl);
            updateValue('thumbnail', file);
        }
    };

    const removeFile = (fileType) => {
        const confirm = window.confirm('Are you sure you want to remove this file?');
        if (!confirm) return;

        if (fileType === 'video') {
            if (videoPreview) {
                URL.revokeObjectURL(videoPreview);
            }
            setVideoPreview(null);
            updateValue('video', null);
            const videoInput = document.getElementById('video');
            if (videoInput) videoInput.value = '';
        } else if (fileType === 'thumbnail') {
            if (thumbnailPreview) {
                URL.revokeObjectURL(thumbnailPreview);
            }
            setThumbnailPreview(null);
            updateValue('thumbnail', null);
            const thumbnailInput = document.getElementById('thumbnail');
            if (thumbnailInput) thumbnailInput.value = '';
        }
    };

    const addLearn = () => updateValue('learnPoints', [...course.learnPoints, '']);
    const removeLearn = (i) => updateValue('learnPoints', course.learnPoints.filter((_, idx) => idx !== i));

    const addInclude = () => updateValue('includes', [...course.includes, '']);
    const removeInclude = (i) => updateValue('includes', course.includes.filter((_, idx) => idx !== i));

    const addSection = () => updateValue('sections', [...course.sections, { title: '', lectures: [{ title: '', components: [''] }] }]);
    const removeSection = (sIdx) => updateValue('sections', course.sections.filter((_, idx) => idx !== sIdx));

    const addLecture = (sIdx) => {
        const copy = [...course.sections];
        copy[sIdx].lectures.push({ title: '', components: [''] });
        updateValue('sections', copy);
    };

    const removeLecture = (sIdx, lIdx) => {
        const copy = [...course.sections];
        copy[sIdx].lectures = copy[sIdx].lectures.filter((_, idx) => idx !== lIdx);
        updateValue('sections', copy);
    };

    const addComponent = (sIdx, lIdx) => {
        const copy = [...course.sections];
        copy[sIdx].lectures[lIdx].components.push('');
        updateValue('sections', copy);
    };

    const removeComponent = (sIdx, lIdx, cIdx) => {
        const copy = [...course.sections];
        copy[sIdx].lectures[lIdx].components = copy[sIdx].lectures[lIdx].components.filter((_, idx) => idx !== cIdx);
        updateValue('sections', copy);
    };

    const resetForm = () => {
        if (window.confirm('Are you sure you want to reset the form? All data will be lost.')) {
            if (videoPreview) URL.revokeObjectURL(videoPreview);
            if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);

            setSelectedCourseId('');
            setCourse({
                status: 'Draft',
                video: null,
                thumbnail: null,
                learnPoints: [''],
                includes: [''],
                sections: [{ title: '', lectures: [{ title: '', components: [''] }] }]
            });
            setVideoPreview(null);
            setThumbnailPreview(null);
            setSubmitSuccess(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validation
        if (!selectedCourseId) {
            alert('Please select a course first!');
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            const selectedCourse = existingCourses.find(c => c.id === parseInt(selectedCourseId));
            console.log('Adding content to course:', selectedCourse?.title);
            console.log('Content payload:', course);
            
            alert(`Content successfully added to "${selectedCourse?.title}"!`);
            setSubmitSuccess(true);
            setIsSubmitting(false);

            setTimeout(() => setSubmitSuccess(false), 3000);
        }, 500);
    };

    return (
        <div className="content-body">
            {/* Header with Breadcrumb */}
            <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
                <div className="content-header-left col-md-9 col-12 mb-2">
                    <div className="row breadcrumbs-top">
                        <div className="col-12">
                            <h3 className="content-header-title float-left mb-0">Add Course Content</h3>
                            <div className="breadcrumb-wrapper col-12">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item"><a href="/trainer/dashboard">Home</a></li>
                                    <li className="breadcrumb-item active">Add Course Content</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {submitSuccess && (
                <div className="alert alert-success mb-2" role="alert">
                    <strong>Success!</strong> Course content added successfully!
                </div>
            )}

            {/* Form */}
            <div className="form-horizontal">
                {/* Course Selection Section */}
                <section id="course-selection">
                    <div className="row">
                        <div className="col-xl-12 col-lg-12">
                            <div className="card">
                                <div className="card-header border border-top-0 border-left-0 border-right-0">
                                    <h4 className="card-title pb-1">Select Course</h4>
                                </div>
                                <div className="card-content">
                                    <div className="card-body">
                                        <div className="row">
                                            {/* Course Selector */}
                                            <div className="col-xl-8 col-lg-8 col-md-8 col-sm-12 col-12 mb-1">
                                                <label htmlFor="courseSelector">
                                                    Select Course <span style={{ color: 'red' }}>*</span>
                                                </label>
                                                <select
                                                    className="form-control"
                                                    id="courseSelector"
                                                    value={selectedCourseId}
                                                    onChange={handleCourseSelection}
                                                    style={{ 
                                                        fontWeight: selectedCourseId ? '600' : 'normal',
                                                        color: selectedCourseId ? '#28c76f' : '#6c757d'
                                                    }}
                                                >
                                                    <option value="">-- Choose a course to add content --</option>
                                                    {existingCourses.map(course => (
                                                        <option key={course.id} value={course.id}>
                                                            {course.title} ({course.status})
                                                        </option>
                                                    ))}
                                                </select>
                                                <small className="text-muted">
                                                    Select the course where you want to add new content
                                                </small>
                                            </div>

                                            {/* Status Display */}
                                            <div className="col-xl-4 col-lg-4 col-md-4 col-sm-12 col-12 mb-1">
                                                <label htmlFor="status">Course Status</label>
                                                <select
                                                    className="form-control"
                                                    id="status"
                                                    value={course.status}
                                                    onChange={(e) => updateValue('status', e.target.value)}
                                                    disabled={!selectedCourseId}
                                                >
                                                    <option value="Draft">Draft</option>
                                                    <option value="Active">Active</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Selected Course Info */}
                                        {selectedCourseId && (
                                            <div className="alert alert-info mt-2" style={{ backgroundColor: '#e3f2fd', border: 'none' }}>
                                                <strong>Adding content to:</strong> {existingCourses.find(c => c.id === parseInt(selectedCourseId))?.title}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What You'll Learn Section */}
                <section id="learn-points">
                    <div className="row">
                        <div className="col-xl-12 col-lg-12">
                            <div className="card">
                                <div className="card-header border border-top-0 border-left-0 border-right-0">
                                    <h4 className="card-title pb-1">What You'll Learn</h4>
                                </div>
                                <div className="card-content">
                                    <div className="card-body">
                                        <div id="learnPointsContainer">
                                            {course.learnPoints.map((p, i) => (
                                                <div className="row align-items-center mb-2" key={`lp-${i}`}>
                                                    <div className="col-xl-10 col-lg-10 col-md-9 col-sm-9 col-9">
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            value={p}
                                                            onChange={(e) => {
                                                                const copy = [...course.learnPoints];
                                                                copy[i] = e.target.value;
                                                                updateValue('learnPoints', copy);
                                                            }}
                                                            placeholder={`Learning point ${i + 1}`}
                                                        />
                                                    </div>
                                                    <div className="col-xl-2 col-lg-2 col-md-3 col-sm-3 col-3">
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm w-100"
                                                            onClick={() => removeLearn(i)}
                                                            disabled={course.learnPoints.length === 1}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="col-xl-12 mb-1 px-0 text-right">
                                            <button
                                                type="button"
                                                className="btn btn-success text-white"
                                                onClick={addLearn}
                                            >
                                                + Add Learning Point
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Course Includes Section */}
                <section id="course-includes">
                    <div className="row">
                        <div className="col-xl-12 col-lg-12">
                            <div className="card">
                                <div className="card-header border border-top-0 border-left-0 border-right-0">
                                    <h4 className="card-title pb-1">This Course Includes</h4>
                                </div>
                                <div className="card-content">
                                    <div className="card-body">
                                        <div id="includesContainer">
                                            {course.includes.map((p, i) => (
                                                <div className="row align-items-center mb-2" key={`inc-${i}`}>
                                                    <div className="col-xl-10 col-lg-10 col-md-9 col-sm-9 col-9">
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            value={p}
                                                            onChange={(e) => {
                                                                const copy = [...course.includes];
                                                                copy[i] = e.target.value;
                                                                updateValue('includes', copy);
                                                            }}
                                                            placeholder={`Item ${i + 1}`}
                                                        />
                                                    </div>
                                                    <div className="col-xl-2 col-lg-2 col-md-3 col-sm-3 col-3">
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm w-100"
                                                            onClick={() => removeInclude(i)}
                                                            disabled={course.includes.length === 1}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="col-xl-12 mb-1 px-0 text-right">
                                            <button
                                                type="button"
                                                className="btn btn-success text-white"
                                                onClick={addInclude}
                                            >
                                                + Add Item
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sections & Lectures */}
                <section id="sections-lectures">
                    <div className="row">
                        <div className="col-xl-12 col-lg-12">
                            <div className="card">
                                <div className="card-header border border-top-0 border-left-0 border-right-0 d-flex justify-content-between align-items-center">
                                    <h4 className="card-title pb-1 mb-0">Sections & Lectures</h4>
                                    <button
                                        type="button"
                                        className="btn btn-success text-white btn-sm"
                                        onClick={addSection}
                                    >
                                        + Add Section
                                    </button>
                                </div>
                                <div className="card-content">
                                    <div className="card-body">
                                        {course.sections.map((section, sIdx) => (
                                            <div className="card mb-3" key={`sec-${sIdx}`} style={{ border: '1px solid #ddd' }}>
                                                <div className="card-header" style={{ backgroundColor: '#f8f9fa' }}>
                                                    <div className="row align-items-center">
                                                        <div className="col-xl-10 col-lg-10 col-md-9 col-9">
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                value={section.title}
                                                                onChange={(e) => {
                                                                    const copy = [...course.sections];
                                                                    copy[sIdx].title = e.target.value;
                                                                    updateValue('sections', copy);
                                                                }}
                                                                placeholder={`Section ${sIdx + 1} title`}
                                                            />
                                                        </div>
                                                        <div className="col-xl-2 col-lg-2 col-md-3 col-3 text-right">
                                                            <button
                                                                type="button"
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => removeSection(sIdx)}
                                                            >
                                                                Remove Section
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    {section.lectures.map((lec, lIdx) => (
                                                        <div className="card mb-2" key={`lec-${sIdx}-${lIdx}`} style={{ backgroundColor: '#fafafa' }}>
                                                            <div className="card-body p-3">
                                                                <div className="row align-items-center mb-2">
                                                                    <div className="col-xl-10 col-lg-10 col-md-9 col-9">
                                                                        <label className="mb-1"><strong>Lecture {lIdx + 1}</strong></label>
                                                                        <input
                                                                            className="form-control"
                                                                            type="text"
                                                                            value={lec.title}
                                                                            onChange={(e) => {
                                                                                const copy = [...course.sections];
                                                                                copy[sIdx].lectures[lIdx].title = e.target.value;
                                                                                updateValue('sections', copy);
                                                                            }}
                                                                            placeholder={`Lecture ${lIdx + 1} title`}
                                                                        />
                                                                    </div>
                                                                    <div className="col-xl-2 col-lg-2 col-md-3 col-3">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-danger btn-sm w-100"
                                                                            onClick={() => removeLecture(sIdx, lIdx)}
                                                                            disabled={section.lectures.length === 1}
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-2">
                                                                    <label className="mb-1"><small>Components:</small></label>
                                                                    {lec.components.map((c, cIdx) => (
                                                                        <div className="row align-items-center mb-2" key={`comp-${sIdx}-${lIdx}-${cIdx}`}>
                                                                            <div className="col-xl-10 col-lg-10 col-md-9 col-9">
                                                                                <input
                                                                                    className="form-control form-control-sm"
                                                                                    type="text"
                                                                                    value={c}
                                                                                    onChange={(e) => {
                                                                                        const copy = [...course.sections];
                                                                                        copy[sIdx].lectures[lIdx].components[cIdx] = e.target.value;
                                                                                        updateValue('sections', copy);
                                                                                    }}
                                                                                    placeholder={`Component ${cIdx + 1} (e.g., video URL, PDF link)`}
                                                                                />
                                                                            </div>
                                                                            <div className="col-xl-2 col-lg-2 col-md-3 col-3">
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-outline-danger btn-sm w-100"
                                                                                    onClick={() => removeComponent(sIdx, lIdx, cIdx)}
                                                                                    disabled={lec.components.length === 1}
                                                                                >
                                                                                    ×
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-primary btn-sm"
                                                                        onClick={() => addComponent(sIdx, lIdx)}
                                                                    >
                                                                        + Add Component
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-success btn-sm"
                                                        onClick={() => addLecture(sIdx)}
                                                    >
                                                        + Add Lecture
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Add Docs Section */}
                <section id="add-docs">
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="card">
                                <div className="card-header border border-top-0 border-left-0 border-right-0">
                                    <h4 className="card-title pb-1">Add Media</h4>
                                </div>
                                <div className="row">
                                    {/* Video Upload */}
                                    <div className="col-xl-4 col-lg-4 col-md-4">
                                        <div className="uploadedVideos card m-2 p-1">
                                            <h5 className="m-2 text-center">Course Video</h5>
                                            <div className="innerUploadedVideos" style={{ height: '140px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {videoPreview ? (
                                                    <div className="position-relative w-100" style={{ height: '100%' }}>
                                                        <video
                                                            controls
                                                            style={{ borderRadius: '5px' , width:"100%", height:"100%"}}
                                                        >
                                                            <source src={videoPreview} type="video/mp4" />
                                                            Your browser does not support the video tag.
                                                        </video>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger position-absolute"
                                                            style={{ right: '5px', top: '5px', zIndex: 10 }}
                                                            onClick={() => removeFile('video')}
                                                        >
                                                            <i className="fa fa-times"></i>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-muted">No video uploaded</p>
                                                )}
                                            </div>
                                            <div className="innerUploadedVideos" style={{ height: '70px', width: '100%' }}>
                                                <div className="col-12 mb-1">
                                                    <label htmlFor="video">
                                                        {videoPreview ? 'Replace Video' : 'Add Video'}
                                                    </label>
                                                    <input
                                                        name="video"
                                                        id="video"
                                                        type="file"
                                                        accept="video/*"
                                                        onChange={handleVideoUpload}
                                                        style={{ width: '100%', fontSize: '12px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thumbnail Upload */}
                                    <div className="col-xl-4 col-lg-4 col-md-4">
                                        <div className="thumbnails card m-2 p-1">
                                            <h5 className="m-2 text-center">Course Thumbnail</h5>
                                            <div className="innerUploadedThumbnails" style={{ height: '140px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {thumbnailPreview ? (
                                                    <div className="thumbnail-preview-container p-1 position-relative w-100">
                                                        <img
                                                            src={thumbnailPreview}
                                                            alt="Thumbnail Preview"
                                                            className="img-fluid rounded"
                                                            style={{
                                                                width: '100%',
                                                                height: '130px',
                                                                objectFit: 'cover',
                                                                cursor: 'pointer'
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger position-absolute"
                                                            style={{
                                                                right: '5px',
                                                                top: '5px',
                                                                width: '25px',
                                                                height: '25px',
                                                                padding: '0',
                                                                borderRadius: '50%',
                                                                fontSize: '12px',
                                                                zIndex: 10
                                                            }}
                                                            onClick={() => removeFile('thumbnail')}
                                                            title="Remove thumbnail"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-muted">No thumbnail uploaded</p>
                                                )}
                                            </div>
                                            <div className="innerUploadedThumbnails" style={{ height: '70px', width: '100%' }}>
                                                <div className="col-12 mb-1">
                                                    <label htmlFor="thumbnail">
                                                        {thumbnailPreview ? 'Replace Thumbnail' : 'Add Thumbnail'}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id="thumbnail"
                                                        name="thumbnail"
                                                        accept="image/*"
                                                        onChange={handleThumbnailUpload}
                                                        style={{ width: '100%', fontSize: '12px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Submit Buttons */}
                <div className="row mt-3 mb-5">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-12 text-right">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="btn btn-danger waves-effect waves-light mr-2"
                            disabled={isSubmitting}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="btn btn-success px-lg-4 waves-effect waves-light"
                            disabled={isSubmitting || !selectedCourseId}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .form-control {
                    padding: 0.6rem 0.7rem;
                    height: 40px;
                }
                
                .form-control-sm {
                    height: 35px;
                    padding: 0.4rem 0.6rem;
                }
                
                .card .card-header {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    border-bottom: none;
                    padding: 1.5rem 1.5rem 0;
                    background-color: transparent;
                }
                
                .card .card-header .card-title {
                    margin-bottom: 0;
                }
                
                .card .card-title {
                    font-size: 1rem !important;
                    font-weight: 500;
                    letter-spacing: 0.05rem;
                }
                
                .breadcrumb {
                    background-color: transparent;
                    padding: 0;
                    margin-bottom: 0;
                }
                
                .breadcrumb-item + .breadcrumb-item::before {
                    content: "›";
                }
                
                .content-header-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                }
                
                .alert {
                    border-radius: 0.25rem;
                }
                
                label {
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    display: block;
                }
                
                .w-100 {
                    width: 100%;
                }
                
                .mr-2 {
                    margin-right: 0.5rem;
                }
                
                .px-0 {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                }
                
                .text-right {
                    text-align: right;
                }
                
                .text-center {
                    text-align: center;
                }
                
                .text-muted {
                    color: #6c757d;
                }
                
                .d-flex {
                    display: flex;
                }
                
                .justify-content-between {
                    justify-content: space-between;
                }
                
                .align-items-center {
                    align-items: center;
                }
                
                .position-relative {
                    position: relative;
                }
                
                .position-absolute {
                    position: absolute;
                }
                
                .img-fluid {
                    max-width: 100%;
                    height: auto;
                }
                
                .rounded {
                    border-radius: 0.25rem;
                }
            `}</style>
        </div>
    );
}

export default AddCourseContent;