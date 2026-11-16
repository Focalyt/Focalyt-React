import React, { useEffect, useMemo, useState } from 'react';
import { Can } from '../Components/cms/Can';
import { useClub } from '../../../../contexts/ClubContext';
import { ROLE_LABELS } from '../../../../config/club/roles';
import { useClubChatSocket } from '../hooks/useClubChatSocket';

export const ChatFaqPage = () => {
  const { state, activeRole, sendChatMessage, upsertFaq, deleteFaq } = useClub();
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const isStudent = activeRole === 'student';
  const channelClubs = useMemo(
    () =>
      isStudent
        ? state.clubs.filter((club) =>
            (club.members || []).some(
              (member) =>
                member.studentId === state.currentStudent.id &&
                (member.status === 'joined' || member.status === 'approved')
            )
          )
        : state.clubs,
    [isStudent, state.clubs, state.currentStudent.id]
  );
  const [clubId, setClubId] = useState(channelClubs[0]?.id || '');
  const [message, setMessage] = useState('');
  const [faqQuery, setFaqQuery] = useState('');

  useEffect(() => {
    if (!channelClubs.some((club) => club.id === clubId)) {
      setClubId(channelClubs[0]?.id || '');
    }
  }, [channelClubs, clubId]);

  const thread = state.chatMessages.filter((item) => item.clubId === clubId);
  const faqs = useMemo(() => {
    const q = faqQuery.trim().toLowerCase();
    if (!q) return state.faqs;
    return state.faqs.filter(
      (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    );
  }, [faqQuery, state.faqs]);

  const author = isStudent ? state.currentStudent.name : ROLE_LABELS[activeRole];
  const canSendChat = Boolean(clubId) && (!isStudent || channelClubs.some((club) => club.id === clubId));
  useClubChatSocket(clubId);

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Chat & FAQ</h1>
          <p>Club channel messages and frequently asked questions.</p>
        </div>
        <select
          className="club-list-page__select"
          value={clubId}
          onChange={(e) => setClubId(e.target.value)}
          aria-label="Club channel"
        >
          {channelClubs.length === 0 && <option value="">No club channel</option>}
          {channelClubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      <div className="club-list-page__panel">
        <h3>Channel</h3>
        <div className="cms-chat-thread">
          {thread.length === 0 ? (
            <p className="club-list-page__meta">No messages in this channel yet.</p>
          ) : (
            thread.map((item) => (
              <div key={item.id} className="cms-chat-bubble">
                <strong>{item.author}</strong>
                <p>{item.body}</p>
              </div>
            ))
          )}
        </div>
        <form
          style={{ display: 'flex', gap: 8, marginTop: 12 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!message.trim() || !canSendChat) return;
            sendChatMessage({ clubId, author, body: message });
            setMessage('');
          }}
        >
          <input
            className="form-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!canSendChat}
            placeholder={canSendChat ? 'Write a message' : 'Join this club to send messages'}
          />
          <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm" disabled={!canSendChat}>
            Send
          </button>
        </form>
      </div>

      <div className="club-list-page__section">
        <h2>FAQ</h2>
        <div className="club-list-page__toolbar">
          <input
            type="search"
            className="club-list-page__search"
            placeholder="Search FAQ"
            value={faqQuery}
            onChange={(e) => setFaqQuery(e.target.value)}
          />
        </div>
        <Can permission="faq.manage">
          <form
            className="club-list-page__panel"
            onSubmit={(e) => {
              e.preventDefault();
              if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
              upsertFaq(faqForm);
              setFaqForm({ question: '', answer: '' });
            }}
          >
            <h3>Add FAQ</h3>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Question</label>
                <input
                  className="form-input"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Answer</label>
                <input
                  className="form-input"
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm" style={{ marginTop: 12 }}>
              Save FAQ
            </button>
          </form>
        </Can>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Answer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="club-list-page__empty">
                    No FAQ entries yet.
                  </td>
                </tr>
              ) : (
                faqs.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="club-list-page__name">{item.question}</div>
                    </td>
                    <td>{item.answer}</td>
                    <td>
                      <Can permission="faq.manage">
                        <button type="button" className="club-link-btn" onClick={() => deleteFaq(item.id)}>
                          Remove
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChatFaqPage;
