import React, { useEffect, useState } from 'react';
import { useClub } from '../../../../contexts/ClubContext';

export const StudentProfilePage = () => {
  const { state, updateStudentProfile } = useClub();
  const [name, setName] = useState(state.currentStudent.name || '');
  const [department, setDepartment] = useState(state.currentStudent.department || '');
  const [bio, setBio] = useState(state.currentStudent.bio || '');

  useEffect(() => {
    setName(state.currentStudent.name || '');
    setDepartment(state.currentStudent.department || '');
    setBio(state.currentStudent.bio || '');
  }, [state.currentStudent.name, state.currentStudent.department, state.currentStudent.bio]);

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Profile</h1>
          <p>Club profile shown with your campus account.</p>
        </div>
      </div>

      <form
        className="club-list-page__panel"
        onSubmit={(e) => {
          e.preventDefault();
          updateStudentProfile({ name, department, bio });
        }}
      >
        <div className="form-field">
          <label className="form-label">Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-field" style={{ marginTop: 12 }}>
          <label className="form-label">Department</label>
          <input className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        <div className="form-field" style={{ marginTop: 12 }}>
          <label className="form-label">Bio</label>
          <textarea className="form-textarea" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        {state.currentStudent.email ? (
          <p className="club-list-page__meta" style={{ margin: '12px 0' }}>
            {state.currentStudent.email}
          </p>
        ) : null}
        <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm">
          Save profile
        </button>
      </form>
    </div>
  );
};

export default StudentProfilePage;
