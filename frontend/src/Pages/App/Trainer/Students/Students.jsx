import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react';

function CreateAssignment() {
  const [meta, setMeta] = useState({
    title: '',
    durationMins: 30,
    passPercent: 40,
    totalMarks: 100,
    negativeMarkPerWrong: 0, // optional
  });

  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: '',
      options: ['', '', '', ''],
      correctIndex: null,   // 0..3
      marks: 5,             // per-question marks
    },
  ]);

  const totalAllocated = useMemo(
    () => questions.reduce((sum, q) => sum + Number(q.marks || 0), 0),
    [questions]
  );

  const isQuestionsValid = useMemo(() => {
    if (!questions.length) return false;
    for (const q of questions) {
      if (!q.question?.trim()) return false;
      if (q.correctIndex === null || q.correctIndex === undefined) return false;
      if (!q.options || q.options.length !== 4) return false;
      for (const op of q.options) {
        if (!op?.trim()) return false;
      }
      if (!q.marks || Number(q.marks) <= 0) return false;
    }
    return true;
  }, [questions]);

  const canSave =
    meta.title.trim() &&
    Number(meta.durationMins) > 0 &&
    Number(meta.passPercent) >= 0 &&
    Number(meta.passPercent) <= 100 &&
    isQuestionsValid &&
    Number(totalAllocated) === Number(meta.totalMarks);

  const handleQuestionChange = (id, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: value } : q))
    );
  };

  const handleOptionChange = (questionId, optionIndex, value) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const next = [...q.options];
        next[optionIndex] = value;
        return { ...q, options: next };
      })
    );
  };

  const handleCorrectIndexChange = (questionId, index) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, correctIndex: index } : q))
    );
  };

  const handleMarksChange = (questionId, value) => {
    const n = Number(value);
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, marks: isNaN(n) ? 0 : n } : q))
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((x) => x.id)) + 1 : 1,
        question: '',
        options: ['', '', '', ''],
        correctIndex: null,
        marks: 5,
      },
    ]);
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSave = () => {
    if (!canSave) {
      alert(
        'Please fix errors before saving.\n- Make sure all fields are filled\n- Sum of marks = 100\n- Select correct answer for each question'
      );
      return;
    }
    const payload = {
      meta: {
        title: meta.title.trim(),
        durationMins: Number(meta.durationMins),
        passPercent: Number(meta.passPercent),
        totalMarks: Number(meta.totalMarks),
        negativeMarkPerWrong: Number(meta.negativeMarkPerWrong || 0),
      },
      questions,
    };
    localStorage.setItem('assignment:v1', JSON.stringify(payload));
    alert('Assignment saved successfully!');
  };

  return (
    <div className="create-assignment-container">
      <div className="create-assignment-card">
        <h1 className="create-title">Create Assignment</h1>

       
        <div className="meta-grid">
          <div className="meta-field">
            <label>Title</label>
            <input
              type="text"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              placeholder="e.g., Week 1 Quiz"
            />
          </div>
          <div className="meta-field">
            <label>Duration (mins)</label>
            <input
              type="number"
              min={1}
              value={meta.durationMins}
              onChange={(e) => setMeta({ ...meta, durationMins: e.target.value })}
            />
          </div>
          <div className="meta-field">
            <label>Pass %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={meta.passPercent}
              onChange={(e) => setMeta({ ...meta, passPercent: e.target.value })}
            />
          </div>
          <div className="meta-field">
            <label>Total Marks</label>
            <input type="number" value={meta.totalMarks} disabled />
          </div>
          <div className="meta-field">
            <label>Negative Mark per wrong (optional)</label>
            <input
              type="number"
              step="0.25"
              min={0}
              value={meta.negativeMarkPerWrong}
              onChange={(e) =>
                setMeta({ ...meta, negativeMarkPerWrong: e.target.value })
              }
            />
          </div>
        </div>

        {/* Total allocated status */}
        <div
          className={`total-allocated ${totalAllocated === meta.totalMarks ? 'ok' : 'bad'}`}
        >
          Allocated Marks: <strong>{totalAllocated}</strong> / {meta.totalMarks}
          {totalAllocated !== meta.totalMarks && (
            <span className="warn">
              <AlertTriangle size={16} /> Sum must be exactly {meta.totalMarks}
            </span>
          )}
        </div>

        {questions.map((q, questionIndex) => (
          <div key={q.id} className="question-form">
            <div className="question-header">
              <h3>Question {questionIndex + 1}</h3>
              <div className="marks-wrap">
                <label>Marks</label>
                <input
                  type="number"
                  min={1}
                  value={q.marks}
                  onChange={(e) => handleMarksChange(q.id, e.target.value)}
                  className="marks-input"
                />
              </div>
              {questions.length > 1 && (
                <button className="remove-btn" onClick={() => removeQuestion(q.id)}>
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="Enter your question"
                value={q.question}
                onChange={(e) => handleQuestionChange(q.id, e.target.value)}
                className="question-input"
              />
            </div>

            <div className="options-group">
              {q.options.map((option, optionIndex) => (
                <div key={optionIndex} className="option-input-group">
                  <input
                    type="text"
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(e) =>
                      handleOptionChange(q.id, optionIndex, e.target.value)
                    }
                    className="option-input"
                  />
                  <label className="correct-flag">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctIndex === optionIndex}
                      onChange={() => handleCorrectIndexChange(q.id, optionIndex)}
                      className="correct-radio"
                    />
                    Correct
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="buttons-container">
          <button className="add-question-btn" onClick={addQuestion}>
            <Plus size={20} />
            Add Question
          </button>
          <button className="save-btn" onClick={handleSave} disabled={!canSave}>
            <Save size={20} />
            Save Assignment
          </button>
        </div>
      </div>

      <style>{`
        .create-assignment-container {
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }
        .create-assignment-card {
          background-color: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .create-title {
          color: #333;
          font-size: 2rem;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #eee;
        }
        .meta-grid{
          display:grid;
          grid-template-columns: repeat(auto-fit,minmax(180px,1fr));
          gap:1rem;
          margin-bottom: 1rem;
        }
        .meta-field{
          display:flex; flex-direction:column; gap:.5rem;
        }
        .meta-field label{ font-size:.9rem; color:#4a5568;}
        .meta-field input{
          padding:.6rem .75rem; border:1px solid #e2e8f0; border-radius:6px;
        }
        .total-allocated{
          display:flex; align-items:center; gap:.75rem;
          padding:.6rem .9rem; border-radius:8px; margin: .5rem 0 1rem;
          font-size:.95rem;
        }
        .total-allocated.ok{ background:#f0fff4; color:#22543d; border:1px solid #c6f6d5;}
        .total-allocated.bad{ background:#fff5f5; color:#742a2a; border:1px solid #fed7d7;}
        .total-allocated .warn{ display:inline-flex; align-items:center; gap:.4rem; margin-left:.5rem;}
        .question-form {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1rem;
          border:1px solid #edf2f7;
        }
        .question-header {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: .75rem;
          margin-bottom: 1rem;
        }
        .marks-wrap{ display:flex; align-items:center; gap:.5rem;}
        .marks-wrap label{ font-size:.9rem; color:#4a5568;}
        .marks-input{
          width:90px; padding:.5rem .6rem; border:1px solid #e2e8f0; border-radius:6px;
        }
        .remove-btn {
          background: none; border: none; color: #e53e3e; cursor: pointer; padding: 0.5rem; border-radius: 4px;
        }
        .remove-btn:hover { background-color: #fff5f5; }
        .form-group { margin-bottom: 1rem; }
        .question-input, .option-input {
          width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem;
        }
        .options-group { display: flex; flex-direction: column; gap: .75rem; }
        .option-input-group { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: .75rem; }
        .correct-flag{ display:flex; align-items:center; gap:.4rem; color:#2b6cb0; }
        .correct-radio { width: 18px; height: 18px; cursor: pointer; }
        .buttons-container { display: flex; justify-content: space-between; margin-top: 1.25rem; }
        .add-question-btn, .save-btn {
          display: flex; align-items: center; gap: 8px; padding: 0.75rem 1.2rem;
          border-radius: 6px; font-size: 1rem; cursor: pointer; transition: all 0.2s; border: none;
        }
        .add-question-btn { background-color: #48bb78; color: white; }
        .add-question-btn:hover { background-color: #38a169; }
        .save-btn { background-color: #4299e1; color: white; }
        .save-btn:disabled { background:#a0aec0; cursor:not-allowed; }
        .save-btn:not(:disabled):hover { background-color: #3182ce; }
        @media (max-width: 768px) {
          .create-assignment-container { padding: 1rem; }
          .create-assignment-card { padding: 1rem; }
          .buttons-container { flex-direction: column; gap: 1rem; }
          .add-question-btn, .save-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

export default CreateAssignment;