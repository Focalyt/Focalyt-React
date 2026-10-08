import React, { useState, useEffect, useRef } from 'react';
import {
  formatSessionDate,
  getTotSubmissionHistory,
  getDocFileUrl,
  formatDocDate,
  formatDocTime,
  collectTrainerSubmittedDocs,
  getTrainerDocFileType,
  normalizeDocReviewStatus,
  getTrainerMcqReview,
  isTotSession,
  getSessionAttendanceView,
  getSessionDoneDetails,
} from './seniorTrainerShared';
import TrainerDocumentReviewModal from './TrainerDocumentReviewModal';
import SeniorAddMcqForm from './SeniorAddMcqForm';
import SeniorTlmPanel from './SeniorTlmPanel';

const SeniorSessionCard = ({ session, token, backendUrl, onSessionUpdated }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [mcqModal, setMcqModal] = useState(null);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const moreBtnRef = useRef(null);
  const menuRef = useRef(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docStatuses, setDocStatuses] = useState({});
  const totSession = isTotSession(session);
  const sessionDone = getSessionDoneDetails(session);
  const sessionAttendance = getSessionAttendanceView(session);
  const trainerDocs = collectTrainerSubmittedDocs(session);
  const evidenceDocs = session.evidenceDocs || [];
  const displayDocs = trainerDocs.length
    ? trainerDocs
    : evidenceDocs.map((doc, index) => ({
      id: String(doc._id || doc.id || index),
      name: doc.name || 'Untitled document',
      type: doc.type || 'Document',
      fileUrl: doc.fileUrl || '',
      fileName: doc.fileName || '',
      group: 'Session document',
      uploaded: Boolean(doc.fileUrl) || String(doc.status || '').toLowerCase() === 'uploaded',
      status: doc.status || (doc.fileUrl ? 'Pending' : 'Not Uploaded'),
      uploadedAt: doc.uploadedAt || doc.updatedAt || doc.createdAt || doc.uploadDate || null,
    }));
  const getDocStatus = (doc) => docStatuses[doc.id] || normalizeDocReviewStatus(doc.status, doc.uploaded);
  const uploadedTrainerDocs = displayDocs.filter((doc) => getDocStatus(doc) !== 'Not Uploaded');
  const mcqReview = getTrainerMcqReview(session);

  useEffect(() => {
    if (!actionsMenuOpen) return undefined;
    const onPointerDown = (event) => {
      const target = event.target;
      if (moreBtnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setActionsMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [actionsMenuOpen]);
  const timeRange = `${session.startTime || '10:00'} - ${session.endTime || '12:00'}`;
  const detailItems = [
    ['fa-sitemap', 'Department', session.departmentName || session.verticalName || '-', 'blue'],
    ['fa-project-diagram', 'Project', session.projectName || '-', 'blue'],
    ['fa-building', 'Center', session.centerName || '-', 'blue'],
    ['fa-book-open', 'Topic covered', session.topicCovered || session.title || '-', 'blue'],
    ['fa-chalkboard', 'Training method', session.trainingMethod || 'Interactive Learning', 'blue'],
    ['fa-calendar-alt', 'Assign date', session.date || formatSessionDate(session.sessionDate) || '-', 'blue'],
    ['fa-graduation-cap', 'Course / trade', session.courseTrade || session.courseName || '-', 'pink'],
    ['fa-hashtag', 'Batch code', session.batchCode || '-', 'pink'],
    ['fa-user', 'Trainer', session.fieldTrainerName || session.trainerName || '-', 'pink'],
  ];
  const statItems = [
    { icon: 'fa-users', val: String(session.studentCount ?? session.totalCandidates ?? 0), lbl: 'Total Candidates', cls: 'blue' },
    { icon: 'fa-check-circle', val: String(session.presentCandidates ?? 0), lbl: 'Present', cls: 'green' },
    { icon: 'fa-times-circle', val: String(session.absentCandidates ?? 0), lbl: 'Absent', cls: 'red' },
    { icon: 'fa-percentage', val: session.attendance || `${session.attendancePercent ?? 0}%`, lbl: 'Attendance', cls: 'amber' },
  ];

  return (
    <article className={`sc-wrap${actionsMenuOpen ? ' sc-wrap--menu' : ''}`}>
      <div className="sc-head">
        <div className="sc-head-left">
          <div className="sc-avatar">
            <i className="fas fa-user" />
          </div>
          <div className="sc-head-text">
            <div className="sc-trainer-name">{session.title}</div>
            <span className="sc-session-badge sc-session-badge--plan">Academic Coordinator plan</span>
            {sessionDone.isDone && (
              <span className="sc-session-badge sc-session-badge--done">Session done</span>
            )}
            {totSession && session.includeTot === true && (
              <span className="sc-session-badge sc-session-badge--plan">TOT Linked</span>
            )}
          </div>
        </div>

        <div className="sc-stats">
          {statItems.map(({ icon, val, lbl, cls }) => (
            <div key={lbl} className="sc-stat">
              <div className={`sc-stat__icon sc-stat__icon--${cls}`}>
                <i className={`fas ${icon}`} />
              </div>
              <div className="sc-stat__val">{val}</div>
              <div className="sc-stat__lbl">{lbl}</div>
            </div>
          ))}
        </div>

        <div className="sc-head-controls">
          <button
            ref={moreBtnRef}
            type="button"
            className="sc-toggle-btn"
            title="More actions"
            aria-label="More actions"
            aria-expanded={actionsMenuOpen}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActionsMenuOpen((open) => !open);
            }}
          >
            <i className="fas fa-ellipsis-v" aria-hidden="true" />
          </button>
          {actionsMenuOpen && (
            <div ref={menuRef} className="sc-actions-dropdown" role="menu">
              <button
                type="button"
                className="sc-actions-item"
                role="menuitem"
                onClick={() => {
                  setActionsMenuOpen(false);
                  setMcqModal('response');
                }}
              >
                <i className="fas fa-user-check" aria-hidden="true" />
                Trainer Response
                {mcqReview.submitted && mcqReview.questions.length > 0 ? ` (${mcqReview.questions.length})` : ''}
              </button>
              <button
                type="button"
                className="sc-actions-item"
                role="menuitem"
                onClick={() => {
                  setActionsMenuOpen(false);
                  setMcqModal('new');
                }}
              >
                <i className="fas fa-plus" aria-hidden="true" />
                Re ToT
              </button>
            </div>
          )}
          <button
            type="button"
            className="sc-toggle-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand card' : 'Collapse card'}
          >
            <i className={`fas fa-chevron-${collapsed ? 'down' : 'up'}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <nav className="sc-tabs" aria-label="Session sections">
            <button
              type="button"
              className={`sc-tab${activeTab === 'details' ? ' sc-tab--active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <i className="far fa-list-alt" /> Session Details
            </button>
            <button
              type="button"
              className={`sc-tab${activeTab === 'evidence' ? ' sc-tab--active' : ''}`}
              onClick={() => setActiveTab('evidence')}
            >
              <i className="far fa-image" /> Evidence Documents
              {displayDocs.length > 0 && <span className="sc-tab-count">{uploadedTrainerDocs.length}/{displayDocs.length}</span>}
            </button>
            <button
              type="button"
              className={`sc-tab${activeTab === 'tlm' ? ' sc-tab--active' : ''}`}
              onClick={() => setActiveTab('tlm')}
            >
              <i className="fas fa-book" /> TLM
              {(session.standardTlm || []).filter((item) => item?.name).length > 0 && (
                <span className="sc-tab-count">
                  {(session.standardTlm || []).filter((item) => item?.name).length}
                </span>
              )}
            </button>
          </nav>

          {activeTab === 'details' && (
            <div className="sc-body">
              <div className="sc-detail-grid">
                {detailItems.map(([icon, label, tone]) => (
                  <div key={label} className="sc-detail-item">
                    <small>{label}</small>
                    <strong>
                      <span className={`sc-detail-icon sc-detail-icon--${tone}`}>
                        <i className={`fas ${icon}`} />
                      </span>
                    
                    </strong>
                  </div>
                ))}
                <div className="sc-detail-item">
                  <small>Student Feedback</small>
                  <strong>
                    <span className="sc-detail-icon sc-detail-icon--blue">
                      <i className="far fa-star" />
                    </span>
                    <span className="sc-detail-value">No reviews yet</span>
                  </strong>
                </div>
              </div>

              <div className="sc-notes">
                <span className="sc-detail-icon sc-detail-icon--blue">
                  <i className="far fa-edit" />
                </span>
                <div>
                  <small>Additional notes</small>
                  <p>{session.notes || 'No notes added.'}</p>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="sc-body">
              {displayDocs.length === 0 ? (
                <div className="sc-evidence-empty">
                  <i className="far fa-folder-open" />
                  <p>No documents submitted by the trainer yet.</p>
                </div>
              ) : (
                <div className="st-reg-docs-grid">
                  {displayDocs.map((doc) => {
                    const status = getDocStatus(doc);
                    const fileUrl = doc.fileUrl ? getDocFileUrl(doc.fileUrl) : '';
                    const fileType = getTrainerDocFileType(fileUrl || doc.fileName, doc.type);
                    const hasFile = Boolean(fileUrl) && status !== 'Not Uploaded';
                    const uploadDate = formatDocDate(doc.uploadedAt);
                    const uploadTime = formatDocTime(doc.uploadedAt);
                    return (
                      <div key={doc.id} className="st-reg-doc-card">
                        <div className="st-reg-doc-card__preview">
                          {hasFile ? (
                            fileType === 'image' ? (
                              <img src={fileUrl} alt={doc.name} className="st-reg-doc-card__image" />
                            ) : fileType === 'pdf' ? (
                              <div className="st-reg-doc-card__icon">
                                <i className="fa-solid fa-file" style={{ fontSize: 100, color: '#dc3545' }} />
                                <p>PDF Document</p>
                              </div>
                            ) : (
                              <div className="st-reg-doc-card__icon">
                                <i className={`fas ${fileType === 'video' ? 'fa-video' : 'fa-file'}`} />
                                <p>{fileType === 'video' ? 'Video' : 'Document'}</p>
                              </div>
                            )
                          ) : (
                            <div className="st-reg-doc-card__empty">
                              <i className="fas fa-file-upload" />
                              <p>No Document</p>
                            </div>
                          )}
                          {hasFile && (
                            <div className="st-reg-doc-card__overlay">
                              <button type="button" className="st-reg-preview-btn" onClick={() => setSelectedDoc(doc)}>
                                <i className="fas fa-search-plus" />
                                {status === 'Pending' ? 'Review' : 'Preview'}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="st-reg-doc-card__info">
                          <div className="st-reg-doc-card__header">
                            <h4>{doc.name}</h4>
                            {hasFile ? (
                              <button
                                type="button"
                                className="st-reg-pill st-reg-pill--verify"
                                onClick={() => setSelectedDoc(doc)}
                              >
                                <i className="fas fa-check" />
                                {status === 'Pending' ? 'VERIFY' : 'PREVIEW'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="st-reg-pill st-reg-pill--upload"
                                onClick={() => setSelectedDoc(doc)}
                              >
                                <i className="fas fa-cloud-upload-alt" />
                                UPLOAD
                              </button>
                            )}
                          </div>
                          <div className="st-reg-doc-card__meta">
                            <span>
                              <i className="fas fa-calendar-alt" />
                              {uploadDate || 'Not uploaded'}
                            </span>
                            {uploadTime && (
                              <span>
                                <i className="fas fa-clock" />
                                {uploadTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedDoc && (
                <TrainerDocumentReviewModal
                  doc={selectedDoc}
                  status={getDocStatus(selectedDoc)}
                  onClose={() => setSelectedDoc(null)}
                  onAccept={(doc) => {
                    setDocStatuses((prev) => ({ ...prev, [doc.id]: 'Verified' }));
                    setSelectedDoc(null);
                  }}
                  onReject={(doc) => {
                    setDocStatuses((prev) => ({ ...prev, [doc.id]: 'Rejected' }));
                    setSelectedDoc(null);
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'tlm' && (
            <div className="sc-body">
              <SeniorTlmPanel
                key={session.id}
                session={session}
                token={token}
                backendUrl={backendUrl}
                onUpdated={onSessionUpdated}
              />
            </div>
          )}

          <footer className="sc-foot">
            <span className="sc-foot-note">
              <i className="fas fa-info-circle" /> Referred session — review trainer documents and MCQ answers.
            </span>
          </footer>
        </>
      )}

      {mcqModal === 'response' && (
        <div className="st-modal-overlay" onClick={() => setMcqModal(null)}>
          <div className="st-modal st-modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="st-modal__header">
              <h3><i className="fas fa-user-check" /> Trainer Response</h3>
              <button type="button" className="st-modal__close" onClick={() => setMcqModal(null)} aria-label="Close">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="st-modal__body st-modal__body--scroll">
              {mcqReview.questions.length === 0 ? (
                <div className="sc-evidence-empty">
                  <i className="fas fa-hourglass-half" />
                  <p>No candidate response yet. The trainer has not submitted MCQ answers.</p>
                </div>
              ) : (
                <div className="st-trainer-mcq">
                  {getTotSubmissionHistory(session).length > 1 && (
                    <div className="st-mcq-history">
                      <strong>Previous results</strong>
                      {getTotSubmissionHistory(session).map((item, index) => (
                        <div
                          key={`${item.submittedAt || index}`}
                          className={`st-mcq-history__row${item.pass ? ' st-mcq-history__row--pass' : ' st-mcq-history__row--fail'}`}
                        >
                          <span>Attempt {index + 1}</span>
                          <span>{item.pass ? 'Pass' : 'Fail'} · {item.percentage}%</span>
                          <span>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-IN') : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`st-trainer-mcq__score${mcqReview.pass === false ? ' st-trainer-mcq__score--fail' : ' st-trainer-mcq__score--pass'}`}>
                    <strong>{mcqReview.score}/{mcqReview.totalMarks} marks · {mcqReview.percentage}%</strong>
                    <span>
                      {mcqReview.pass === false ? 'Needs improvement' : 'Pass'} · need {mcqReview.passPercent}%
                      {mcqReview.trainerName ? ` · ${mcqReview.trainerName}` : ''}
                      {mcqReview.submittedAt ? ` · ${new Date(mcqReview.submittedAt).toLocaleDateString('en-IN')}` : ''}
                    </span>
                  </div>
                  {mcqReview.questions.map((question, qIndex) => (
                    <div key={question.id} className="st-trainer-mcq__card">
                      <div className="st-trainer-mcq__qhead">
                        <strong>{qIndex + 1}. {question.question}</strong>
                        <span>{question.selectedIndex === null ? 'Skipped' : (question.isCorrect ? 'Correct' : 'Wrong')}</span>
                      </div>
                      <div className="st-trainer-mcq__options">
                        {question.options.map((option, optionIndex) => {
                          const isChosen = question.selectedIndex === optionIndex;
                          const isCorrect = question.correctIndex === optionIndex;
                          const cls = isCorrect
                            ? ' st-trainer-mcq__option--correct'
                            : isChosen
                              ? ' st-trainer-mcq__option--wrong'
                              : '';
                          return (
                            <div key={`${question.id}-${optionIndex}`} className={`st-trainer-mcq__option${cls}`}>
                              <span className="st-trainer-mcq__letter">{String.fromCharCode(65 + optionIndex)}</span>
                              <span>{option || 'Option not set'}</span>
                              {isChosen && <em>Trainer</em>}
                              {isCorrect && <em>Correct</em>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="st-modal__footer">
              <button type="button" className="sc-btn" onClick={() => setMcqModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {mcqModal === 'new' && (
        <div className="st-modal-overlay" onClick={() => setMcqModal(null)}>
          <div className="st-modal st-modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="st-modal__header">
              <h3><i className="fas fa-plus" /> New MCQ</h3>
              <button type="button" className="st-modal__close" onClick={() => setMcqModal(null)} aria-label="Close">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="st-modal__body st-modal__body--scroll">
              <SeniorAddMcqForm
                session={session}
                token={token}
                backendUrl={backendUrl}
                onAdded={(saved) => {
                  if (typeof onSessionUpdated === 'function') onSessionUpdated(saved);
                }}
              />
            </div>
            <div className="st-modal__footer">
              <button type="button" className="sc-btn" onClick={() => setMcqModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default SeniorSessionCard;
