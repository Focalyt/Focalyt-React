import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Batch from './Batch';
import './listView.css';

const NewTrainingBatches = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;
  const headers = { 'x-auth': token };

  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);

  const [departmentId, setDepartmentId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [centerId, setCenterId] = useState('');
  const [courseId, setCourseId] = useState('');

  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [message, setMessage] = useState('');
  const [searched, setSearched] = useState(null);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await axios.get(`${backendUrl}/college/getVerticals`, { headers });
        const list = (response.data?.data || []).map((item) => ({
          _id: String(item._id),
          name: item.name || 'Untitled department',
        }));
        setDepartments(list);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
        setMessage('Could not load departments.');
      } finally {
        setLoadingDepartments(false);
      }
    };
    loadDepartments();
  }, [backendUrl, token]);

  useEffect(() => {
    if (!departmentId) {
      setProjects([]);
      return undefined;
    }
    let cancelled = false;
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await axios.get(`${backendUrl}/college/list-projects`, {
          headers,
          params: { vertical: departmentId },
        });
        if (!cancelled) setProjects(response.data?.data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        if (!cancelled) {
          setProjects([]);
          setMessage('Could not load projects.');
        }
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    };
    loadProjects();
    return () => {
      cancelled = true;
    };
  }, [departmentId, backendUrl, token]);

  useEffect(() => {
    if (!projectId) {
      setCenters([]);
      return undefined;
    }
    let cancelled = false;
    const loadCenters = async () => {
      setLoadingCenters(true);
      try {
        const response = await axios.get(`${backendUrl}/college/list-centers`, {
          headers,
          params: { projectId },
        });
        if (!cancelled) setCenters(response.data?.data || []);
      } catch (error) {
        console.error('Error fetching centers:', error);
        if (!cancelled) {
          setCenters([]);
          setMessage('Could not load centers.');
        }
      } finally {
        if (!cancelled) setLoadingCenters(false);
      }
    };
    loadCenters();
    return () => {
      cancelled = true;
    };
  }, [projectId, backendUrl, token]);

  useEffect(() => {
    if (!projectId || !centerId) {
      setCourses([]);
      return undefined;
    }
    let cancelled = false;
    const loadCourses = async () => {
      setLoadingCourses(true);
      try {
        const response = await axios.get(`${backendUrl}/college/all_coursescopy_centerwise`, {
          headers,
          params: { projectId, centerId },
        });
        if (!cancelled) setCourses(response.data?.data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        if (!cancelled) {
          setCourses([]);
          setMessage('Could not load courses.');
        }
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    };
    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [projectId, centerId, backendUrl, token]);

  const onDepartmentChange = (value) => {
    setDepartmentId(value);
    setProjectId('');
    setCenterId('');
    setCourseId('');
    setSearched(null);
    setMessage('');
  };

  const onProjectChange = (value) => {
    setProjectId(value);
    setCenterId('');
    setCourseId('');
    setSearched(null);
    setMessage('');
  };

  const onCenterChange = (value) => {
    setCenterId(value);
    setCourseId('');
    setSearched(null);
    setMessage('');
  };

  const onCourseChange = (value) => {
    setCourseId(value);
    setSearched(null);
    setMessage('');
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (!departmentId || !projectId || !centerId || !courseId) {
      setMessage('Select department, project, center, and course.');
      setSearched(null);
      return;
    }
    const department = departments.find((item) => item._id === departmentId);
    const project = projects.find((item) => String(item._id) === projectId);
    const center = centers.find((item) => String(item._id) === centerId);
    const course = courses.find((item) => String(item._id) === courseId);
    setMessage('');
    setSearched({
      vertical: department ? { ...department, id: department._id } : null,
      project: project || null,
      center: center || null,
      course: course || null,
    });
  };

  const clearSearch = () => setSearched(null);

  if (searched?.course && searched?.center) {
    return (
      <Batch
        selectedVertical={searched.vertical}
        selectedProject={searched.project}
        selectedCenter={searched.center}
        selectedCourse={searched.course}
        onBackToVerticals={clearSearch}
        onBackToProjects={clearSearch}
        onBackToCenters={clearSearch}
        onBackToCourses={clearSearch}
      />
    );
  }

  return (
    <div className="container py-4 vt-page vt-screen-enter">
      <div className="vt-shell">
        <div className="vt-head">
          <div>
            <p className="vt-kicker">Training</p>
            <h4 style={{ margin: '2px 0 0', fontWeight: 800, color: '#1e293b' }}>Batches</h4>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ marginTop: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <label>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9f1239', marginBottom: 6 }}>Department</span>
              <select className="form-select" value={departmentId} onChange={(e) => onDepartmentChange(e.target.value)} disabled={loadingDepartments}>
                <option value="">{loadingDepartments ? 'Loading...' : 'Select department'}</option>
                {departments.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9f1239', marginBottom: 6 }}>Project</span>
              <select className="form-select" value={projectId} onChange={(e) => onProjectChange(e.target.value)} disabled={!departmentId || loadingProjects}>
                <option value="">{loadingProjects ? 'Loading...' : 'Select project'}</option>
                {projects.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9f1239', marginBottom: 6 }}>Center</span>
              <select className="form-select" value={centerId} onChange={(e) => onCenterChange(e.target.value)} disabled={!projectId || loadingCenters}>
                <option value="">{loadingCenters ? 'Loading...' : 'Select center'}</option>
                {centers.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9f1239', marginBottom: 6 }}>Course</span>
              <select className="form-select" value={courseId} onChange={(e) => onCourseChange(e.target.value)} disabled={!centerId || loadingCourses}>
                <option value="">{loadingCourses ? 'Loading...' : 'Select course'}</option>
                {courses.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="vt-add">Search</button>
          </div>
          {message && <p className="text-danger mt-3 mb-0">{message}</p>}
        </form>

        <div className="vt-empty">
          <i className="bi bi-funnel"></i>
          <h5>Search to see batches</h5>
          <p>Choose department, project, center, and course, then search.</p>
        </div>
      </div>
    </div>
  );
};

export default NewTrainingBatches;
