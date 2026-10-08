import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  getLinkedCourseOptions,
  parseSessionDateKey,
} from './seniorTrainerShared';

const SessionAssignModal = ({
  session,
  centerOptions = [],
  courseOptions = [],
  allCentersMeta = [],
  allCoursesMeta = [],
  trainerOptions = [],
  loadingTrainers = false,
  backendUrl,
  token,
  onClose,
  onSave,
}) => {
  const [center, setCenter] = useState(session?.center ? String(session.center) : '');
  const [course, setCourse] = useState(session?.course ? String(session.course) : '');
  const [batch, setBatch] = useState(
    session?.batch && session.batch !== 'null' ? String(session.batch) : ''
  );
  const [assignDate, setAssignDate] = useState(parseSessionDateKey(session) || '');
  const [trainerId, setTrainerId] = useState(session?.fieldTrainerId ? String(session.fieldTrainerId) : '');
  const [batchOptions, setBatchOptions] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [saving, setSaving] = useState(false);

  const linkedCourseOptions = useMemo(
    () => getLinkedCourseOptions(center, courseOptions, allCentersMeta, allCoursesMeta),
    [center, courseOptions, allCentersMeta, allCoursesMeta]
  );

  useEffect(() => {
    if (!token || !center || !course) {
      setBatchOptions([]);
      return undefined;
    }
    let cancelled = false;
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const params = new URLSearchParams();
        params.set('centerId', center);
        params.set('courseId', course);
        const res = await axios.get(`${backendUrl}/college/get_batches?${params.toString()}`, {
          headers: { 'x-auth': token },
        });
        if (cancelled) return;
        if (res.data?.success) {
          setBatchOptions((res.data.data || []).map((batchItem) => ({
            value: String(batchItem._id),
            label: batchItem.name,
          })));
        } else {
          setBatchOptions([]);
        }
      } catch {
        if (!cancelled) setBatchOptions([]);
      } finally {
        if (!cancelled) setLoadingBatches(false);
      }
    };
    fetchBatches();
    return () => { cancelled = true; };
  }, [center, course, token, backendUrl]);

  if (!session) return null;

  const handleCenterChange = (value) => {
    setCenter(value);
    setCourse('');
    setBatch('');
  };

  const handleCourseChange = (value) => {
    setCourse(value);
    setBatch('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const centerName = centerOptions.find((option) => String(option.value) === String(center))?.label || '';
      const courseName = linkedCourseOptions.find((option) => String(option.value) === String(course))?.label || '';
      const batchCode = batchOptions.find((option) => String(option.value) === String(batch))?.label || '';
      await onSave(session.id, {
        center,
        course,
        batch,
        assignDate,
        trainerId,
        centerName,
        courseName,
        batchCode,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="st-modal-overlay" onClick={onClose}>
      <div className="st-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="st-modal__header">
          <h3><i className="fas fa-user-edit" /> Assign Session</h3>
          <button type="button" className="st-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="st-modal__body">
          <p className="st-modal__session-title">{session.title || 'Untitled session'}</p>

          <label className="st-modal-field">
            <span>Center</span>
            <select
              className="st-filter-select"
              value={center}
              onChange={(e) => handleCenterChange(e.target.value)}
            >
              <option value="">Select center</option>
              {centerOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="st-modal-field">
            <span>Course</span>
            <select
              className="st-filter-select"
              value={course}
              disabled={!center}
              onChange={(e) => handleCourseChange(e.target.value)}
            >
              <option value="">{!center ? 'Select center first' : 'Select course'}</option>
              {linkedCourseOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="st-modal-field">
            <span>Batch</span>
            <select
              className="st-filter-select"
              value={batch}
              disabled={!center || !course || loadingBatches}
              onChange={(e) => setBatch(e.target.value)}
            >
              <option value="">
                {!center || !course
                  ? 'Select center & course first'
                  : loadingBatches
                    ? 'Loading batches...'
                    : 'Select batch'}
              </option>
              {batchOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="st-modal-field">
            <span>Assign Date</span>
            <input
              type="date"
              className="st-table-input"
              value={assignDate}
              onChange={(e) => setAssignDate(e.target.value)}
            />
          </label>

          <label className="st-modal-field">
            <span>Trainer Name</span>
            <select
              className="st-filter-select"
              value={trainerId}
              disabled={loadingTrainers}
              onChange={(e) => setTrainerId(e.target.value)}
            >
              <option value="">{loadingTrainers ? 'Loading...' : 'Select trainer'}</option>
              {trainerOptions.map((trainer) => (
                <option key={trainer.value} value={trainer.value}>{trainer.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="st-modal__footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="st-btn st-btn--primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving...' : 'Save assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionAssignModal;
