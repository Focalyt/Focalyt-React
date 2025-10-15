import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DailyDiary() {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const token = JSON.parse(sessionStorage.getItem('token'));

    const [coursesData, setCoursesData] = useState([]);
    const [batchesData, setBatchesData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [courseInfo, setCourseInfo] = useState(null);

    const [formData, setFormData] = useState({
        sessionDate: '',
        sessionTime: '',
        trainingProgram: '',
        batch: '',
        module: '',
        sessionDuration: '',
        trainingMode: 'Online',

        topicsCovered: [''],
        conceptsTaught: [''],
        toolsUsed: [''],
        practicalExercises: '',
        demonstrations: '',

        assignments: [{
            title: '',
            module: '',
            description: '',
            skillsToPractice: '',
            deadline: '',
            resources: '',
            evaluationCriteria: '',
            attachments: null
        }],

        materials: {
            slides: null,
            readingMaterial: null,
            videoLinks: '',
            practiceFiles: null,
            additionalResources: ''
        },

        engagement: {
            participationLevel: '',
            questionsAsked: '',
            challengesFaced: '',
            performanceHighlights: '',
            areasOfImprovement: ''
        },

        nextSession: {
            nextTopic: '',
            prerequisites: '',
            materialsNeeded: '',
            reminders: ''
        }
    });

    const [activeSection, setActiveSection] = useState(1);

    // Fetch training programs/courses
    const fetchTrainingPrograms = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${backendUrl}/college/gettrainersbycourse`, {
                headers: {
                    'x-auth': token
                }
            });
            console.log('Training Programs Response:', res.data);
            if (res.data && res.data.status && res.data.data) {
                const trainersData = res.data.data;
                const allCourses = [];
                
                // Extract courses from trainers data
                trainersData.forEach(trainer => {
                    if (trainer.assignedCourses && trainer.assignedCourses.length > 0) {
                        trainer.assignedCourses.forEach(course => {
                            allCourses.push({
                                id: course._id,
                                name: course.name,
                                image: course.image,
                                trainerName: trainer.name,
                                trainerId: trainer._id
                            });
                        });
                    }
                });
                
                setCoursesData(allCourses);
                console.log('All Courses:', allCourses);
            }
        } catch (err) {
            console.log('Error fetching training programs:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch batches by trainer and course
    const fetchBatches = async (courseId) => {
        if (!courseId) {
            setBatchesData([]);
            setCourseInfo(null);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/college/getbatchesbytrainerandcourse`, {
                params: { courseId },
                headers: {
                    'x-auth': token
                }
            });
            
            console.log('Batches Response:', response.data);
            
            if (response.data && response.data.status && response.data.data) {
                setBatchesData(response.data.data.batches || []);
                setCourseInfo(response.data.data.course);
            } else {
                setBatchesData([]);
                setCourseInfo(null);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
            setBatchesData([]);
            setCourseInfo(null);
        } finally {
            setLoading(false);
        }
    };

    // Load training programs on component mount
    useEffect(() => {
        fetchTrainingPrograms();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Fetch batches when training program changes
        if (name === 'trainingProgram') {
            fetchBatches(value);
            // Reset batch selection when training program changes
            setFormData(prev => ({
                ...prev,
                [name]: value,
                batch: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleNestedChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleArrayChange = (field, index, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => i === index ? value : item)
        }));
    };

    const addArrayItem = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const removeArrayItem = (field, index) => {
        if (formData[field].length > 1) {
            setFormData(prev => ({
                ...prev,
                [field]: prev[field].filter((_, i) => i !== index)
            }));
        }
    };

    const handleAssignmentChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            assignments: prev.assignments.map((assignment, i) =>
                i === index ? { ...assignment, [field]: value } : assignment
            )
        }));
    };

    const addAssignment = () => {
        setFormData(prev => ({
            ...prev,
            assignments: [...prev.assignments, {
                title: '',
                module: '',
                description: '',
                skillsToPractice: '',
                deadline: '',
                resources: '',
                evaluationCriteria: '',
                attachments: null
            }]
        }));
    };

    const removeAssignment = (index) => {
        if (formData.assignments.length > 1) {
            setFormData(prev => ({
                ...prev,
                assignments: prev.assignments.filter((_, i) => i !== index)
            }));
        }
    };

    const handleFileChange = (section, field, file) => {
        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: file
                }
            }));
        }
    };

    const handleAssignmentFileChange = (index, file) => {
        setFormData(prev => ({
            ...prev,
            assignments: prev.assignments.map((assignment, i) =>
                i === index ? { ...assignment, attachments: file } : assignment
            )
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Daily Diary Data:', formData);
        alert('Daily Diary submitted successfully!');
    };


    return (
        <div className="daily-diary-container">
            <div className="diary-header">
                <h1>Daily Training Diary</h1>
                <p>Record your daily training sessions, assignments, and trainee progress</p>
            </div>

            <div className="section-navigation">
                <button 
                    className={activeSection === 1 ? 'active' : ''} 
                    onClick={() => setActiveSection(1)}
                >
                    <span className="section-number">1</span>
                    Session Entry
                </button>
                <button 
                    className={activeSection === 2 ? 'active' : ''} 
                    onClick={() => setActiveSection(2)}
                >
                    <span className="section-number">2</span>
                    Content Details
                </button>
                <button 
                    className={activeSection === 3 ? 'active' : ''} 
                    onClick={() => setActiveSection(3)}
                >
                    <span className="section-number">3</span>
                    Assignments
                </button>
                <button 
                    className={activeSection === 4 ? 'active' : ''} 
                    onClick={() => setActiveSection(4)}
                >
                    <span className="section-number">4</span>
                    Materials
                </button>
                <button 
                    className={activeSection === 5 ? 'active' : ''} 
                    onClick={() => setActiveSection(5)}
                >
                    <span className="section-number">5</span>
                    Engagement
                </button>
                <button 
                    className={activeSection === 6 ? 'active' : ''} 
                    onClick={() => setActiveSection(6)}
                >
                    <span className="section-number">6</span>
                    Next Session
                </button>
            </div>

            <form onSubmit={handleSubmit} className="diary-form">
                
                {/* Section 1: Daily Training Session Entry */}
                {activeSection === 1 && (
                    <div className="form-section">
                        <h2>📅 Daily Training Session Entry</h2>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Session Date *</label>
                                <input
                                    type="date"
                                    name="sessionDate"
                                    value={formData.sessionDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Session Time *</label>
                                <input
                                    type="time"
                                    name="sessionTime"
                                    value={formData.sessionTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Training Program/Course *</label>
                                <select
                                    name="trainingProgram"
                                    value={formData.trainingProgram}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                >
                                    <option value="">
                                        {loading ? 'Loading courses...' : 'Select Training Program'}
                                    </option>
                                    {coursesData && coursesData.length > 0 && 
                                        coursesData.map((course) => (
                                            <option key={course.id} value={course.id}>
                                                {course.name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Batch/Group *</label>
                                <select
                                    name="batch"
                                    value={formData.batch}
                                    onChange={handleChange}
                                    required
                                    disabled={loading || !formData.trainingProgram}
                                >
                                    <option value="">
                                        {loading && formData.trainingProgram
                                            ? 'Loading batches...' 
                                            : !formData.trainingProgram 
                                            ? 'Select Training Program First' 
                                            : 'Select Batch'}
                                    </option>
                                    {batchesData && batchesData.length > 0 && 
                                        batchesData.map((batch) => (
                                            <option key={batch._id} value={batch._id}>
                                                {batch.name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Module/Topic *</label>
                                <input
                                    type="text"
                                    name="module"
                                    value={formData.module}
                                    onChange={handleChange}
                                    placeholder="e.g., Module 3: SEO Fundamentals"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Session Duration (hours) *</label>
                                <input
                                    type="number"
                                    name="sessionDuration"
                                    value={formData.sessionDuration}
                                    onChange={handleChange}
                                    placeholder="e.g., 2.5"
                                    step="0.5"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Training Mode *</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="trainingMode"
                                        value="Online"
                                        checked={formData.trainingMode === 'Online'}
                                        onChange={handleChange}
                                    />
                                    Online
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="trainingMode"
                                        value="Offline"
                                        checked={formData.trainingMode === 'Offline'}
                                        onChange={handleChange}
                                    />
                                    Offline
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="trainingMode"
                                        value="Hybrid"
                                        checked={formData.trainingMode === 'Hybrid'}
                                        onChange={handleChange}
                                    />
                                    Hybrid
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 2: Session Content Details */}
                {activeSection === 2 && (
                    <div className="form-section">
                        <h2>📚 Session Content Details</h2>

                        <div className="form-group">
                            <label>Topics Covered *</label>
                            {formData.topicsCovered.map((topic, index) => (
                                <div key={index} className="array-input-group">
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => handleArrayChange('topicsCovered', index, e.target.value)}
                                        placeholder={`Topic ${index + 1}`}
                                        required
                                    />
                                    {formData.topicsCovered.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={() => removeArrayItem('topicsCovered', index)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                className="add-btn"
                                onClick={() => addArrayItem('topicsCovered')}
                            >
                                + Add Topic
                            </button>
                        </div>

                        <div className="form-group">
                            <label>Key Concepts Taught</label>
                            {formData.conceptsTaught.map((concept, index) => (
                                <div key={index} className="array-input-group">
                                    <input
                                        type="text"
                                        value={concept}
                                        onChange={(e) => handleArrayChange('conceptsTaught', index, e.target.value)}
                                        placeholder={`Concept ${index + 1}`}
                                    />
                                    {formData.conceptsTaught.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={() => removeArrayItem('conceptsTaught', index)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                className="add-btn"
                                onClick={() => addArrayItem('conceptsTaught')}
                            >
                                + Add Concept
                            </button>
                        </div>

                        <div className="form-group">
                            <label>Tools/Software Used</label>
                            {formData.toolsUsed.map((tool, index) => (
                                <div key={index} className="array-input-group">
                                    <input
                                        type="text"
                                        value={tool}
                                        onChange={(e) => handleArrayChange('toolsUsed', index, e.target.value)}
                                        placeholder="e.g., Excel, Photoshop, Canva"
                                    />
                                    {formData.toolsUsed.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={() => removeArrayItem('toolsUsed', index)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                className="add-btn"
                                onClick={() => addArrayItem('toolsUsed')}
                            >
                                + Add Tool
                            </button>
                        </div>

                        <div className="form-group">
                            <label>Practical Exercises</label>
                            <textarea
                                name="practicalExercises"
                                value={formData.practicalExercises}
                                onChange={handleChange}
                                placeholder="Describe the hands-on practice activities conducted..."
                                rows="4"
                            />
                        </div>

                        <div className="form-group">
                            <label>Demos/Presentations</label>
                            <textarea
                                name="demonstrations"
                                value={formData.demonstrations}
                                onChange={handleChange}
                                placeholder="What demonstrations or presentations were given..."
                                rows="4"
                            />
                        </div>
                    </div>
                )}

                {/* Section 3: Assignments/Tasks */}
                {activeSection === 3 && (
                    <div className="form-section">
                        <h2>📝 Assignments/Tasks for Trainees</h2>

                        {formData.assignments.map((assignment, index) => (
                            <div key={index} className="assignment-card">
                                <div className="assignment-header">
                                    <h3>Assignment {index + 1}</h3>
                                    {formData.assignments.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={() => removeAssignment(index)}
                                        >
                                            Remove Assignment
                                        </button>
                                    )}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Assignment Title *</label>
                                        <input
                                            type="text"
                                            value={assignment.title}
                                            onChange={(e) => handleAssignmentChange(index, 'title', e.target.value)}
                                            placeholder="Enter assignment title"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Related Module</label>
                                        <input
                                            type="text"
                                            value={assignment.module}
                                            onChange={(e) => handleAssignmentChange(index, 'module', e.target.value)}
                                            placeholder="Module name"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Description *</label>
                                    <textarea
                                        value={assignment.description}
                                        onChange={(e) => handleAssignmentChange(index, 'description', e.target.value)}
                                        placeholder="Detailed assignment description..."
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Skills to Practice</label>
                                    <input
                                        type="text"
                                        value={assignment.skillsToPractice}
                                        onChange={(e) => handleAssignmentChange(index, 'skillsToPractice', e.target.value)}
                                        placeholder="e.g., Data Analysis, Problem Solving"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Submission Deadline *</label>
                                        <input
                                            type="datetime-local"
                                            value={assignment.deadline}
                                            onChange={(e) => handleAssignmentChange(index, 'deadline', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Evaluation Criteria</label>
                                        <input
                                            type="text"
                                            value={assignment.evaluationCriteria}
                                            onChange={(e) => handleAssignmentChange(index, 'evaluationCriteria', e.target.value)}
                                            placeholder="e.g., 100 marks, A-F grade"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Resources (Links)</label>
                                    <textarea
                                        value={assignment.resources}
                                        onChange={(e) => handleAssignmentChange(index, 'resources', e.target.value)}
                                        placeholder="Paste reference links, one per line..."
                                        rows="2"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Attachments</label>
                                    <input
                                        type="file"
                                        onChange={(e) => handleAssignmentFileChange(index, e.target.files[0])}
                                        multiple
                                    />
                                    {assignment.attachments && (
                                        <span className="file-name">📎 {assignment.attachments.name}</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            className="add-btn large"
                            onClick={addAssignment}
                        >
                            + Add Another Assignment
                        </button>
                    </div>
                )}

                {/* Section 4: Training Materials Shared */}
                {activeSection === 4 && (
                    <div className="form-section">
                        <h2>📁 Training Materials Shared</h2>

                        <div className="form-group">
                            <label>Presentation Slides (PPT/PDF)</label>
                            <input
                                type="file"
                                onChange={(e) => handleFileChange('materials', 'slides', e.target.files[0])}
                                accept=".ppt,.pptx,.pdf"
                            />
                            {formData.materials.slides && (
                                <span className="file-name">📎 {formData.materials.slides.name}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Reading Material (Documents)</label>
                            <input
                                type="file"
                                onChange={(e) => handleFileChange('materials', 'readingMaterial', e.target.files[0])}
                                accept=".pdf,.doc,.docx"
                            />
                            {formData.materials.readingMaterial && (
                                <span className="file-name">📎 {formData.materials.readingMaterial.name}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Video Links</label>
                            <textarea
                                value={formData.materials.videoLinks}
                                onChange={(e) => handleNestedChange('materials', 'videoLinks', e.target.value)}
                                placeholder="Paste video links (YouTube, Vimeo, etc.), one per line..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Practice Files (Templates, Samples)</label>
                            <input
                                type="file"
                                onChange={(e) => handleFileChange('materials', 'practiceFiles', e.target.files[0])}
                                multiple
                            />
                            {formData.materials.practiceFiles && (
                                <span className="file-name">📎 {formData.materials.practiceFiles.name}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Additional Resources</label>
                            <textarea
                                value={formData.materials.additionalResources}
                                onChange={(e) => handleNestedChange('materials', 'additionalResources', e.target.value)}
                                placeholder="External links, websites, articles..."
                                rows="3"
                            />
                        </div>
                    </div>
                )}

                {/* Section 5: Trainee Engagement Notes */}
                {activeSection === 5 && (
                    <div className="form-section">
                        <h2>👥 Trainee Engagement Notes</h2>

                        <div className="form-group">
                            <label>Participation Level</label>
                            <textarea
                                value={formData.engagement.participationLevel}
                                onChange={(e) => handleNestedChange('engagement', 'participationLevel', e.target.value)}
                                placeholder="Who actively participated? Name students and their contribution level..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Important Questions Asked</label>
                            <textarea
                                value={formData.engagement.questionsAsked}
                                onChange={(e) => handleNestedChange('engagement', 'questionsAsked', e.target.value)}
                                placeholder="List important questions raised by trainees..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Challenges Faced by Trainees</label>
                            <textarea
                                value={formData.engagement.challengesFaced}
                                onChange={(e) => handleNestedChange('engagement', 'challengesFaced', e.target.value)}
                                placeholder="What difficulties did trainees encounter during the session..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Performance Highlights</label>
                            <textarea
                                value={formData.engagement.performanceHighlights}
                                onChange={(e) => handleNestedChange('engagement', 'performanceHighlights', e.target.value)}
                                placeholder="Notable achievements, excellent performance by specific trainees..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Areas of Improvement</label>
                            <textarea
                                value={formData.engagement.areasOfImprovement}
                                onChange={(e) => handleNestedChange('engagement', 'areasOfImprovement', e.target.value)}
                                placeholder="What needs improvement? Topics to revisit, skills to strengthen..."
                                rows="3"
                            />
                        </div>
                    </div>
                )}

                {/* Section 6: Next Session Planning */}
                {activeSection === 6 && (
                    <div className="form-section">
                        <h2>🎯 Next Session Planning</h2>

                        <div className="form-group">
                            <label>Next Topic</label>
                            <input
                                type="text"
                                value={formData.nextSession.nextTopic}
                                onChange={(e) => handleNestedChange('nextSession', 'nextTopic', e.target.value)}
                                placeholder="What will be covered in the next session..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Prerequisites for Trainees</label>
                            <textarea
                                value={formData.nextSession.prerequisites}
                                onChange={(e) => handleNestedChange('nextSession', 'prerequisites', e.target.value)}
                                placeholder="What should trainees prepare or review before the next session..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Materials Needed</label>
                            <textarea
                                value={formData.nextSession.materialsNeeded}
                                onChange={(e) => handleNestedChange('nextSession', 'materialsNeeded', e.target.value)}
                                placeholder="What materials, tools, or resources are needed for next session..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Reminders</label>
                            <textarea
                                value={formData.nextSession.reminders}
                                onChange={(e) => handleNestedChange('nextSession', 'reminders', e.target.value)}
                                placeholder="Important reminders for trainees or yourself..."
                                rows="3"
                            />
                        </div>
                    </div>
                )}

                {/* Form Actions */}
                <div className="form-actions">
                    {activeSection > 1 && (
                        <button 
                            type="button" 
                            className="btn-secondary"
                            onClick={() => setActiveSection(activeSection - 1)}
                        >
                            ← Previous
                        </button>
                    )}
                    
                    {activeSection < 6 && (
                        <button 
                            type="button" 
                            className="btn-primary"
                            onClick={() => setActiveSection(activeSection + 1)}
                        >
                            Next →
                        </button>
                    )}
                    
                    {activeSection === 6 && (
                        <button type="submit" className="btn-success">
                            ✓ Submit Daily Diary
                        </button>
                    )}
                </div>
            </form>

<style>
    {
        `
        .daily-diary-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background: #f5f7fa;
    min-height: 100vh;
}

.diary-header {
    text-align: center;
    margin-bottom: 40px;
    padding: 30px 20px;
    background: linear-gradient(135deg, #fc2b5a 0%, #d81b60 100%);
    border-radius: 15px;
    color: white;
    box-shadow: 0 10px 30px rgba(252, 43, 90, 0.3);
}

.diary-header h1 {
    margin: 0 0 10px 0;
    font-size: 2.5em;
    font-weight: 700;
}

.diary-header p {
    margin: 0;
    font-size: 1.1em;
    opacity: 0.9;
}

/* Section Navigation */
.section-navigation {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
    overflow-x: auto;
    padding: 10px 0;
    flex-wrap: wrap;
    justify-content: center;
}

.section-navigation button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 15px 20px;
    background: white;
    border: 2px solid #e0e7ff;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9em;
    font-weight: 500;
    color: #64748b;
    min-width: 120px;
}

.section-navigation button:hover {
    border-color: #fc2b5a;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(252, 43, 90, 0.2);
}

.section-navigation button.active {
    background: linear-gradient(135deg, #fc2b5a 0%, #d81b60 100%);
    border-color: #fc2b5a;
    color: white;
    box-shadow: 0 5px 15px rgba(252, 43, 90, 0.3);
}

.section-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background: rgba(252, 43, 90, 0.1);
    border-radius: 50%;
    font-weight: bold;
    font-size: 1.1em;
}

.section-navigation button.active .section-number {
    background: rgba(255, 255, 255, 0.3);
}

/* Form Styling */
.diary-form {
    background: white;
    border-radius: 15px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
    padding: 40px;
    margin-bottom: 30px;
}

.form-section h2 {
    margin: 0 0 30px 0;
    color: #1e293b;
    font-size: 1.8em;
    padding-bottom: 15px;
    border-bottom: 3px solid #fc2b5a;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 25px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #334155;
    font-weight: 600;
    font-size: 0.95em;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="time"],
.form-group input[type="number"],
.form-group input[type="datetime-local"],
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1em;
    transition: all 0.3s ease;
    font-family: inherit;
    background: #f8fafc;
}

.form-group select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23334155' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 15px center;
    padding-right: 40px;
}

.form-group select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #e2e8f0;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #fc2b5a;
    background: white;
    box-shadow: 0 0 0 3px rgba(252, 43, 90, 0.1);
}

.form-group textarea {
    resize: vertical;
    min-height: 80px;
}

.form-group input[type="file"] {
    width: 100%;
    padding: 10px;
    border: 2px dashed #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.3s ease;
}

.form-group input[type="file"]:hover {
    border-color: #fc2b5a;
    background: #ffe4ec;
}

.file-name {
    display: inline-block;
    margin-top: 8px;
    padding: 5px 12px;
    background: #e0e7ff;
    color: #4c51bf;
    border-radius: 5px;
    font-size: 0.9em;
}

/* Radio Buttons */
.radio-group {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
}

.radio-label:hover {
    border-color: #fc2b5a;
    background: #ffe4ec;
}

.radio-label input[type="radio"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
    accent-color: #fc2b5a;
}

/* Array Input Groups */
.array-input-group {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
    align-items: center;
}

.array-input-group input {
    flex: 1;
}

/* Buttons */
.add-btn {
    padding: 10px 20px;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    font-size: 0.9em;
    margin-top: 10px;
}

.add-btn:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
}

.add-btn.large {
    width: 100%;
    padding: 15px;
    font-size: 1em;
    margin-top: 20px;
}

.remove-btn {
    padding: 8px 15px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    font-size: 0.9em;
    white-space: nowrap;
}

.remove-btn:hover {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
}

/* Assignment Cards */
.assignment-card {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
}

.assignment-card:hover {
    border-color: #fc2b5a;
    box-shadow: 0 5px 15px rgba(252, 43, 90, 0.1);
}

.assignment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e2e8f0;
}

.assignment-header h3 {
    margin: 0;
    color: #1e293b;
    font-size: 1.3em;
}

/* Form Actions */
.form-actions {
    display: flex;
    gap: 15px;
    justify-content: flex-end;
    margin-top: 30px;
    padding-top: 30px;
    border-top: 2px solid #e2e8f0;
    flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-success {
    padding: 15px 30px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 1em;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-primary {
    background: linear-gradient(135deg, #fc2b5a 0%, #d81b60 100%);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(252, 43, 90, 0.4);
}

.btn-secondary {
    background: #64748b;
    color: white;
}

.btn-secondary:hover {
    background: #475569;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(100, 116, 139, 0.3);
}

.btn-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    font-size: 1.1em;
    padding: 15px 40px;
}

.btn-success:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(16, 185, 129, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
    .daily-diary-container {
        padding: 15px;
    }

    .diary-header h1 {
        font-size: 1.8em;
    }

    .diary-form {
        padding: 25px;
    }

    .form-section h2 {
        font-size: 1.4em;
    }

    .section-navigation {
        flex-wrap: wrap;
    }

    .section-navigation button {
        min-width: 100px;
        padding: 12px 15px;
        font-size: 0.85em;
    }

    .form-row {
        grid-template-columns: 1fr;
    }

    .form-actions {
        flex-direction: column;
        gap: 10px;
    }

    .form-actions button {
        width: 100%;
        justify-content: center;
    }

    .radio-group {
        flex-direction: column;
        gap: 10px;
    }

    .assignment-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .assignment-header .remove-btn {
        width: 100%;
    }
}

/* Loading and Success States */
.success-message {
    padding: 15px 20px;
    background: #d1fae5;
    border: 2px solid #10b981;
    border-radius: 8px;
    color: #065f46;
    margin-bottom: 20px;
    font-weight: 600;
}

.error-message {
    padding: 15px 20px;
    background: #fee2e2;
    border: 2px solid #ef4444;
    border-radius: 8px;
    color: #991b1b;
    margin-bottom: 20px;
    font-weight: 600;
}

/* Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.form-section {
    animation: fadeIn 0.4s ease-out;
}

/* Accessibility */
*:focus-visible {
    outline: 3px solid #fc2b5a;
    outline-offset: 2px;
}

/* Print Styles */
@media print {
    .section-navigation,
    .form-actions {
        display: none;
    }

    .diary-form {
        box-shadow: none;
    }
}

  
 `
}
</style>
        </div>
    );
}

export default DailyDiary;