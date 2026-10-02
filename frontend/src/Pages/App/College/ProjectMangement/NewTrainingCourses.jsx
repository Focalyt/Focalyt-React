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

const centersLabel = (course) => {
  const list = Array.isArray(course?.center)
    ? course.center
    : course?.center
      ? [course.center]
      : course?.centerId
        ? [course.centerId]
        : [];
  const names = list.map(labelOf).filter((name) => name && name !== '—');
  return names.length ? names.join(', ') : '—';
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

  const [projectCourse, setProjectCourse] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [projectMessage, setProjectMessage] = useState('');
  const [copyingId, setCopyingId] = useState('');

  // Course training team: eligible senior trainers and trainers stored on course.trainers
  const [referCourse, setReferCourse] = useState(null);
  const [seniorTrainers, setSeniorTrainers] = useState([]);
  const [fieldTrainers, setFieldTrainers] = useState([]);
  const [trainersLoading, setTrainersLoading] = useState(false);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState([]);
  const [selectedFieldTrainerIds, setSelectedFieldTrainerIds] = useState([]);
  const [referSaving, setReferSaving] = useState(false);
  const [referMessage, setReferMessage] = useState('');

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
      centersLabel(course),
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
    const courseFeeType = centerCourse.courseFeeType;
    if (!courseFeeType) {
      setAssignMessage('Could not assign: course fee type is missing on this course.');
      return;
    }
    setSavingCenters(true);
    setAssignMessage('');
    try {
      const payload = {
        center: selectedCenterIds,
        courseFeeType,
      };
      if (courseFeeType === 'Paid') {
        if (!centerCourse.emiOptionAvailable) {
          setAssignMessage('Could not assign: set EMI option on the course first.');
          setSavingCenters(false);
          return;
        }
        payload.emiOptionAvailable = centerCourse.emiOptionAvailable;
      }

      const response = await axios.put(
        `${backendUrl}/college/courses/editcoursecopy/${centerCourse._id}`,
        payload,
        { headers: { 'x-auth': token } }
      );
      if (!response.data?.status) {
        setAssignMessage(response.data?.message || 'Could not assign the center.');
        return;
      }
      const assignedCenters = selectedCenterIds.map((id) => {
        const match = centerOptions.find((center) => String(center._id) === id);
        return match ? { _id: match._id, name: match.name } : { _id: id };
      });
      setCourses((prev) => prev.map((course) => (
        course._id === centerCourse._id
          ? { ...course, center: assignedCenters }
          : course
      )));
      setCenterCourse(null);
    } catch (error) {
      setAssignMessage(error?.response?.data?.message || 'Could not assign the center.');
    } finally {
      setSavingCenters(false);
    }
  };

  const openAssignProject = async (course) => {
    setProjectMessage('');
    setProjectCourse(course);
    setSelectedProjectId(idOf(course.project));
    setProjectsLoading(true);
    try {
      const verticalId = idOf(course.vertical);
      const response = await axios.get(
        `${backendUrl}/college/${verticalId ? 'list-projects' : 'list_all_projects'}`,
        {
          params: verticalId ? { vertical: verticalId } : {},
          headers: { 'x-auth': token },
        }
      );
      setProjectOptions(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjectOptions([]);
      setProjectMessage('Could not load projects.');
    } finally {
      setProjectsLoading(false);
    }
  };

  const saveAssignedProject = async () => {
    if (!projectCourse || !selectedProjectId) {
      setProjectMessage('Select a project.');
      return;
    }
    const courseFeeType = projectCourse.courseFeeType;
    if (!courseFeeType) {
      setProjectMessage('Could not assign: course fee type is missing on this course.');
      return;
    }
    setSavingProject(true);
    setProjectMessage('');
    try {
      const payload = {
        project: selectedProjectId,
        courseFeeType,
      };
      if (projectCourse.courseType) payload.courseType = projectCourse.courseType;
      if (projectCourse.ojt) payload.ojt = projectCourse.ojt;
      if (courseFeeType === 'Paid') {
        if (!projectCourse.emiOptionAvailable) {
          setProjectMessage('Could not assign: set EMI option on the course first.');
          setSavingProject(false);
          return;
        }
        payload.emiOptionAvailable = projectCourse.emiOptionAvailable;
      }

      const response = await axios.put(
        `${backendUrl}/college/courses/editcoursecopy/${projectCourse._id}`,
        payload,
        { headers: { 'x-auth': token } }
      );
      if (!response.data?.status) {
        setProjectMessage(response.data?.message || 'Could not assign the project.');
        return;
      }
      const assigned = projectOptions.find((project) => String(project._id) === selectedProjectId);
      setCourses((prev) => prev.map((course) => (
        course._id === projectCourse._id
          ? { ...course, project: assigned || { _id: selectedProjectId } }
          : course
      )));
      setProjectCourse(null);
    } catch (error) {
      setProjectMessage(error?.response?.data?.message || 'Could not assign the project.');
    } finally {
      setSavingProject(false);
    }
  };

  const copyCourse = async (course) => {
    setCopyingId(course._id);
    try {
      const response = await axios.post(
        `${backendUrl}/college/courses/${course._id}/duplicatecoursecopy`,
        {},
        { headers: { 'x-auth': token } }
      );
      if (!response.data?.success) {
        window.alert(response.data?.message || 'Could not copy this course.');
        return;
      }
      const created = response.data.data || {};
      setCourses((prev) => [{
        ...course,
        ...created,
        _id: created._id || created.id,
        name: created.name || `${course.name || 'Course'} (Copy)`,
        vertical: course.vertical,
        project: course.project,
        center: course.center,
        status: created.status === false || created.status === 'inactive' ? 'inactive' : 'active',
      }, ...prev]);
    } catch (error) {
      window.alert(error?.response?.data?.message || 'Could not copy this course.');
    } finally {
      setCopyingId('');
    }
  };

  const openAssignCourse = async (course) => {
    setReferMessage('');
    setReferCourse(course);
    setSelectedTrainerIds([]);
    setSelectedFieldTrainerIds([]);
    setSeniorTrainers([]);
    setFieldTrainers([]);
    setTrainersLoading(true);

    try {
      const [seniorRes, trainerRes, teamRes] = await Promise.all([
        axios.get(`${backendUrl}/college/users/training-role-users`, {
          headers: { 'x-auth': token },
          params: { roleType: 'senior', status: 'active' },
        }),
        axios.get(`${backendUrl}/college/users/training-role-users`, {
          headers: { 'x-auth': token },
          params: { roleType: 'trainer', status: 'active' },
        }),
        axios.get(`${backendUrl}/college/courses/${course._id}/training-team`, {
          headers: { 'x-auth': token },
        }),
      ]);

      const toPerson = (user, fallback) => ({
        id: String(user._id),
        name: user.name || user.email || fallback,
        email: user.email || '',
      });
      const seniors = (seniorRes.data?.data || []).filter((user) => user._id).map((user) => toPerson(user, 'Senior Trainer'));
      const seniorIds = new Set(seniors.map((person) => person.id));
      setSeniorTrainers(seniors);
      setFieldTrainers(
        (trainerRes.data?.data || [])
          .filter((user) => user._id && !seniorIds.has(String(user._id)))
          .map((user) => toPerson(user, 'Trainer'))
      );
      setSelectedTrainerIds((teamRes.data?.seniorTrainers || []).map((trainer) => String(trainer._id)));
      setSelectedFieldTrainerIds((teamRes.data?.trainers || []).map((trainer) => String(trainer._id)));
    } catch (error) {
      console.error('Error opening assign course:', error);
      setReferMessage('Could not load trainers.');
    } finally {
      setTrainersLoading(false);
    }
  };

  const closeAssignCourse = () => {
    setReferCourse(null);
    setReferMessage('');
  };

  const togglePerson = (setter, personId) => {
    setter((prev) => (
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    ));
  };

  const saveAssignCourse = async () => {
    if (selectedTrainerIds.length === 0 && selectedFieldTrainerIds.length === 0) {
      setReferMessage('Select a senior trainer or a trainer.');
      return;
    }

    setReferSaving(true);
    setReferMessage('');
    try {
      const response = await axios.put(
        `${backendUrl}/college/courses/${referCourse._id}/training-team`,
        {
          seniorTrainerIds: selectedTrainerIds,
          trainerIds: selectedFieldTrainerIds,
        },
        { headers: { 'x-auth': token } }
      );
      if (response.data?.success === false || response.data?.status === false) {
        setReferMessage(response.data?.message || 'Could not assign the training team.');
        return;
      }
      closeAssignCourse();
    } catch (error) {
      setReferMessage(error?.response?.data?.message || 'Could not assign the training team.');
    } finally {
      setReferSaving(false);
    }
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
                  <th>Centre</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr
                    key={course._id}
                    className="vt-row is-static"
                  >
                    <td>{labelOf(course.vertical)}</td>
                    <td>{labelOf(course.project)}</td>
                    <td>{centersLabel(course)}</td>
                    <td>
                      <span className="vt-name">
                        <span className="vt-avatar">{(course.name || '?').charAt(0).toUpperCase()}</span>
                        {course.name || 'Untitled course'}
                      </span>
                    </td>
                    <td>
                      <span className={`vt-pill ${course.status === 'active' ? 'is-active' : ''}`}>
                        {course.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="vt-actions">
                        <button type="button" title="Assign Project" onClick={() => openAssignProject(course)}>
                          <i className="bi bi-folder2"></i>
                        </button>
                        <button type="button" title="Assign Center" onClick={() => openAssignCenter(course)}>
                          <i className="bi bi-building"></i>
                        </button>
                        <button type="button" title="Assign Trainer" onClick={() => openAssignCourse(course)}>
                          <i className="bi bi-people"></i>
                        </button>
                        <button
                          type="button"
                          title="Copy"
                          disabled={copyingId === course._id}
                          onClick={() => copyCourse(course)}
                        >
                          <i className={`bi ${copyingId === course._id ? 'bi-hourglass-split' : 'bi-files'}`}></i>
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

      {projectCourse && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white" style={{ backgroundColor: '#fc2b5a' }}>
                <h5 className="modal-title">Assign Project — {projectCourse.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setProjectCourse(null)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">Select a project for this course.</p>
                {projectsLoading ? (
                  <p>Loading projects...</p>
                ) : projectOptions.length === 0 ? (
                  <p>No projects found for this department.</p>
                ) : (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: 280, overflow: 'auto' }}>
                    {projectOptions.map((project) => {
                      const projectId = String(project._id);
                      return (
                        <label key={projectId} className="d-flex align-items-center gap-2 mb-0">
                          <input
                            type="radio"
                            name="assignProject"
                            checked={selectedProjectId === projectId}
                            onChange={() => setSelectedProjectId(projectId)}
                          />
                          <span>{project.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {projectMessage && <p className="text-danger mt-3 mb-0">{projectMessage}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setProjectCourse(null)}>Cancel</button>
                <button type="button" className="btn btn-danger" disabled={savingProject || projectsLoading || !selectedProjectId} onClick={saveAssignedProject}>
                  {savingProject ? 'Saving...' : 'Assign Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {referCourse && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: 860 }}>
            <div className="modal-content">
              <div className="modal-header text-white" style={{ backgroundColor: '#fc2b5a' }}>
                <h5 className="modal-title">Assign Trainer — {referCourse.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeAssignCourse}></button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label fw-semibold">Senior trainer</label>
                    {trainersLoading ? (
                      <p>Loading...</p>
                    ) : seniorTrainers.length === 0 ? (
                      <p className="text-muted mb-0">No senior trainers found.</p>
                    ) : (
                      <div className="d-flex flex-column gap-2" style={{ maxHeight: 280, overflow: 'auto' }}>
                        {seniorTrainers.map((trainer) => (
                          <label
                            key={trainer.id}
                            className="d-flex align-items-center gap-2 mb-0 p-2 rounded"
                            style={{
                              background: selectedTrainerIds.includes(trainer.id) ? '#fff1f4' : 'transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTrainerIds.includes(trainer.id)}
                              onChange={() => togglePerson(setSelectedTrainerIds, trainer.id)}
                            />
                            <span>
                              <span className="d-block fw-semibold">{trainer.name}</span>
                              <span className="text-muted" style={{ fontSize: 12 }}>{trainer.email}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="form-label fw-semibold">Trainer</label>
                    {trainersLoading ? (
                      <p>Loading...</p>
                    ) : fieldTrainers.length === 0 ? (
                      <p className="text-muted mb-0">No trainers found.</p>
                    ) : (
                      <div className="d-flex flex-column gap-2" style={{ maxHeight: 280, overflow: 'auto' }}>
                        {fieldTrainers.map((trainer) => (
                          <label
                            key={trainer.id}
                            className="d-flex align-items-center gap-2 mb-0 p-2 rounded"
                            style={{
                              background: selectedFieldTrainerIds.includes(trainer.id) ? '#fff1f4' : 'transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedFieldTrainerIds.includes(trainer.id)}
                              onChange={() => togglePerson(setSelectedFieldTrainerIds, trainer.id)}
                            />
                            <span>
                              <span className="d-block fw-semibold">{trainer.name}</span>
                              <span className="text-muted" style={{ fontSize: 12 }}>{trainer.email}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {referMessage && <p className="text-danger mt-3 mb-0">{referMessage}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeAssignCourse}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={referSaving || trainersLoading || (selectedTrainerIds.length === 0 && selectedFieldTrainerIds.length === 0)}
                  onClick={saveAssignCourse}
                >
                  {referSaving ? 'Sending...' : 'Assign Trainer'}
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
