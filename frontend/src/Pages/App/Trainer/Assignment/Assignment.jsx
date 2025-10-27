import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, Eye, EyeOff, Save, AlertTriangle, Database } from 'lucide-react';

function Assignment() {
  const [assignment, setAssignment] = useState(null);
  const [selected, setSelected] = useState({}); // { [q.id]: optionIndex }
  const [submitted, setSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('assignment:v1');
    if (raw) setAssignment(JSON.parse(raw));
  }, []);

  const hasAttemptedQuestions = useMemo(() => {
    if (!assignment?.questions?.length) return false;
    return assignment.questions.some((q) => selected[q.id] !== undefined);
  }, [assignment, selected]);

  const result = useMemo(() => {
    if (!submitted || !assignment) return null;

    const { questions, meta } = assignment;
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let marksFromCorrect = 0;
    const negEach = Number(meta?.negativeMarkPerWrong || 0);

    for (const q of questions) {
      const chosen = selected[q.id];
      if (chosen === q.correctIndex) {
        score += Number(q.marks || 0);
        marksFromCorrect += Number(q.marks || 0);
        correctCount++;
      } else {
        wrongCount++;
        score -= negEach;
      }
    }

    // clamp score min 0 (optional business rule)
    if (score < 0) score = 0;

    const total = Number(meta?.totalMarks || 100);
    const percent = total ? Math.round((score / total) * 10000) / 100 : 0;
    const pass = percent >= Number(meta?.passPercent || 40);
    const totalQuestions = questions.length;
    const attempted = Object.keys(selected).length;
    const unattempted = Math.max(totalQuestions - attempted, 0);
    const negativeDeducted = wrongCount * negEach;

    return {
      score,
      total,
      percent,
      pass,
      correctCount,
      wrongCount,
      attempted,
      unattempted,
      totalQuestions,
      marksFromCorrect,
      negativeDeducted,
    };
  }, [submitted, assignment, selected]);

  const handleAnswerChange = (questionId, optionIndex) => {
    setSelected((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!hasAttemptedQuestions) {
      alert('Please attempt at least one question before submitting.');
      return;
    }
    setSubmitted(true);
    setShowReview(true); // submit ke baad default: review open
  };

  if (!assignment) {
    return (
      <div className="assignment-container">
        <div className="assignment-card">
          <h1 className="assignment-title">Assignment</h1>
          <p>No assignment found. Please create & save an assignment first.</p>
        </div>
      </div>
    );
  }

  const { meta, questions } = assignment;

  return (
    <div className="assignment-container">
      <div className="assignment-card">
        <div className="title-row">
          <h1 className="assignment-title">{meta?.title || 'Assignment'}</h1>
          <div className="meta-pills">
            <span className="pill">Duration: {meta?.durationMins} mins</span>
            <span className="pill">Total: {meta?.totalMarks}</span>
            <span className="pill">Pass: {meta?.passPercent}%</span>
            {Number(meta?.negativeMarkPerWrong) > 0 && (
              <span className="pill">-{meta.negativeMarkPerWrong}/wrong</span>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="questions-container">
          {questions.map((q, index) => {
            const chosenIndex = selected[q.id];
            const isSubmitted = submitted;
            const isCorrect = isSubmitted && chosenIndex === q.correctIndex;

            return (
              <div key={q.id} className="question-card">
                <div className="qhead">
                  <h2 className="question-title">
                    Q{index + 1}. {q.question}
                  </h2>
                  <span className="qmarks">{q.marks} marks</span>
                </div>

                <div className="options-container">
                  {q.options.map((option, optIndex) => {
                    const checked = chosenIndex === optIndex;
                    const showState = isSubmitted && showReview;
                    const showAsCorrect = showState && optIndex === q.correctIndex;
                    const showAsWrong = showState && checked && optIndex !== q.correctIndex;

                    return (
                      <label
                        key={optIndex}
                        className={`option-label ${
                          showAsCorrect ? 'correct' : showAsWrong ? 'wrong' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={optIndex}
                          disabled={submitted}
                          checked={checked}
                          onChange={() => handleAnswerChange(q.id, optIndex)}
                        />
                        <span className="radio-custom"></span>
                        <span className="option-text">{option}</span>
                      </label>
                    );
                  })}
                </div>

                {submitted && showReview && (
                  <div className={`answer-footer ${isCorrect ? 'ok' : 'bad'}`}>
                    {isCorrect ? 'Correct' : `Correct Answer: ${q.options[q.correctIndex]}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit / Result */}
        {!submitted ? (
          <div className="submit-container">
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={!hasAttemptedQuestions}
              title={!hasAttemptedQuestions ? 'Attempt at least one question to enable submit' : ''}
            >
              <CheckCircle2 size={20} />
              <span>Submit Assignment</span>
            </button>
          </div>
        ) : (
          <>
            {/* Summary Result Card */}
            <div className="result-card">
              <div className="score-line">
                Score:&nbsp;
                <strong>{result.score}</strong> / {result.total} ({result.percent}%)
                &nbsp;—&nbsp;
                <strong className={result.pass ? 'pass' : 'fail'}>
                  {result.pass ? 'PASS' : 'FAIL'}
                </strong>
              </div>

              <div className="grid">
                <div className="kv"><span>Total Questions</span><b>{result.totalQuestions}</b></div>
                <div className="kv"><span>Attempted</span><b>{result.attempted}</b></div>
                <div className="kv"><span>Correct</span><b className="okc">{result.correctCount}</b></div>
                <div className="kv"><span>Wrong</span><b className="badc">{result.wrongCount}</b></div>
                <div className="kv"><span>Marks from Correct</span><b>{result.marksFromCorrect}</b></div>
                <div className="kv">
                  <span>Negative Deducted</span>
                  <b>{Number(meta?.negativeMarkPerWrong || 0) > 0 ? `-${result.negativeDeducted}` : 0}</b>
                </div>
                <div className="kv"><span>Final Score</span><b>{result.score}</b></div>
                <div className="kv"><span>Percentage</span><b>{result.percent}%</b></div>
              </div>

              <button
                className="review-toggle"
                onClick={() => setShowReview((s) => !s)}
              >
                {showReview ? <EyeOff size={18} /> : <Eye size={18} />}
                {showReview ? 'Hide Detailed Review' : 'Show Detailed Review'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .assignment-container { padding: 2rem; max-width: 900px; margin: 0 auto; }
        .assignment-card {
          background: #fff; border-radius: 12px; padding: 1.5rem 1.75rem;
          box-shadow: 0 2px 8px rgba(0,0,0,.1);
        }
        .title-row{ display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .assignment-title { color:#2d3748; font-size:1.6rem; }
        .meta-pills{ display:flex; gap:.5rem; flex-wrap:wrap; }
        .pill{ background:#edf2f7; color:#2d3748; padding:.35rem .6rem; border-radius:999px; font-size:.85rem; }

        .questions-container { display:flex; flex-direction:column; gap:1rem; margin-top:.75rem; }
        .question-card { background:#f8f9fa; border-radius:8px; padding:1rem; border:1px solid #e2e8f0; }
        .qhead{ display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-bottom:.5rem; }
        .qmarks{ font-weight:600; color:#4a5568; }
        .question-title { color:#2c3e50; font-size:1.05rem; }
        .options-container { display:flex; flex-direction:column; gap:.55rem; }
        .option-label {
          display:flex; align-items:center; cursor:pointer; padding:.55rem .6rem;
          border-radius:6px; transition:background-color .2s; border:1px solid transparent;
        }
        .option-label:hover { background:#edf2f7; }
        .option-label input[type="radio"] { display:none; }
        .radio-custom {
          width:18px; height:18px; border:2px solid #cbd5e0; border-radius:50%;
          margin-right:10px; position:relative; transition:all .2s;
        }
        .radio-custom::after {
          content:''; position:absolute; top:50%; left:50%;
          transform:translate(-50%,-50%) scale(0);
          width:9px; height:9px; border-radius:50%; background:#4299e1; transition:transform .2s;
        }
        .option-label input[type="radio"]:checked + .radio-custom { border-color:#4299e1; }
        .option-label input[type="radio"]:checked + .radio-custom::after { transform:translate(-50%,-50%) scale(1); }
        .option-text { font-size:.98rem; color:#4a5568; }
        .option-label.correct{ border-color:#48bb78; background:#f0fff4; }
        .option-label.wrong{ border-color:#f56565; background:#fff5f5; }
        .answer-footer{ margin-top:.5rem; font-size:.9rem; padding:.45rem .55rem; border-radius:6px; }
        .answer-footer.ok{ background:#f0fff4; color:#22543d; border:1px solid #c6f6d5; }
        .answer-footer.bad{ background:#fff5f5; color:#742a2a; border:1px solid #fed7d7; }

        .submit-container { margin-top: 1rem; display:flex; justify-content:flex-end; }
        .submit-button {
          display:flex; align-items:center; gap:8px; background:#4299e1; color:#fff;
          border:none; padding:.7rem 1.2rem; border-radius:6px; font-size:1rem; cursor:pointer;
          transition:background-color .2s;
        }
        .submit-button:disabled{ background:#a0aec0; cursor:not-allowed; }
        .submit-button:hover{ background:#3182ce; }

        .result-card{
          margin-top:1rem; padding:1rem; border-radius:8px; border:1px solid #e2e8f0; background:#f7fafc;
        }
        .score-line{ font-size:1.06rem; margin-bottom:.7rem; }
        .grid{
          display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap:.6rem .8rem; margin-bottom:.7rem;
        }
        .kv{
          display:flex; align-items:center; justify-content:space-between;
          background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:.5rem .7rem;
        }
        .okc{ color:#2f855a; }
        .badc{ color:#c53030; }
        .pass{ color:#2f855a; font-weight:700; } 
        .fail{ color:#c53030; font-weight:700; }
        .review-toggle{
          display:inline-flex; align-items:center; gap:.4rem;
          background:#2d3748; color:#fff; border:none; padding:.5rem .7rem; border-radius:6px; cursor:pointer;
        }

        @media (max-width: 768px) {
          .assignment-container { padding: 1rem; }
          .assignment-card { padding: 1.25rem; }
        }
      `}</style>
    </div>
  );
}

export default Assignment;

// Assignment Builder (trainer) — extracted so CreateAssignment can import it
export function AssignmentBuilder({
  meta,
  questions,
  totalAllocated,
  handleQuestionChange,
  handleOptionChange,
  handleCorrectIndexChange,
  handleMarksChange,
  handleSave,
  canSave
}) {
  return (
    <>
      <div className="meta-grid">
        <div className="meta-field">
          <label>Title</label>
          <input
            type="text"
            value={meta.title}
            readOnly
            placeholder="e.g., Week 1 Quiz"
          />
        </div>
        <div className="meta-field">
          <label>Duration (mins)</label>
          <input
            type="number"
            min={1}
            value={meta.durationMins}
            readOnly
          />
        </div>
        <div className="meta-field">
          <label>Pass %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={meta.passPercent}
            readOnly
          />
        </div>
        <div className="meta-field">
          <label>Total Marks</label>
          <input type="number" value={meta.totalMarks} readOnly />
        </div>
        <div className="meta-field">
          <label>Negative Mark per wrong (optional)</label>
          <input
            type="number"
            step="0.25"
            min={0}
            value={meta.negativeMarkPerWrong}
            readOnly
          />
        </div>
      </div>

      {/* Total allocated status */}
      {questions.length > 0 && (
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
      )}

      {/* No questions message */}
      {questions.length === 0 && (
        <div className="no-questions-message">
          <Database size={48} />
          <h3>No Questions Added</h3>
          <p>Go to the Question Bank tab to select questions for your assignment.</p>
        </div>
      )}

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
                readOnly
                className="marks-input"
              />
            </div>
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
                  onChange={(e) => handleOptionChange(q.id, optionIndex, e.target.value)}
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
        <button className="save-btn" onClick={handleSave} disabled={!canSave}>
          <Save size={20} />
          Save Assignment
        </button>
      </div>
    </>
  );
}