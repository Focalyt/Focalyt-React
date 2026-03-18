import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import liveClassSocketService from '../../../../services/socket/liveClassSocket';

function StartLiveClass() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batchId');
  const courseId = searchParams.get('courseId');

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const token = JSON.parse(sessionStorage.getItem('token') || 'null');
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    batchId: batchId || '',
    courseId: courseId || '',
    scheduledDate: new Date().toISOString().slice(0, 16),
    scheduledDuration: 60,
    maxParticipants: 100,
    allowStudentVideo: false,
    allowStudentAudio: true,
    allowScreenShare: true,
    recordingEnabled: false,
    chatEnabled: true,
    notes: ''
  });

  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchBatches();
    fetchCourses();
    fetchScheduledClasses();
    
    // Initialize socket connection
    if (userData._id) {
      liveClassSocketService.connect(userData._id, userData.name, 'trainer', token);
    }

    return () => {
      liveClassSocketService.cleanup();
    };
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await axios.get(`${backendUrl}/college/getbatch`, {
        headers: { 'x-auth': token }
      });
      if (res.data && res.data.status) {
        setBatches(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${backendUrl}/college/getcourses`, {
        headers: { 'x-auth': token }
      });
      if (res.data && res.data.status) {
        setCourses(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchScheduledClasses = async () => {
    try {
      if (!batchId) return;
      
      const res = await axios.get(`${backendUrl}/api/live-class/batch/${batchId}`, {
        headers: { 'x-auth': token }
      });
      if (res.data && res.data.status) {
        setClasses(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${backendUrl}/api/live-class/create`, formData, {
        headers: { 'x-auth': token }
      });

      if (res.data && res.data.status) {
        const newClass = res.data.data;
        // Create room via socket
        liveClassSocketService.createRoom(
          newClass._id,
          newClass.batchId,
          newClass.courseId,
          (response) => {
            if (response.error) {
              alert('Error creating room: ' + response.error);
            } else {
              // Navigate to live class room
              navigate(`/trainer/live-class/room?classId=${newClass._id}`);
            }
          }
        );
      }
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Error creating live class: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setShowCreateModal(false);
    }
  };

  const handleStartClass = async (classId) => {
    setLoading(true);
    try {
      // Create room via socket
      liveClassSocketService.createRoom(
        classId,
        formData.batchId,
        formData.courseId,
        (response) => {
          if (response.error) {
            alert('Error starting class: ' + response.error);
          } else {
            navigate(`/trainer/live-class/room?classId=${classId}`);
          }
        }
      );
    } catch (error) {
      console.error('Error starting class:', error);
      alert('Error starting class: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Live Class Management</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
            >
              <i className="feather icon-plus me-2"></i>
              Create New Class
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Classes */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Scheduled Classes</h5>
            </div>
            <div className="card-body">
              {classes.length === 0 ? (
                <p className="text-muted">No scheduled classes found</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Scheduled Date</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Participants</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((classItem) => (
                        <tr key={classItem._id}>
                          <td>{classItem.title}</td>
                          <td>{new Date(classItem.scheduledDate).toLocaleString()}</td>
                          <td>{classItem.scheduledDuration} min</td>
                          <td>
                            <span className={`badge ${
                              classItem.status === 'live' ? 'bg-success' :
                              classItem.status === 'ended' ? 'bg-secondary' :
                              'bg-warning'
                            }`}>
                              {classItem.status}
                            </span>
                          </td>
                          <td>{classItem.currentParticipants || 0}/{classItem.maxParticipants}</td>
                          <td>
                            {classItem.status === 'scheduled' && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleStartClass(classItem._id)}
                                disabled={loading}
                              >
                                Start Class
                              </button>
                            )}
                            {classItem.status === 'live' && (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => navigate(`/trainer/live-class/room?classId=${classItem._id}`)}
                              >
                                Join Class
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Live Class</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateClass}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Batch *</label>
                      <select
                        className="form-select"
                        value={formData.batchId}
                        onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                        required
                      >
                        <option value="">Select Batch</option>
                        {batches.map((batch) => (
                          <option key={batch._id} value={batch._id}>
                            {batch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Course *</label>
                      <select
                        className="form-select"
                        value={formData.courseId}
                        onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                        required
                      >
                        <option value="">Select Course</option>
                        {courses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Scheduled Date & Time *</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Duration (minutes) *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.scheduledDuration}
                        onChange={(e) => setFormData({ ...formData, scheduledDuration: e.target.value })}
                        required
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Max Participants</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      min="1"
                    />
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.allowStudentAudio}
                        onChange={(e) => setFormData({ ...formData, allowStudentAudio: e.target.checked })}
                      />
                      <label className="form-check-label">Allow Student Audio</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.allowStudentVideo}
                        onChange={(e) => setFormData({ ...formData, allowStudentVideo: e.target.checked })}
                      />
                      <label className="form-check-label">Allow Student Video</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.allowScreenShare}
                        onChange={(e) => setFormData({ ...formData, allowScreenShare: e.target.checked })}
                      />
                      <label className="form-check-label">Allow Screen Share</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.recordingEnabled}
                        onChange={(e) => setFormData({ ...formData, recordingEnabled: e.target.checked })}
                      />
                      <label className="form-check-label">Enable Recording</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.chatEnabled}
                        onChange={(e) => setFormData({ ...formData, chatEnabled: e.target.checked })}
                      />
                      <label className="form-check-label">Enable Chat</label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create & Start Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StartLiveClass;
