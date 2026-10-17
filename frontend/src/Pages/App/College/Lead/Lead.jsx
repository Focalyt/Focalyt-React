import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
const PAGE_SIZE = 20;

const FILTERS = [
  { id: 'ai-called', label: 'AI called', countKey: 'aiCalled' },
  { id: 'changed', label: 'Status changed', countKey: 'changed' },
  { id: 'same', label: 'Status same', countKey: 'same' },
  { id: 'all', label: 'All leads', countKey: null },
];

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
];

/* ---------- helpers (logic unchanged) ---------- */
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
  return { human: humanLines.join('\n').trim(), ai: aiLines.join('\n').trim() };
};

const truncateText = (value, max = 140) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
};

const isAiCallCompleted = (profile) => (
  String(profile?.aiVoice?.lastEvent || '').toUpperCase() === 'CALL_COMPLETED'
);

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const presetRange = (id) => {
  const today = startOfDay(new Date());
  const back = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d;
  };
  if (id === 'today') return { from: today, to: today };
  if (id === 'yesterday') return { from: back(1), to: back(1) };
  if (id === '7d') return { from: back(6), to: today };
  if (id === '30d') return { from: back(29), to: today };
  return { from: null, to: null };
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const initials = (name) => String(name || '?')
  .split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

/* ---------- multi select ---------- */
const MultiSelectCheckbox = ({ title, options, selectedValues, onChange, icon, isOpen, onToggle }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  const toggleValue = (value) => {
    onChange(selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]);
  };

  const filteredOptions = [...options]
    .sort((a, b) => (a?.label || '').localeCompare(b?.label || '', undefined, { sensitivity: 'base' }))
    .filter((o) => (o?.label || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const labelFor = (val) => options.find((o) => o.value === val)?.label || val;

  const display = () => {
    if (selectedValues.length === 0) return `All ${title.toLowerCase()}s`;
    if (selectedValues.length <= 2) return selectedValues.map(labelFor).join(', ');
    return `${selectedValues.length} selected`;
  };

  return (
    <div className="ah-ms">
      <button
        type="button"
        className={`ah-ms__trigger ${isOpen ? 'is-open' : ''} ${selectedValues.length ? 'has-value' : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <i className={`${icon} ah-ms__icon`} />
        <span className="ah-ms__text">
          <small>{title}</small>
          <span>{display()}</span>
        </span>
        {selectedValues.length > 0 && <b className="ah-ms__count">{selectedValues.length}</b>}
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} ah-ms__arrow`} />
      </button>
      {isOpen && (
        <div className="ah-ms__panel">
          <div className="ah-ms__search">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="ah-ms__list">
            {filteredOptions.map((option) => (
              <label key={option.value} className="ah-ms__option">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => toggleValue(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <div className="ah-ms__none">
                {searchTerm ? `No match for "${searchTerm}"` : `No ${title.toLowerCase()}s available`}
              </div>
            )}
          </div>
          {selectedValues.length > 0 && (
            <button type="button" className="ah-ms__clear" onClick={() => onChange([])}>
              Clear {selectedValues.length} selected
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- page ---------- */
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
  const [compareCounts, setCompareCounts] = useState({ aiCalled: 0, changed: 0, same: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ai-called');
  const [datePreset, setDatePreset] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [courseIds, setCourseIds] = useState([]);
  const [counselorIds, setCounselorIds] = useState([]);
  const [leadSourceIds, setLeadSourceIds] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [counselorOptions, setCounselorOptions] = useState([]);
  const [sourceOptions, setSourceOptions] = useState([]);
  const [openFilter, setOpenFilter] = useState('');
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
        const iso = new Date(`${fromDate}T00:00:00`).toISOString();
        if (activeFilter === 'all') params.createdFromDate = iso;
        else params.aiCallFromDate = iso;
      }
      if (toDate) {
        const iso = new Date(`${toDate}T00:00:00`).toISOString();
        if (activeFilter === 'all') params.createdToDate = iso;
        else params.aiCallToDate = iso;
      }
      if (courseIds.length) params.course = JSON.stringify(courseIds);
      if (counselorIds.length) params.counselor = JSON.stringify(counselorIds);
      if (leadSourceIds.length) params.leadSource = JSON.stringify(leadSourceIds);

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
      setCompareCounts({
        aiCalled: Number(response.data.compare?.aiCalled || 0),
        changed: Number(response.data.compare?.changed || 0),
        same: Number(response.data.compare?.same || 0),
      });
    } catch (err) {
      setLeads([]);
      setTotalCount(0);
      setCompareCounts({ aiCalled: 0, changed: 0, same: 0 });
      setError(err.response?.data?.message || err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, activeFilter, fromDate, toDate, courseIds, counselorIds, leadSourceIds]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    if (!token) return;
    const fetchFilterOptions = async () => {
      try {
        const [filterRes, sourceRes] = await Promise.all([
          axios.get(`${backendUrl}/college/filters-data`, { headers: { 'x-auth': token } }),
          axios.get(`${backendUrl}/college/users/sources`, { headers: { 'x-auth': token } }),
        ]);
        if (filterRes.data?.status) {
          setCourseOptions((filterRes.data.courses || []).map((c) => ({ value: c._id, label: c.name || 'Course' })));
          const active = (filterRes.data.counselors || []).filter(
            (c) => c?.status === true || c?.status === 'active' || c?.status == null
          );
          setCounselorOptions(active.map((c) => ({ value: c._id, label: c.name })));
        }
        const sourceRows = sourceRes.data?.data || sourceRes.data?.sources || [];
        setSourceOptions(sourceRows.map((s) => ({ value: s._id, label: s.name || s.sourceName || 'Source' })));
      } catch {
        setCourseOptions([]);
        setCounselorOptions([]);
        setSourceOptions([]);
      }
    };
    fetchFilterOptions();
  }, [token]);

  useEffect(() => {
    const onDown = (event) => {
      if (!event.target.closest('.ah-ms')) setOpenFilter('');
    };
    const onKey = (event) => {
      if (event.key === 'Escape') { setOpenFilter(''); setRemarkModal(null); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const changeMultiFilter = (setter) => (values) => { setter(values); setPage(1); };

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

  const applySearch = (event) => {
    event?.preventDefault?.();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const changeFilter = (id) => { setActiveFilter(id); setPage(1); };

  const applyDatePreset = (presetId) => {
    if (datePreset === presetId) {
      setDatePreset(''); setFromDate(''); setToDate(''); setPage(1);
      return;
    }
    const range = presetRange(presetId);
    setDatePreset(presetId);
    setFromDate(toInputDate(range.from));
    setToDate(toInputDate(range.to));
    setPage(1);
  };

  const handleFromDateChange = (value) => { setDatePreset('custom'); setFromDate(value); setPage(1); };
  const handleToDateChange = (value) => { setDatePreset('custom'); setToDate(value); setPage(1); };
  const clearDates = () => { setDatePreset(''); setFromDate(''); setToDate(''); setPage(1); };

  const openRemarks = (title, text, name) => {
    if (!text) return;
    setRemarkModal({ title, text, name });
  };

  const hasActiveFilters = Boolean(
    fromDate || toDate || courseIds.length || counselorIds.length || leadSourceIds.length || search
  );

  const clearAll = () => {
    clearDates();
    setCourseIds([]); setCounselorIds([]); setLeadSourceIds([]);
    setSearchInput(''); setSearch(''); setPage(1);
  };

  const countFor = (f) => (f.countKey ? compareCounts[f.countKey] : null);

  const RemarkButton = ({ label, text, name }) => (
    <button
      type="button"
      className="ah-remark"
      disabled={!text}
      onClick={() => openRemarks(label, text, name)}
    >
      {text ? truncateText(text, 80) : '—'}
      {text && text.length > 80 && <em>Read full</em>}
    </button>
  );

  return (
    <div className="content-body ah">
      {/* Header */}
      <header className="ah-head">
        <div>
          <h1>AI vs human counsellor</h1>
        </div>
        <form className="ah-search" onSubmit={applySearch}>
          <i className="fas fa-search" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or mobile"
          />
          <button type="submit">Search</button>
        </form>
      </header>

      {/* View tabs with counts */}
      <nav className="ah-tabs" aria-label="Lead view">
        {FILTERS.map((f) => {
          const count = countFor(f);
          return (
            <button
              key={f.id}
              type="button"
              className={`ah-tab ah-tab--${f.id} ${activeFilter === f.id ? 'is-active' : ''}`}
              onClick={() => changeFilter(f.id)}
            >
              <span className="ah-tab__label">{f.label}</span>
              <strong>{count === null ? (activeFilter === 'all' ? totalCount : '') : count}</strong>
            </button>
          );
        })}
      </nav>

      {/* Filters */}
      <section className="ah-filters">
        <div className="ah-filters__row">
          <span className="ah-filters__label">
            {activeFilter === 'all' ? 'Lead created' : 'AI call date'}
          </span>
          <div className="ah-chips">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`ah-chip ${datePreset === p.id ? 'is-active' : ''}`}
                onClick={() => applyDatePreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="ah-dates">
            <label>
              <span>From</span>
              <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => handleFromDateChange(e.target.value)} />
            </label>
            <label>
              <span>To</span>
              <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => handleToDateChange(e.target.value)} />
            </label>
          </div>
          {hasActiveFilters && (
            <button type="button" className="ah-link" onClick={clearAll}>Clear all filters</button>
          )}
        </div>
        <div className="ah-filters__grid">
          <MultiSelectCheckbox
            title="Course"
            options={courseOptions}
            selectedValues={courseIds}
            onChange={changeMultiFilter(setCourseIds)}
            icon="fas fa-graduation-cap"
            isOpen={openFilter === 'course'}
            onToggle={() => setOpenFilter((c) => (c === 'course' ? '' : 'course'))}
          />
          <MultiSelectCheckbox
            title="Counsellor"
            options={counselorOptions}
            selectedValues={counselorIds}
            onChange={changeMultiFilter(setCounselorIds)}
            icon="fas fa-user-tie"
            isOpen={openFilter === 'counsellor'}
            onToggle={() => setOpenFilter((c) => (c === 'counsellor' ? '' : 'counsellor'))}
          />
          <MultiSelectCheckbox
            title="Lead source"
            options={sourceOptions}
            selectedValues={leadSourceIds}
            onChange={changeMultiFilter(setLeadSourceIds)}
            icon="fas fa-bullseye"
            isOpen={openFilter === 'source'}
            onToggle={() => setOpenFilter((c) => (c === 'source' ? '' : 'source'))}
          />
        </div>
      </section>

      {/* Results */}
      <div className="ah-results-meta">
        <span>
          {loading ? 'Loading leads...' : `${totalCount} ${totalCount === 1 ? 'lead' : 'leads'} in this view`}
        </span>
      </div>

      {loading ? (
        <div className="ah-list" aria-busy="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className="ah-skeleton" />)}
        </div>
      ) : error ? (
        <div className="ah-empty ah-empty--error">
          <strong>Couldn't load leads</strong>
          <p>{error}</p>
          <button type="button" className="ah-btn" onClick={fetchLeads}>Try again</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="ah-empty">
          <strong>No leads match these filters</strong>
          <p>Clear a filter or widen the date range to see more leads.</p>
          {hasActiveFilters && <button type="button" className="ah-btn" onClick={clearAll}>Clear all filters</button>}
        </div>
      ) : (
        <div className="ah-table-wrap">
          <table className="ah-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Counsellor</th>
                <th>Date</th>
                <th>AI call</th>
                <th>AI status</th>
                <th>AI remarks</th>
                <th>Human status</th>
                <th>Human remarks</th>
                <th>Compare</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.changed ? 'is-changed' : 'is-same'}>
                  <td>
                    <div className="ah-person">
                      <span className="ah-avatar" aria-hidden="true">{initials(row.name)}</span>
                      <div>
                        <strong>{row.name}</strong>
                        <span>{row.mobile}</span>
                        <small>{row.course}</small>
                      </div>
                    </div>
                  </td>
                  <td><span className="ah-cell-main">{row.counselor}</span></td>
                  <td>
                    <span className="ah-cell-main">{formatDateTime(row.aiCallAt || row.createdAt)}</span>
                    <small className="ah-cell-sub">{row.aiCallAt ? 'AI call' : 'Lead created'}</small>
                  </td>
                  <td>
                    <span className={`ah-pill ${row.aiCalled ? 'is-yes' : 'is-no'}`}>
                      {row.aiCalled ? 'Yes' : 'No'}
                    </span>
                    {row.humanCalled && <small className="ah-cell-sub">Human follow-up done</small>}
                  </td>
                  <td>
                    <span className="ah-status ah-status--ai">{row.aiStatus}</span>
                    {row.aiDisposition && <small className="ah-cell-sub">{row.aiDisposition}</small>}
                  </td>
                  <td><RemarkButton label="AI remarks" text={row.aiRemarks} name={row.name} /></td>
                  <td><span className="ah-status ah-status--human">{row.humanStatus}</span></td>
                  <td><RemarkButton label="Human remarks" text={row.humanRemarks} name={row.name} /></td>
                  <td>
                    <span className={`ah-pill ${row.changed ? 'is-changed' : 'is-same'}`}>
                      {row.changed ? 'Changed' : 'Same'}
                    </span>
                    {row.changed && (
                      <small className="ah-cell-sub">{row.aiStatus} → {row.humanStatus}</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="ah-pager">
          <button type="button" className="ah-btn ah-btn--ghost" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" className="ah-btn ah-btn--ghost" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}

      {remarkModal && (
        <div className="ah-modal" onClick={() => setRemarkModal(null)} role="presentation">
          <div className="ah-modal__card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={remarkModal.title}>
            <header>
              <div>
                <h4>{remarkModal.title}</h4>
                <span>{remarkModal.name}</span>
              </div>
              <button type="button" className="ah-icon-btn" onClick={() => setRemarkModal(null)} aria-label="Close">
                <i className="fas fa-xmark" />
              </button>
            </header>
            <p>{remarkModal.text}</p>
          </div>
        </div>
      )}

      <style>{`
        .ah {
          --brand: #fa5579; --brand-soft: #fff0f3; --brand-ink: #c2204a;
          --ai: #4f46e5; --ai-soft: #eef0ff;
          --human: #0d7a62; --human-soft: #e6f6f1;
          --warn: #b45309; --warn-soft: #fef3e2;
          --ink: #1e2230; --muted: #667085; --line: #e7e9ef; --surface: #fff; --bg: #f5f6fa;
          padding: 24px 28px 48px; color: var(--ink); font-size: 14px;
        }
        .ah *, .ah *::before, .ah *::after { box-sizing: border-box; }
        .ah button { font-family: inherit; cursor: pointer; }
        .ah button:focus-visible, .ah input:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }

        /* header */
        .ah-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
        .ah-head h1 { margin: 0 0 4px; font-size: 26px; font-weight: 700; letter-spacing: -0.01em; }
        .ah-head p { margin: 0; color: var(--muted); }
        .ah-search { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 5px 5px 5px 14px; width: min(100%, 400px); }
        .ah-search:focus-within { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-soft); }
        .ah-search i { color: var(--muted); }
        .ah-search input { flex: 1; border: none; outline: none !important; background: transparent; padding: 8px 0; min-width: 0; font-size: 14px; }
        .ah-search button, .ah-btn { border: none; background: var(--brand); color: #fff; border-radius: 9px; padding: 9px 16px; font-weight: 600; font-size: 13px; }
        .ah-search button:hover, .ah-btn:hover { background: #e8426a; }
        .ah-btn--ghost { background: var(--surface); color: var(--ink); border: 1px solid var(--line); }
        .ah-btn--ghost:hover { background: var(--bg); }
        .ah-btn:disabled { opacity: .45; cursor: not-allowed; }

        /* tabs */
        .ah-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
        .ah-tab { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; text-align: left; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; transition: border-color .15s, box-shadow .15s; }
        .ah-tab:hover { border-color: #cfd3de; }
        .ah-tab__label { color: var(--muted); font-weight: 600; font-size: 13px; }
        .ah-tab strong { font-size: 28px; line-height: 1; font-weight: 700; min-height: 28px; font-variant-numeric: tabular-nums; }
        .ah-tab--ai-called strong { color: var(--ai); }
        .ah-tab--changed strong { color: var(--warn); }
        .ah-tab--same strong { color: var(--human); }
        .ah-tab.is-active { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-soft); }
        .ah-tab.is-active .ah-tab__label { color: var(--ink); }

        /* filters */
        .ah-filters { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px; position: relative; z-index: 5; }
        .ah-filters__row { display: flex; align-items: center; gap: 12px 16px; flex-wrap: wrap; }
        .ah-filters__label { font-weight: 600; color: var(--ink); }
        .ah-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .ah-chip { border: 1px solid var(--line); background: var(--surface); color: var(--ink); border-radius: 999px; padding: 6px 13px; font-size: 13px; font-weight: 600; transition: background .15s, border-color .15s; }
        .ah-chip:hover { background: var(--bg); }
        .ah-chip.is-active { background: var(--brand-soft); border-color: var(--brand); color: var(--brand-ink); }
        .ah-dates { display: flex; gap: 10px; flex-wrap: wrap; }
        .ah-dates label { display: flex; align-items: center; gap: 6px; color: var(--muted); font-weight: 600; font-size: 13px; }
        .ah-dates input { border: 1px solid var(--line); border-radius: 9px; padding: 6px 9px; color: var(--ink); background: var(--surface); font-size: 13px; }
        .ah-link { border: none; background: none; color: var(--brand-ink); font-weight: 600; font-size: 13px; padding: 4px; margin-left: auto; }
        .ah-link:hover { text-decoration: underline; }
        .ah-filters__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }

        /* multi select */
        .ah-ms { position: relative; }
        .ah-ms__trigger { width: 100%; display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 11px; padding: 8px 12px; text-align: left; }
        .ah-ms__trigger:hover { border-color: #cfd3de; }
        .ah-ms__trigger.is-open, .ah-ms__trigger.has-value { border-color: var(--brand); }
        .ah-ms__icon { color: var(--muted); width: 16px; text-align: center; }
        .ah-ms__trigger.has-value .ah-ms__icon { color: var(--brand); }
        .ah-ms__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .ah-ms__text small { color: var(--muted); font-size: 11px; font-weight: 600; }
        .ah-ms__text span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
        .ah-ms__count { background: var(--brand); color: #fff; border-radius: 999px; font-size: 11px; min-width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px; }
        .ah-ms__arrow { color: var(--muted); font-size: 11px; }
        .ah-ms__panel { position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 30; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 12px 32px rgba(30, 34, 48, .14); overflow: hidden; }
        .ah-ms__search { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--line); color: var(--muted); }
        .ah-ms__search input { flex: 1; border: none; outline: none !important; padding: 5px 0; font-size: 13px; min-width: 0; }
        .ah-ms__list { max-height: 220px; overflow-y: auto; padding: 4px; }
        .ah-ms__option { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; cursor: pointer; margin: 0; font-size: 13px; }
        .ah-ms__option:hover { background: var(--bg); }
        .ah-ms__option input { accent-color: var(--brand); width: 15px; height: 15px; }
        .ah-ms__none { padding: 16px; text-align: center; color: var(--muted); font-size: 13px; }
        .ah-ms__clear { width: 100%; border: none; border-top: 1px solid var(--line); background: var(--bg); padding: 9px; font-size: 12px; font-weight: 600; color: var(--brand-ink); }

        /* results */
        .ah-results-meta { color: var(--muted); font-weight: 600; margin: 0 2px 10px; }
        .ah-list { display: flex; flex-direction: column; gap: 12px; }
        .ah-skeleton { height: 168px; border-radius: 14px; background: linear-gradient(90deg, #eceef4 25%, #f6f7fb 50%, #eceef4 75%); background-size: 200% 100%; animation: ah-shimmer 1.4s infinite linear; }
        @keyframes ah-shimmer { to { background-position: -200% 0; } }
        @media (prefers-reduced-motion: reduce) { .ah-skeleton { animation: none; } }



        .ah-empty { background: var(--surface); border: 1px dashed #cfd3de; border-radius: 14px; padding: 48px 16px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .ah-empty strong { font-size: 16px; }
        .ah-empty p { margin: 0 0 8px; color: var(--muted); }
        .ah-empty--error strong { color: #b42318; }

        .ah-pager { display: flex; gap: 14px; align-items: center; justify-content: flex-end; margin-top: 18px; color: var(--muted); font-weight: 600; }

        /* modal */
        .ah-modal { position: fixed; inset: 0; background: rgba(20, 24, 38, .5); display: flex; align-items: center; justify-content: center; z-index: 1050; padding: 16px; }
        .ah-modal__card { width: min(620px, 100%); max-height: 80vh; overflow: auto; background: var(--surface); border-radius: 16px; padding: 20px; }
        .ah-modal__card header { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .ah-modal__card h4 { margin: 0; font-size: 17px; }
        .ah-modal__card header span { color: var(--muted); }
        .ah-modal__card p { margin: 0; white-space: pre-wrap; line-height: 1.6; }
        .ah-icon-btn { border: none; background: var(--bg); width: 32px; height: 32px; border-radius: 50%; color: var(--muted); flex: none; }
        .ah-icon-btn:hover { color: var(--ink); }

        .ah-table-wrap { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; overflow: auto; }
        .ah-table { width: 100%; min-width: 1040px; border-collapse: separate; border-spacing: 0; }
        .ah-table th { position: sticky; top: 0; text-align: left; background: #fafbfd; color: var(--muted); font-size: 12px; font-weight: 700; padding: 12px 16px; border-bottom: 1px solid var(--line); white-space: nowrap; }
        .ah-table td { padding: 14px 16px; border-bottom: 1px solid var(--line); vertical-align: top; color: var(--ink); background: var(--surface); }
        .ah-table tbody tr:last-child td { border-bottom: none; }
        .ah-table tbody tr:hover td { background: #fafbfd; }
        .ah-table tbody tr td:first-child { box-shadow: inset 3px 0 0 var(--human); }
        .ah-table tbody tr.is-changed td:first-child { box-shadow: inset 3px 0 0 var(--warn); }
        .ah-person { display: flex; align-items: center; gap: 12px; min-width: 190px; }
        .ah-person > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .ah-person strong { font-weight: 700; }
        .ah-person span, .ah-person small { color: var(--muted); }
        .ah-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--brand-soft); color: var(--brand-ink); font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; flex: none; }
        .ah-cell-main { display: block; font-weight: 600; }
        .ah-cell-sub { display: block; margin-top: 4px; color: var(--muted); font-size: 11px; font-weight: 600; }
        .ah-pill, .ah-status { display: inline-flex; border-radius: 999px; padding: 4px 11px; font-weight: 700; font-size: 12px; white-space: nowrap; }
        .ah-pill.is-yes, .ah-pill.is-same { background: var(--human-soft); color: var(--human); }
        .ah-pill.is-no { background: #f1f2f6; color: var(--muted); }
        .ah-pill.is-changed { background: var(--warn-soft); color: var(--warn); }
        .ah-status--ai { background: var(--ai-soft); color: var(--ai); }
        .ah-status--human { background: var(--human-soft); color: var(--human); }
        .ah-remark { display: block; width: 100%; min-width: 180px; max-width: 280px; text-align: left; background: transparent; border: none; padding: 0; color: var(--ink); line-height: 1.45; font-size: 13px; }
        .ah-remark:disabled { color: #a0a6b5; cursor: default; }
        .ah-remark em { display: block; margin-top: 3px; font-style: normal; font-weight: 700; font-size: 12px; color: var(--brand-ink); }
        .ah-remark:not(:disabled):hover em { text-decoration: underline; }

        /* responsive */
        @media (max-width: 900px) {
          .ah { padding: 16px 14px 40px; }
          .ah-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ah-filters__grid { grid-template-columns: 1fr; }
          .ah-link { margin-left: 0; }
        }
      `}</style>
    </div>
  );
};

export default Lead;