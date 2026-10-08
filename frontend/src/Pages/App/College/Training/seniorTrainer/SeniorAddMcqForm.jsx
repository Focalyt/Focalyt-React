import React, { useState, useEffect } from 'react';
import {
  addTotQuestionApi,
  TOT_PASS_PERCENT_DEFAULT,
  TOT_MARKS_MAX,
  toPositiveMarks,
  toPassPercentage,
  sumTotMarks,
  createSeniorMcqDraft,
} from './seniorTrainerShared';

const SeniorAddMcqForm = ({ session, token, backendUrl, onAdded }) => {
  const existingCount = Array.isArray(session?.totQuestionBank) ? session.totQuestionBank.length : 0;
  const [drafts, setDrafts] = useState([createSeniorMcqDraft()]);
  const [passPercentage, setPassPercentage] = useState(TOT_PASS_PERCENT_DEFAULT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDrafts([createSeniorMcqDraft()]);
    setPassPercentage(TOT_PASS_PERCENT_DEFAULT);
    setError('');
  }, [session?.id, existingCount]);

  const totMarksTotal = sumTotMarks(drafts);
  const totPassPercentValue = toPassPercentage(passPercentage, 0);
  const totPassMarks = totMarksTotal > 0 && totPassPercentValue > 0
    ? Math.ceil((totMarksTotal * totPassPercentValue) / 100)
    : 0;

  const bumpPassPercentage = (delta) => {
    setPassPercentage((prev) => Math.min(100, Math.max(1, toPassPercentage(prev) + delta)));
  };

  const handlePassPercentageChange = (raw) => {
    if (raw === '') {
      setPassPercentage('');
      return;
    }
    setPassPercentage(toPassPercentage(raw));
  };

  const updateDraft = (index, field, value) => {
    setDrafts((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const updateDraftOption = (questionIndex, optionIndex, value) => {
    setDrafts((prev) => prev.map((item, i) => {
      if (i !== questionIndex) return item;
      const options = [...item.options];
      options[optionIndex] = value;
      return { ...item, options };
    }));
  };

  const handleMarksChange = (index, raw) => {
    if (raw === '') {
      updateDraft(index, 'marks', '');
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    updateDraft(index, 'marks', Math.min(TOT_MARKS_MAX, Math.max(1, Math.round(n))));
  };

  const bumpMarks = (index, delta) => {
    setDrafts((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const next = Math.min(TOT_MARKS_MAX, Math.max(1, toPositiveMarks(item.marks, 1) + delta));
      return { ...item, marks: next };
    }));
  };

  const addDraft = () => {
    setDrafts((prev) => [...prev, createSeniorMcqDraft()]);
    setError('');
  };

  const removeDraft = (index) => {
    setDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSave = async () => {
    if (saving) return;
    const additions = drafts
      .map((item) => ({
        question: String(item.question || '').trim(),
        options: Array.isArray(item.options) ? item.options : ['', '', '', ''],
        correctIndex: Number(item.correctIndex) || 0,
        marks: toPositiveMarks(item.marks, 1),
      }))
      .filter((item) => item.question && item.options.some((option) => option.trim()));

    if (!additions.length) {
      setError('Add a question with at least one option');
      return;
    }
    if (!token || !backendUrl || !session?.id) {
      setError('Unable to save these questions');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = await addTotQuestionApi(backendUrl, token, session.id, {
        questions: additions,
        totPassPercentage: toPassPercentage(passPercentage),
      });
      if (typeof onAdded === 'function') onAdded(saved);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add MCQ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="st-add-mcq">
      <div className="st-add-mcq__head">
        <div>
          <strong>New MCQ</strong>
          <span>These questions are separate from the trainer’s previous attempt. Set marks and pass % for this new set only.</span>
        </div>
      </div>

      <div className="st-add-mcq__meta">
        <div className="st-add-mcq__stepper-wrap">
          <span>Pass %</span>
          <div className="st-add-mcq__stepper">
            <button type="button" onClick={() => bumpPassPercentage(-1)}>−</button>
            <input
              type="number"
              min={1}
              max={100}
              value={passPercentage === '' ? '' : toPassPercentage(passPercentage)}
              onChange={(e) => handlePassPercentageChange(e.target.value)}
            />
            <button type="button" onClick={() => bumpPassPercentage(1)}>+</button>
          </div>
        </div>
        <span className="st-add-mcq__chip">{drafts.length} question{drafts.length === 1 ? '' : 's'}</span>
        <span className="st-add-mcq__chip st-add-mcq__chip--mint">Total {totMarksTotal} mark{totMarksTotal === 1 ? '' : 's'}</span>
        {totMarksTotal > 0 && totPassPercentValue > 0 && (
          <span className="st-add-mcq__chip st-add-mcq__chip--amber">Pass {totPassMarks}+ ({totPassPercentValue}%)</span>
        )}
      </div>

      <div className="st-add-mcq__list">
        {drafts.map((question, questionIndex) => (
          <div key={question.id} className="st-add-mcq__card">
            <div className="st-add-mcq__card-head">
              <strong>Q{questionIndex + 1}</strong>
              <div className="st-add-mcq__card-tools">
                <div className="st-add-mcq__stepper-wrap">
                  <span>Marks</span>
                  <div className="st-add-mcq__stepper">
                    <button type="button" onClick={() => bumpMarks(questionIndex, -1)}>−</button>
                    <input
                      type="number"
                      min={1}
                      max={TOT_MARKS_MAX}
                      value={question.marks === '' ? '' : toPositiveMarks(question.marks, 1)}
                      onChange={(e) => handleMarksChange(questionIndex, e.target.value)}
                    />
                    <button type="button" onClick={() => bumpMarks(questionIndex, 1)}>+</button>
                  </div>
                </div>
                {drafts.length > 1 && (
                  <button type="button" className="st-add-mcq__remove" onClick={() => removeDraft(questionIndex)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            <input
              className="st-add-mcq__input"
              value={question.question}
              onChange={(e) => updateDraft(questionIndex, 'question', e.target.value)}
              placeholder="Type the question"
            />
            {(question.options || ['', '', '', '']).map((option, optionIndex) => (
              <label key={`${question.id}-opt-${optionIndex}`} className="st-add-mcq__option">
                <input
                  type="radio"
                  name={`st-mcq-correct-${question.id}`}
                  checked={Number(question.correctIndex) === optionIndex}
                  onChange={() => updateDraft(questionIndex, 'correctIndex', optionIndex)}
                />
                <input
                  className="st-add-mcq__input"
                  value={option}
                  onChange={(e) => updateDraftOption(questionIndex, optionIndex, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                />
              </label>
            ))}
          </div>
        ))}
      </div>

      <button type="button" className="st-add-mcq__add" onClick={addDraft}>
        + Add MCQ question
      </button>

      {error && <div className="st-add-mcq__error">{error}</div>}
      <div className="st-add-mcq__actions">
        <button type="button" className="sc-btn sc-btn--primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save new MCQ'}
        </button>
      </div>
    </div>
  );
};

export default SeniorAddMcqForm;
