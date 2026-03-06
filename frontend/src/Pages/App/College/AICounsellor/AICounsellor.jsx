import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'bn', name: 'Bengali' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'or', name: 'Odia' },
  { code: 'as', name: 'Assamese' },
];

const AICounsellor = () => {
  const [languages, setLanguages] = useState(DEFAULT_LANGUAGES);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const token = JSON.parse(sessionStorage.getItem('user') || '{}')?.token;

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/ai/counsellor-languages`);
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setLanguages(res.data.data);
        }
      } catch (_) {
        // Keep default languages if API fails
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const sendMessage = async () => {
    const text = (message || '').trim();
    if (!text || loading) return;

    const userTurn = { role: 'user', content: text };
    setConversation(prev => [...prev, userTurn]);
    setMessage('');
    setLoading(true);
    setError(null);

    const history = conversation.map(t => ({ role: t.role, content: t.content }));

    try {
      const res = await axios.post(
        `${backendUrl}/api/ai/counsellor-chat`,
        {
          message: text,
          language: selectedLanguage,
          conversationHistory: history,
        },
        { headers: token ? { 'x-auth': token } : {} }
      );

      if (res.data?.success && res.data?.data?.reply) {
        setConversation(prev => [...prev, { role: 'assistant', content: res.data.data.reply }]);
      } else {
        setError(res.data?.message || 'No reply from AI.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to get response';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-6">
          <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
            <div className="card-header bg-primary text-white py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 className="mb-0 fw-semibold">AI Counsellor (Multilanguage)</h5>
              <select
                className="form-select form-select-sm w-auto bg-white text-dark"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                aria-label="Select language"
              >
                {languages.map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            <div className="card-body p-0 d-flex flex-column" style={{ minHeight: '400px' }}>
              <div
                className="flex-grow-1 overflow-auto p-3 bg-light"
                style={{ maxHeight: '450px' }}
              >
                {conversation.length === 0 && (
                  <p className="text-muted text-center mb-0 py-4">
                    Ask about courses, admissions, fees, or eligibility. Replies will be in the selected language.
                  </p>
                )}
                {conversation.map((turn, i) => (
                  <div
                    key={i}
                    className={`d-flex mb-2 ${turn.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      className={`rounded-3 px-3 py-2 shadow-sm max-w-85 ${turn.role === 'user' ? 'bg-primary text-white' : 'bg-white border'}`}
                      style={{ maxWidth: '85%' }}
                    >
                      <span className="small fw-semibold opacity-75">{turn.role === 'user' ? 'You' : 'AI Counsellor'}</span>
                      <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{turn.content}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="d-flex justify-content-start mb-2">
                    <div className="rounded-3 px-3 py-2 bg-white border shadow-sm">
                      <span className="text-muted small">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {error && (
                <div className="alert alert-warning mb-0 rounded-0 py-2 small">
                  {error}
                </div>
              )}
              <div className="p-3 border-top bg-white">
                <div className="input-group">
                  <textarea
                    className="form-control"
                    placeholder="Type your question..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={sendMessage}
                    disabled={loading || !message.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICounsellor;
