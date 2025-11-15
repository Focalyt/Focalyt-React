import React, { useMemo, useState, useEffect } from 'react';
import {CheckCircle2, Clock, Eye, EyeOff, Save, AlertTriangle, Award,Target,BookOpen,ChevronRight,CircleCheck, XCircle,Minus, FileText,Timer,TrendingUp,User,Calendar,Info} from 'lucide-react';
import axios from 'axios';

const questionNavigatorStyles = `
  .question-navigator-card {
    border-radius: 20px;
    overflow: hidden;
    border: none;
    box-shadow: 0 12px 40px rgba(26, 35, 126, 0.08);
    background: linear-gradient(160deg, #f5f7ff 0%, #ffffff 45%, #f0f4ff 100%);
  }

  .question-navigator-header {
    background: linear-gradient(135deg, #1f4bd8 0%, #4a78ff 100%);
    color: #fff;
    border-bottom: none;
    padding: 24px 28px;
  }

  .question-navigator-header h6 {
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 6px;
  }

  .question-navigator-subtitle {
    font-size: 0.82rem;
    opacity: 0.8;
  }

  .question-progress-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    font-weight: 600;
    font-size: 0.85rem;
    letter-spacing: 0.02em;
  }

  .question-navigator-body {
    padding: 24px 8px 8px;
  }

  .question-navigator-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(25px, 1fr));
    gap: 7px;
  }

  .question-number-btn {
    border-radius: 14px !important;
    height: 40px;
    font-weight: 600;
    font-size: 1rem;
    border-width: 0 !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .question-number-btn.btn-outline-secondary {
    background: #edf1ff;
    color: #264199;
    box-shadow: inset 0 0 0 1px rgba(44, 72, 156, 0.15);
  }
.numBtn{
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }
  .question-number-btn.btn-outline-secondary:hover {
    background: #dfe6ff;
    transform: translateY(-2px);
    box-shadow: 0 12px 20px rgba(31, 75, 216, 0.12);
  }

  .question-number-btn.btn-success {
    background: linear-gradient(135deg, #33d17a 0%, #1ec1a4 100%);
    color: #fff;
    box-shadow: 0 18px 35px rgba(30, 193, 164, 0.25);
  }

  .question-number-btn.btn-success:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 38px rgba(30, 193, 164, 0.3);
  }

  .question-number-btn.is-active {
    box-shadow: 0 0 0 4px rgba(31, 75, 216, 0.25);
    background: linear-gradient(135deg, #ffffff 0%, #f1f4ff 100%);
  }

  .question-navigator-meta {
    margin-top: 26px;
    padding-top: 22px;
    border-top: 1px solid rgba(38, 65, 153, 0.15);
  }

  .question-navigator-meta .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 0.92rem;
    color: #3a4e7f;
  }

  .legend-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .legend-dot.attempted {
    background: linear-gradient(135deg, #33d17a 0%, #1ec1a4 100%);
  }

  .legend-dot.pending {
    background: #d6defc;
  }

  .question-navigator-summary {
    margin-top: 18px;
    background: rgba(31, 75, 216, 0.08);
    border-radius: 14px;
    padding: 16px 18px;
    font-size: 0.9rem;
    color: #2a3f70;
    line-height: 1.5;
  }

  .question-navigator-summary strong {
    display: block;
    font-size: 1.05rem;
    margin-bottom: 4px;
    color: #1f3a64;
  }

  .question-navigator-summary span {
    display: block;
    margin-bottom: 6px;
  }

  .question-navigator-summary span:last-child {
    margin-bottom: 0;
  }

  @media (min-width: 1200px) {
    .question-navigator-card {
      position: sticky;
      top: 24px;
    }
  }

  @media (max-width: 991.98px) {
    .question-navigator-card {
      margin-top: 24px;
    }

    .question-number-btn {
      height: 50px;
      font-size: 0.95rem;
    }
  }
`;

function Assignment({ courseId }) {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const token = localStorage.getItem("token");
  const [assignment, setAssignment] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeStarted, setTimeStarted] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const formatAssignment = (assignmentData) => {
    return {
      meta: {
        id: assignmentData._id,
        title: assignmentData.title,
        durationMins: assignmentData.durationMins,
        passPercent: assignmentData.passPercent,
        totalMarks: assignmentData.totalMarks,
      },
      questions: (assignmentData.questions || []).map((q, index) => ({
        id: q._id?.toString() || `q-${index}`,
        question: q.question,
        options: q.options || [],
        correctIndex: q.correctIndex,
        marks: q.marks
      }))
    };
  };

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeLeft, timerActive]);

  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchAssignments = async () => {
    try {
      const query = courseId ? `?courseId=${courseId}` : '';
      const res = await axios.get(`${backendUrl}/candidate/assignments${query}`, {
        headers: { 'x-auth': token }
      });
      if (res?.data?.status) {
        const all = res.data.data || [];
  const matchesCourse = (a) => {
          if (!courseId) return true;
          try {
            const cid = String(courseId);
            if (a.courseId && String(a.courseId) === cid) return true;
            if (a.meta && (a.meta.courseId || a.meta.course) && String(a.meta.courseId || a.meta.course) === cid) return true;
            if (a.questions && a.questions.some(q => q.course && String(q.course) === cid)) return true;
          } catch (e) {
          }
          return false;
        };

        const filtered = all.filter(matchesCourse);
        setAssignments(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

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
  const negEach = 0;

    for (const q of questions) {
      const chosen = selected[q.id];
      if (chosen === q.correctIndex) {
        score += Number(q.marks || 0);
        marksFromCorrect += Number(q.marks || 0);
        correctCount++;
      } else if (chosen !== undefined) {
        wrongCount++;
        score -= negEach;
      }
    }
    
    if (score < 0) score = 0;

    const total = Number(meta?.totalMarks || 100);
    const percent = total ? Math.round((score / total) * 10000) / 100 : 0;
    const pass = percent >= Number(meta?.passPercent || 40);
    const totalQuestions = questions.length;
    const attempted = Object.keys(selected).length;
    const unattempted = Math.max(totalQuestions - attempted, 0);
  const negativeDeducted = 0;

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
    if (!submitted && timerActive) {
      setSelected((prev) => ({ ...prev, [questionId]: optionIndex }));
    }
  };

  const handleSubmit = async () => {
    if (!hasAttemptedQuestions) {
      alert('Please attempt at least one question before submitting.');
      return;
    }

    if (!assignment) return;

    setSubmitting(true);
    setTimerActive(false);

    try {
      const answers = {};
      assignment.questions.forEach(q => {
        if (selected[q.id] !== undefined) {
          answers[q.id] = selected[q.id];
        }
      });

      const timeTakenSeconds = timeStarted 
        ? Math.floor((new Date() - new Date(timeStarted)) / 1000)
        : 0;

      const assignmentId = assignment.meta?.id;
      if (!assignmentId) {
        alert('Assignment ID not found');
        setSubmitting(false);
        setTimerActive(true);
        return;
      }

      const res = await axios.post(
        `${backendUrl}/candidate/assignment/${assignmentId}/submit`,
        {
          answers,
          timeStarted,
          timeTakenSeconds
        },
        {
          headers: { 'x-auth': token }
        }
      );

      if (res?.data?.status) {
        setSubmitted(true);
      } else {
        alert(res?.data?.message || 'Failed to submit assignment');
        setSubmitting(false);
        setTimerActive(true);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert(err?.response?.data?.message || 'Failed to submit assignment. Please try again.');
      setSubmitting(false);
      setTimerActive(true);
    }
  };

  const selectAssignment = (a) => {
    setAssignment(formatAssignment(a));
    setSubmitted(false);
    setSelected({});
    setShowReview(false);
    setCurrentQuestion(0);
    setTimeLeft(null);
    setTimerActive(false);
    setTimeStarted(null);
  };

  const startTest = () => {
    if (assignment?.meta?.durationMins) {
      setTimeLeft(assignment.meta.durationMins * 60);
      setTimerActive(true);
      setTimeStarted(new Date());
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < assignment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestion(index);
  };

  if (loading) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card shadow-lg">
          <div className="card-body text-center p-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5>Loading Tests...</h5>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment && assignments.length === 0) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card shadow-lg">
          <div className="card-body text-center p-5">
            <FileText size={64} className="text-muted mb-3" />
            <h3>No Tests Available</h3>
            <p className="text-muted">Please check back later or contact your instructor.</p>
          </div>
        </div>
      </div>
    );
  }

  if (assignments.length > 0 && !assignment) {
    return (
      <div className="container-fluid min-vh-100 bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="text-center mb-5">
                <h5 className="display-4 fw-bold text-primary mb-3">
                  Available Tests
                </h5>
                <p className="lead text-muted">Select a test to begin your assessment</p>
              </div>

              <div className="row g-4">
                {assignments.map((a) => (
                  <div key={a._id} className="col-md-6 col-lg-6">
                    <div 
                      className={`card h-100 shadow-sm test-card ${a.submitted ? 'opacity-75' : ''}`}
                      onClick={() => a.submitted ? alert('You have already submitted this test and cannot retake it.') : selectAssignment(a)}
                      style={{ cursor: a.submitted ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}
                    >
                      <div className="card-body">
                        <h5 className="card-title text-dark fw-bold mb-3">
                          {a.title}
                        </h5>
                        
                        <div className="mb-3">
                          <div className="d-flex align-items-center text-muted mb-2">
                            <Timer size={18} className="me-2" />
                            <small>Duration: {a.durationMins} minutes</small>
                          </div>
                          <div className="d-flex align-items-center text-muted mb-2">
                            <Target size={18} className="me-2" />
                            <small>Total Marks: {a.totalMarks}</small>
                          </div>
                          <div className="d-flex align-items-center text-muted mb-2">
                            <FileText size={18} className="me-2" />
                            <small>Questions: {a.questions?.length || 0}</small>
                          </div>
                          <div className="d-flex align-items-center text-muted">
                            <Award size={18} className="me-2" />
                            <small>Pass: {a.passPercent}%</small>
                          </div>
                        </div>
                      </div>
                      <div className="card-footer bg-primary bg-gradient text-white text-center d-flex justify-content-center align-items-center">
                        {a.submitted ? (
                          <span className="fw-bold">Submitted</span>
                        ) : (
                          <>
                            <span className="fw-bold">Start Test</span>
                            <ChevronRight size={20} className="ms-2" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { meta, questions } = assignment;

  if (!submitted && assignment) {
    const currentQ = questions[currentQuestion];
    const attemptedCount = Object.keys(selected).length;
    const notAttemptedCount = Math.max(questions.length - attemptedCount, 0);
    
    return (
      <>
        <style>{questionNavigatorStyles}</style>
        <div className="container-fluid min-vh-100 bg-light py-4">
        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-primary bg-gradient text-white">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <h4 className="mb-0 text-capitalize">{meta?.title}</h4>
                      <div className="mt-2">
                        <span className="badge bg-light text-dark me-2">
                          <Target size={14} className="me-1" />
                          {meta?.totalMarks} Marks
                        </span>
                        <span className="badge bg-light text-dark me-2">
                          <Award size={14} className="me-1" />
                          Pass: {meta?.passPercent}%
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4 text-md-end">
                      {timeLeft !== null && (
                        <div className={`badge ${timeLeft < 60 ? 'bg-danger' : 'bg-success'} p-3 fs-5`}>
                          <Clock size={20} className="me-2" />
                          {formatTime(timeLeft)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!timerActive && timeLeft === null && (
                  <div className="card-body text-center py-5">
                    <h3 className="mb-4">Ready to begin?</h3>
                    <p className="text-muted mb-4">
                      This test contains {questions.length} questions. 
                      {meta?.durationMins && ` Time limit: ${meta.durationMins} minutes.`}
                    </p>
                    <button 
                      className="btn btn-primary btn-lg px-5"
                      onClick={startTest}
                    >
                      <Clock size={24} className="me-2" />
                      Start Test
                    </button>
                  </div>
                )}

                {timerActive && (
                  <div className="card-body">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="text-primary mb-0">
                          Question {currentQuestion + 1} of {questions.length}
                        </h5>
                        <span className="badge bg-secondary px-3 py-2">
                          {currentQ.marks} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
                        </span>
                      </div>

                      <h5 className="mb-4">{currentQ.question}</h5>

                      <div className="options-container">
                        {currentQ.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="mb-3">
                            <div className="form-check p-0">
                              <label
                                className={`option-label w-100 p-3 rounded border ${
                                  selected[currentQ.id] === optionIndex 
                                    ? 'border-primary bg-primary bg-opacity-10' 
                                    : 'border-secondary bg-white'
                                }`}
                                style={{ cursor: (!timerActive || submitted) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                              >
                                <input
                                  className="form-check-input me-3"
                                  type="radio"
                                  name={`question-${currentQ.id}`}
                                  checked={selected[currentQ.id] === optionIndex}
                                  disabled={!timerActive || submitted}
                                  onChange={() => handleAnswerChange(currentQ.id, optionIndex)}
                                />
                                <span className="badge bg-secondary me-3">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                                {option}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={prevQuestion}
                        disabled={currentQuestion === 0}
                      >
                        ← Previous
                      </button>
                      
                      {currentQuestion === questions.length - 1 ? (
                        <button 
                          className="btn btn-success btn-lg px-5"
                          onClick={handleSubmit}
                          disabled={!hasAttemptedQuestions || submitting}
                        >
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Save size={20} className="me-2" />
                              Submit Test
                            </>
                          )}
                        </button>
                      ) : (
                        <button 
                          className="btn btn-primary"
                          onClick={nextQuestion}
                        >
                          Next →
                        </button>
                      )}
                    </div>

                    {!hasAttemptedQuestions && currentQuestion === questions.length - 1 && (
                      <div className="alert alert-warning mt-3 d-flex align-items-center">
                        <AlertTriangle size={20} className="me-2" />
                        Please attempt at least one question before submitting.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-3">
              <div className="question-navigator-card">
                <div className="question-navigator-header">
                  <div>
                    <h6 className="mb-1">Question Navigator</h6>
                    <div className="question-navigator-subtitle">
                      Jump to any question instantly.
                    </div>
                  </div>
                  <span className="question-progress-chip">
                    {attemptedCount}/{questions.length}
                  </span>
                </div>
                <div className="question-navigator-body">
                  <div className="question-navigator-grid">
                    {questions.map((q, idx) => {
                      const isAttempted = selected[q.id] !== undefined;
                      const isActive = currentQuestion === idx;

                      return (
                        <button
                          key={q.id}
                          className={`btn question-number-btn numBtn ${isAttempted ? 'btn-success' : 'btn-outline-secondary'} ${isActive ? 'is-active' : ''}`}
                          onClick={() => goToQuestion(idx)}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="question-navigator-meta">
                    <div className="legend-item">
                      <span className="legend-dot attempted"></span>
                      Attempted ({attemptedCount})
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot pending"></span>
                      Not Attempted ({notAttemptedCount})
                    </div>
                  </div>

                  <div className="question-navigator-summary">
                    <strong>Test Summary</strong>
                    <span>Total Questions: {questions.length}</span>
                    <span>Total Marks: {meta?.totalMarks}</span>
                    <span>Time Remaining: {timeLeft ? formatTime(timeLeft) : 'Unlimited'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (submitted && result) {
    return (
      <div className="container-fluid min-vh-100 bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="text-center mb-4">
                <div className="mb-3">
                  {result.pass ? (
                    <div className="text-success">
                      <CheckCircle2 size={72} />
                    </div>
                  ) : (
                    <div className="text-danger">
                      <XCircle size={72} />
                    </div>
                  )}
                </div>
                <h1 className="display-4 fw-bold mb-3">Test Completed!</h1>
                <p className="lead text-muted">Your response has been recorded successfully.</p>
              </div>

              {/* Action Buttons */}
              <div className="text-center">
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    setAssignment(null);
                    setSubmitted(false);
                    setSelected({});
                    setTimeLeft(null);
                    setTimeStarted(null);
                    fetchAssignments();
                  }}
                >
                  <BookOpen size={20} className="me-2" />
                  Back to Tests
                </button>
              </div>
            </div>
          </div>
        </div>

        <style>{`
        
          .test-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
          }

          .option-label:hover {
            background-color: #f8f9fa !important;
            border-color: #6c757d !important;
          }

          .circular-progress {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%);
            padding: 20px;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: conic-gradient(
              from 0deg,
              ${result?.pass ? '#28a745' : '#dc3545'} 0deg,
              ${result?.pass ? '#28a745' : '#dc3545'} ${(result?.percent || 0) * 3.6}deg,
              #e9ecef ${(result?.percent || 0) * 3.6}deg
            );
            position: relative;
          }

          .circular-progress::before {
            content: '';
            position: absolute;
            width: 110px;
            height: 110px;
            background: white;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }

          .circular-progress > * {
            position: relative;
            z-index: 1;
          }

          @media (max-width: 768px) {
            .sticky-top {
              position: relative !important;
              top: 0 !important;
            }
          }
        `}</style>
      </div>
    );
  }

}

export default Assignment;