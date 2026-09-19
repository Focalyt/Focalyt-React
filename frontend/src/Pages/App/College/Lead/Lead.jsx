import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL ;
const PAGE_SIZE = 20;

const FILTERS = [
  { id: 'ai-called', label: 'AI Called' },
  { id: 'changed', label: 'Status Changed' },
  { id: 'same', label: 'Status Same' },
  { id: 'all', label: 'All Leads' },
];

const normalizeStatus = (value) => {
  const title = String(value || '').trim();
  if (!title || /^no status$/i.test(title)) return 'Untouch';
  return title;
};

const normalizeRemarks = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : (item?.remark || item?.text || item?.comment || '')))
      .filter(Boolean)
      .join('\n')
      .trim();
  }
  return String(value).trim();
};

const splitHumanAndAiRemarks = (remarks) => {
  const aiLines = [];
  const humanLines = [];
  String(remarks || '').split(/\r?\n/).forEach((line) => {
    if (/^\s*\[AI Call\]/i.test(line)) aiLines.push(line.trim());
    else humanLines.push(line);
  });
  return {
    human: humanLines.join('\n').trim(),
    ai: aiLines.join('\n').trim(),
  };
};

const truncateText = (value, max = 90) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '—';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
};

const isAiCallCompleted = (profile) => (
  String(profile?.aiVoice?.lastEvent || '').toUpperCase() === 'CALL_COMPLETED'
);

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
];

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const presetRange = (id) => {
  const today = startOfDay(new Date());
  if (id === 'today') return { from: today, to: today };
  if (id === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return { from: yesterday, to: yesterday };
  }
  if (id === '7d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from, to: today };
  }
  if (id === '30d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { from, to: today };
  }
  return { from: null, to: null };
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Lead = () => {
  const userData = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const token = userData.token;

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ai-called');
  const [datePreset, setDatePreset] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [counselorId, setCounselorId] = useState('');
  const [counselorOptions, setCounselorOptions] = useState([]);
  const [remarkModal, setRemarkModal] = useState(null);

  const fetchLeads = useCallback(async () => {
    if (!token) {
      setError('Please login again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = {
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(search && { name: search }),
      };
      if (activeFilter !== 'all') params.aiCalled = 'true';
      if (activeFilter === 'changed') params.statusDiff = 'true';
      if (activeFilter === 'same') params.statusDiff = 'false';
      if (fromDate) {
        if (activeFilter === 'all') params.createdFromDate = new Date(`${fromDate}T00:00:00`).toISOString();
        else params.aiCallFromDate = new Date(`${fromDate}T00:00:00`).toISOString();
      }
      if (toDate) {
        if (activeFilter === 'all') params.createdToDate = new Date(`${toDate}T00:00:00`).toISOString();
        else params.aiCallToDate = new Date(`${toDate}T00:00:00`).toISOString();
      }
      if (counselorId) params.counselor = JSON.stringify([counselorId]);

      const response = await axios.get(`${backendUrl}/college/appliedCandidates`, {
        headers: { 'x-auth': token },
        params,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load leads');
      }

      setLeads(Array.isArray(response.data.data) ? response.data.data : []);
      setTotalPages(response.data.totalPages || 1);
      setTotalCount(response.data.totalCount || 0);
    } catch (err) {
      setLeads([]);
      setError(err.response?.data?.message || err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, activeFilter, fromDate, toDate, counselorId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (!token) return;
    const fetchCounselors = async () => {
      try {
        const res = await axios.get(`${backendUrl}/college/filters-data`, {
          headers: { 'x-auth': token },
        });
        if (!res.data?.status) return;
        const activeCounselors = (res.data.counselors || []).filter(
          (c) => c?.status === true || c?.status === 'active' || c?.status == null
        );
        setCounselorOptions(activeCounselors.map((c) => ({ value: c._id, label: c.name })));
      } catch {
        setCounselorOptions([]);
      }
    };
    fetchCounselors();
  }, [token]);

  const rows = useMemo(() => leads.map((lead) => {
    const aiStatus = normalizeStatus(lead?._aiLeadStatus?.title);
    const humanStatus = normalizeStatus(lead?._leadStatus?.title);
    const changed = aiStatus.toLowerCase() !== humanStatus.toLowerCase();
    return {
      id: lead._id,
      name: lead?._candidate?.name || 'Unknown',
      mobile: lead?._candidate?.mobile || '—',
      course: lead?._course?.name || '—',
      counselor: lead?.counsellor?.name
        || lead?.leadAssignment?.[lead.leadAssignment?.length - 1]?.counsellorName
        || '—',
      aiCalled: isAiCallCompleted(lead),
      aiStatus,
      aiDisposition: lead?.aiVoice?.lastDisposition || '',
      aiRemarks: normalizeRemarks(lead?.aiRemark)
        || splitHumanAndAiRemarks(normalizeRemarks(lead?.remarks)).ai
        || normalizeRemarks(lead?.aiVoice?.lastSummary),
      humanCalled: Number(lead?.followupStats?.call?.done || 0) > 0,
      humanStatus,
      humanRemarks: splitHumanAndAiRemarks(normalizeRemarks(lead?.remarks)).human,
      aiCallAt: lead?.aiVoice?.lastWebhookAt || '',
      createdAt: lead?.createdAt || '',
      changed,
    };
  }), [leads]);

  const pageSummary = useMemo(() => {
    const aiCalled = rows.filter((row) => row.aiCalled).length;
    const changed = rows.filter((row) => row.changed).length;
    return {
      shown: rows.length,
      aiCalled,
      changed,
      same: rows.length - changed,
    };
  }, [rows]);

  const applySearch = (event) => {
    event?.preventDefault?.();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const changeFilter = (filterId) => {
    setActiveFilter(filterId);
    setPage(1);
  };

  const applyDatePreset = (presetId) => {
    if (datePreset === presetId) {
      setDatePreset('');
      setFromDate('');
      setToDate('');
      setPage(1);
      return;
    }
    const range = presetRange(presetId);
    setDatePreset(presetId);
    setFromDate(toInputDate(range.from));
    setToDate(toInputDate(range.to));
    setPage(1);
  };

  const handleFromDateChange = (value) => {
    setDatePreset('custom');
    setFromDate(value);
    setPage(1);
  };

  const handleToDateChange = (value) => {
    setDatePreset('custom');
    setToDate(value);
    setPage(1);
  };

  const clearDates = () => {
    setDatePreset('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const openRemarks = (title, text, name) => {
    if (!text) return;
    setRemarkModal({ title, text, name });
  };

  return (
    <div className="content-body ai-human-page">
      <div className="ai-human-head">
        <div>
          <h1>AI vs Human Counsellor</h1>
          <p>Same lead pe AI ne kya status diya, human ne verify karke kya rakha, aur status change hua ya nahi.</p>
        </div>
        <form className="ai-human-search" onSubmit={applySearch}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name / mobile"
          />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="ai-human-dates">
        <span className="ai-human-dates__label">
          {activeFilter === 'all' ? 'Lead created' : 'AI call date'}
        </span>
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`ai-human-chip ${datePreset === preset.id ? 'is-active' : ''}`}
            onClick={() => applyDatePreset(preset.id)}
          >
            {preset.label}
          </button>
        ))}
        <label className="ai-human-date-field">
          From
          <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => handleFromDateChange(e.target.value)} />
        </label>
        <label className="ai-human-date-field">
          To
          <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => handleToDateChange(e.target.value)} />
        </label>
        {(fromDate || toDate) && (
          <button type="button" className="ai-human-chip" onClick={clearDates}>Clear dates</button>
        )}
        <label className="ai-human-date-field">
          Counsellor
          <select
            value={counselorId}
            onChange={(e) => {
              setCounselorId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {counselorOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="ai-human-stats">
        <div className="ai-human-stat">
          <span>Total in this view</span>
          <strong>{String(totalCount).padStart(2, '0')}</strong>
        </div>
        <div className="ai-human-stat">
          <span>On this page</span>
          <strong>{String(pageSummary.shown).padStart(2, '0')}</strong>
        </div>
        <div className="ai-human-stat ai-human-stat--ai">
          <span>AI called (page)</span>
          <strong>{String(pageSummary.aiCalled).padStart(2, '0')}</strong>
        </div>
        <div className="ai-human-stat ai-human-stat--changed">
          <span>Status changed (page)</span>
          <strong>{String(pageSummary.changed).padStart(2, '0')}</strong>
        </div>
        <div className="ai-human-stat ai-human-stat--same">
          <span>Status same (page)</span>
          <strong>{String(pageSummary.same).padStart(2, '0')}</strong>
        </div>
      </div>

      <div className="ai-human-filters">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`ai-human-chip ${activeFilter === filter.id ? 'is-active' : ''}`}
            onClick={() => changeFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="ai-human-table-wrap">
        {loading ? (
          <div className="ai-human-empty">Loading comparison...</div>
        ) : error ? (
          <div className="ai-human-empty ai-human-empty--error">{error}</div>
        ) : rows.length === 0 ? (
          <div className="ai-human-empty">Is filter mein koi lead nahi mili.</div>
        ) : (
          <table className="ai-human-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Counsellor</th>
                <th>Date</th>
                <th>AI Call</th>
                <th>AI Status</th>
                <th>AI Remarks</th>
                <th>Human Status</th>
                <th>Human Remarks</th>
                <th>Compare</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.changed ? 'is-changed' : 'is-same'}>
                  <td>
                    <div className="ai-human-lead">
                      <strong>{row.name}</strong>
                      <span>{row.mobile}</span>
                      <small>{row.course}</small>
                    </div>
                  </td>
                  <td>
                    <span className="ai-human-status">{row.counselor}</span>
                  </td>
                  <td>
                    <div className="ai-human-lead">
                      <strong>{formatDateTime(row.aiCallAt || row.createdAt)}</strong>
                      <small>{row.aiCallAt ? 'AI call' : 'Lead created'}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`ai-human-pill ${row.aiCalled ? 'is-yes' : 'is-no'}`}>
                      {row.aiCalled ? 'Yes' : 'No'}
                    </span>
                    {row.humanCalled && (
                      <div className="ai-human-sub">Human follow-up done</div>
                    )}
                  </td>
                  <td>
                    <span className="ai-human-status">{row.aiStatus}</span>
                    {row.aiDisposition && (
                      <div className="ai-human-sub">{row.aiDisposition}</div>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ai-human-remark"
                      disabled={!row.aiRemarks}
                      onClick={() => openRemarks('AI Remarks', row.aiRemarks, row.name)}
                    >
                      {truncateText(row.aiRemarks)}
                    </button>
                  </td>
                  <td>
                    <span className="ai-human-status">{row.humanStatus}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ai-human-remark"
                      disabled={!row.humanRemarks}
                      onClick={() => openRemarks('Human Remarks', row.humanRemarks, row.name)}
                    >
                      {truncateText(row.humanRemarks)}
                    </button>
                  </td>
                  <td>
                    <span className={`ai-human-result ${row.changed ? 'is-changed' : 'is-same'}`}>
                      {row.changed ? 'Changed' : 'Same'}
                    </span>
                    {row.changed && (
                      <div className="ai-human-sub">{row.aiStatus} → {row.humanStatus}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="ai-human-pager">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}

      {remarkModal && (
        <div className="ai-human-modal" onClick={() => setRemarkModal(null)} role="presentation">
          <div className="ai-human-modal__card" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="ai-human-modal__head">
              <strong>{remarkModal.title}</strong>
              <span>{remarkModal.name}</span>
            </div>
            <p>{remarkModal.text}</p>
            <button type="button" onClick={() => setRemarkModal(null)}>Close</button>
          </div>
        </div>
      )}

      <style>{`
        .ai-human-page { padding: 18px 22px 40px; }
        .ai-human-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; margin-bottom: 18px; flex-wrap: wrap; }
        .ai-human-head h1 { margin: 0 0 6px; font-size: 26px; font-weight: 700; color: #1f2937; }
        .ai-human-head p { margin: 0; color: #6b7280; max-width: 620px; }
        .ai-human-search { display: flex; gap: 8px; }
        .ai-human-search input { min-width: 240px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; }
        .ai-human-dates { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; }
        .ai-human-dates__label { font-size: 12px; font-weight: 700; color: #6b7280; margin-right: 4px; }
        .ai-human-date-field { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #6b7280; }
        .ai-human-date-field input, .ai-human-date-field select { border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 10px; font-weight: 600; color: #111827; background: #fff; }
        .ai-human-date-field select { min-width: 180px; }
        .ai-human-search button, .ai-human-pager button, .ai-human-modal__card button {
          border: none; background: rgb(250, 85, 121); color: #fff; border-radius: 10px; padding: 10px 14px; font-weight: 600;
        }
        .ai-human-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 14px; }
        .ai-human-stat { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 12px; }
        .ai-human-stat span { display: block; color: #6b7280; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
        .ai-human-stat strong { font-size: 24px; color: #111827; }
        .ai-human-stat--ai strong { color: #2563eb; }
        .ai-human-stat--changed strong { color: #c2410c; }
        .ai-human-stat--same strong { color: #15803d; }
        .ai-human-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
        .ai-human-chip { border: 1.5px solid rgb(250, 85, 121); color: rgb(250, 85, 121); background: #fff; border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 700; }
        .ai-human-chip.is-active { background: rgb(250, 85, 121); color: #fff; }
        .ai-human-table-wrap { background: #fff; border: 1px solid #eee; border-radius: 14px; overflow: auto; }
        .ai-human-table { width: 100%; border-collapse: collapse; min-width: 980px; }
        .ai-human-table th { text-align: left; font-size: 12px; letter-spacing: .04em; text-transform: uppercase; color: #6b7280; padding: 12px; background: #fafafa; border-bottom: 1px solid #eee; }
        .ai-human-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; font-size: 13px; }
        .ai-human-table tr.is-changed { background: #fff7ed; }
        .ai-human-lead { display: flex; flex-direction: column; gap: 2px; }
        .ai-human-lead span, .ai-human-lead small, .ai-human-sub { color: #6b7280; }
        .ai-human-sub { margin-top: 4px; font-size: 11px; }
        .ai-human-pill, .ai-human-result, .ai-human-status { display: inline-flex; border-radius: 999px; padding: 4px 10px; font-weight: 700; font-size: 12px; }
        .ai-human-status { background: #f3f4f6; color: #111827; }
        .ai-human-pill.is-yes, .ai-human-result.is-same { background: #dcfce7; color: #166534; }
        .ai-human-pill.is-no { background: #f3f4f6; color: #6b7280; }
        .ai-human-result.is-changed { background: #ffedd5; color: #9a3412; }
        .ai-human-remark { width: 100%; text-align: left; background: transparent; border: none; color: #374151; padding: 0; }
        .ai-human-remark:disabled { color: #9ca3af; cursor: default; }
        .ai-human-empty { padding: 48px 16px; text-align: center; color: #6b7280; }
        .ai-human-empty--error { color: #b91c1c; }
        .ai-human-pager { display: flex; gap: 12px; align-items: center; justify-content: flex-end; margin-top: 14px; }
        .ai-human-pager button:disabled { opacity: .45; }
        .ai-human-modal { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1050; padding: 16px; }
        .ai-human-modal__card { width: min(640px, 100%); background: #fff; border-radius: 16px; padding: 18px; }
        .ai-human-modal__head { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .ai-human-modal__card p { white-space: pre-wrap; color: #374151; line-height: 1.5; }
      `}</style>
    </div>
  );
};

export default Lead;
