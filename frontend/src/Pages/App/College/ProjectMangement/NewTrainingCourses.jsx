import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Batch from './Batch';
import './listView.css';

const labelOf = (value) => {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  return value.name || '—';
};

const idOf = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
};

const centerIdsOf = (course) => {
  const list = Array.isArray(course?.center) ? course.center : course?.center ? [course.center] : [];
  return list.map(idOf).filter(Boolean);
};

const NewTrainingCourses = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [centerCourse, setCenterCourse] = useState(null);
  const [centerOptions, setCenterOptions] = useState([]);
  const [selectedCenterIds, setSelectedCenterIds] = useState([]);
  const [centersLoading, setCentersLoading] = useState(false);
  const [savingCenters, setSavingCenters] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await axios.get(`${backendUrl}/college/all_courses`, {
          params: { scope: 'all' },
          headers: { 'x-auth': token },
        });
        const list = (response.data?.data || []).map((course) => ({
          ...course,
          status: course.status === true || course.status === 'active' ? 'active' : 'inactive',
        }));
        setCourses(list);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [backendUrl, token]);

  const filteredCourses = courses.filter((course) => {
    if (activeTab === 'Active' && course.status !== 'active') return false;
    if (activeTab === 'Inactive' && course.status !== 'inactive') return false;
    const haystack = [
      course.name,
      labelOf(course.vertical),
      labelOf(course.project),
    ].join(' ').toLowerCase();
    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  const openAssignCenter = async (course) => {
    setAssignMessage('');
    setCenterCourse(course);
    setSelectedCenterIds(centerIdsOf(course));
    setCentersLoading(true);
    try {
      const projectId = idOf(course.project);
      const response = await axios.get(`${backendUrl}/college/list-centers`, {
        params: projectId ? { projectId } : {},
        headers: { 'x-auth': token },
      });
      setCenterOptions(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching centers:', error);
      setCenterOptions([]);
      setAssignMessage('Could not load centers.');
    } finally {
      setCentersLoading(false);
    }
  };

  const toggleCenter = (centerId) => {
    setSelectedCenterIds((prev) => (
      prev.includes(centerId) ? prev.filter((id) => id !== centerId) : [...prev, centerId]
    ));
  };

  const saveAssignedCenters = async () => {
    if (!centerCourse || selectedCenterIds.length === 0) {
      setAssignMessage('Select at least one center.');
      return;
    }
    setSavingCenters(true);
    setAssignMessage('');
    try {
      const response = await axios.post(`${backendUrl}/college/assign-center-to-course`, {
        courseId: centerCourse._id,
        centers: selectedCenterIds,
      }, {
        headers: { 'x-auth': token },
      });
      if (!response.data?.status) {
        setAssignMessage(response.data?.message || 'Could not assign the center.');
        return;
      }
      setCourses((prev) => prev.map((course) => (
        course._id === centerCourse._id
          ? { ...course, center: selectedCenterIds }
          : course
      )));
      setCenterCourse(null);
    } catch (error) {
      setAssignMessage(error?.response?.data?.message || 'Could not assign the center.');
    } finally {
      setSavingCenters(false);
    }
  };

  const openCourse = (course) => {
    const center = Array.isArray(course.center) ? course.center[0] : course.center;
    const vertical = course.vertical && typeof course.vertical === 'object' ? course.vertical : null;
    const project = course.project && typeof course.project === 'object' ? course.project : null;

    setSelectedCourse({
      course,
      center: center && typeof center === 'object' ? center : null,
      project,
      vertical: vertical ? { ...vertical, id: vertical._id || vertical.id } : null,
    });
  };

  if (selectedCourse) {
    return (
      <div className="vt-screen-enter">
        <Batch
          selectedCourse={selectedCourse.course}
          selectedCenter={selectedCourse.center}
          selectedProject={selectedCourse.project}
          selectedVertical={selectedCourse.vertical}
          onBackToCourses={() => setSelectedCourse(null)}
        />
      </div>
    );
  }

  return (
    <div className="container py-4 vt-page vt-screen-enter">
      <div className="vt-shell">
        <div className="vt-head">
          <div>
            <p className="vt-kicker">Training</p>
            <h4 style={{ margin: '2px 0 0', fontWeight: 800, color: '#1e293b' }}>Courses</h4>
          </div>
        </div>

        <div className="vt-toolbar">
          <div className="vt-tabs">
            {['Active', 'Inactive', 'All'].map((tab) => (
              <button
                type="button"
                key={tab}
                className={activeTab === tab ? 'is-active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <input
            className="vt-search"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="vt-empty">
            <h5>Loading courses...</h5>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="table-responsive">
            <table className="vt-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Project</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr
                    key={course._id}
                    className="vt-row"
                    title="Open batches"
                    onClick={() => openCourse(course)}
                  >
                    <td>{labelOf(course.vertical)}</td>
                    <td>{labelOf(course.project)}</td>
                    <td>
                      <span className="vt-name">
                        <span className="vt-avatar">{(course.name || '?').charAt(0).toUpperCase()}</span>
                        {course.name || 'Untitled course'}
                        <i className="bi bi-chevron-right vt-go"></i>
                      </span>
                    </td>
                    <td>
                      <span className={`vt-pill ${course.status === 'active' ? 'is-active' : ''}`}>
                        {course.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="vt-actions">
                        <button type="button" className="vt-action-text" onClick={() => openAssignCenter(course)}>
                          Assign Center
                        </button>
                        <button type="button" className="vt-action-text" onClick={() => openCourse(course)}>
                          Assign Course
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="vt-empty">
            <i className="bi bi-book"></i>
            <h5>No courses found</h5>
            <p>Try another filter or search.</p>
          </div>
        )}
      </div>

      {centerCourse && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white" style={{ backgroundColor: '#fc2b5a' }}>
                <h5 className="modal-title">Assign Center — {centerCourse.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setCenterCourse(null)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">Select centers for this course's project.</p>
                {centersLoading ? (
                  <p>Loading centers...</p>
                ) : centerOptions.length === 0 ? (
                  <p>No centers found for this project.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {centerOptions.map((center) => {
                      const centerId = String(center._id);
                      return (
                        <label key={centerId} className="d-flex align-items-center gap-2 mb-0">
                          <input
                            type="checkbox"
                            checked={selectedCenterIds.includes(centerId)}
                            onChange={() => toggleCenter(centerId)}
                          />
                          <span>{center.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {assignMessage && <p className="text-danger mt-3 mb-0">{assignMessage}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCenterCourse(null)}>Cancel</button>
                <button type="button" className="btn btn-danger" disabled={savingCenters || centersLoading} onClick={saveAssignedCenters}>
                  {savingCenters ? 'Saving...' : 'Assign Center'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewTrainingCourses;
