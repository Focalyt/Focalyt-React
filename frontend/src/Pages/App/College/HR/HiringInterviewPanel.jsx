import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import './HiringInterviewPanel.css';

const STAGES = ['shortlisted', 'interview due', 'interviewed', 'on hold',
  'offer letter rollout', 'hiring on hold', 'hired', 'rejected'];
const title = value => value ? value.replace(/\b\w/g, char => char.toUpperCase()) : 'Not started';
const formatDate = value => value ? new Date(value).toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
}) : 'Not scheduled';
const inputDate = value => value && Number.isFinite(new Date(value).getTime())
  ? new Date(new Date(value).getTime() + 330 * 60000).toISOString().slice(0, 16) : '';

export default function HiringInterviewPanel({ profile, backendUrl, token, onSaved }) {
  const [summary, setSummary] = useState(profile.corporateHiringStatus || null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [retry, setRetry] = useState(0);
  const [form, setForm] = useState({ status: 'shortlisted', eventDate: '', concernedPerson: '', comment: '' });
  const dialog = useRef(null);
  const url = `${backendUrl}/college/hr/leads/${profile._id}/hiring`;

  useEffect(() => { setSummary(profile.corporateHiringStatus || null); }, [profile.corporateHiringStatus]);
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
    axios.get(url, { headers: { 'x-auth': token }, signal: controller.signal }).then(response => {
      if (controller.signal.aborted) return;
      if (!response.data?.success) throw new Error(response.data?.message || 'Unable to load hiring details.');
      const next = response.data.data;
      setData(next); setSummary(next.hiring);
      setForm({ status: next.hiring?.status || 'shortlisted', eventDate: inputDate(next.hiring?.eventDate),
        concernedPerson: next.hiring?.concernedPerson || '', comment: next.hiring?.comment || '' });
    }).catch(err => {
      if (!controller.signal.aborted) setError(err.response?.data?.message || err.message || 'Unable to load hiring details.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, retry, url, token]);

  const close = () => { if (!saving) setOpen(false); };
  const updateField = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
  const save = async event => {
    event.preventDefault();
    if (saving) return;
    const date = form.eventDate ? new Date(`${form.eventDate}+05:30`) : null;
    if (form.status === 'interview due' && (!date || date <= new Date())) {
      setError('Choose a future interview date and time.'); return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      const response = await axios.put(url, { ...form, eventDate: date ? date.toISOString() : null }, { headers: { 'x-auth': token } });
      if (!response.data?.success) throw new Error(response.data?.message || 'Unable to save hiring details.');
      const next = response.data.data;
      setData(next); setSummary(next.hiring);
      onSaved?.(next.hiring, next.company.id);
      setSuccess('Hiring details saved.'); setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to save hiring details.');
    } finally { setSaving(false); }
  };

  return (
    <section className="hr-hiring-panel" aria-label="Hiring and interview">
      <div className="hr-hiring-panel__heading"><i className="fas fa-user-tie" aria-hidden="true" /> Hiring &amp; Interview</div>
      <span className={`hr-hiring-panel__stage hr-hiring-panel__stage--${summary?.status?.replace(/\s/g, '-') || 'none'}`}>{title(summary?.status)}</span>
      <span className="hr-hiring-panel__date"><i className="far fa-calendar-alt" aria-hidden="true" /> {formatDate(summary?.eventDate)} <small>{summary?.eventDate ? 'IST' : ''}</small></span>
      <button type="button" className="hr-hiring-panel__manage" onClick={event => { event.stopPropagation(); setSuccess(''); setOpen(true); }}>Manage hiring</button>
      {success && <span className="hr-hiring-panel__success" role="status">{success}</span>}
      {open && createPortal(
        <dialog ref={dialog} className="hr-hiring-dialog" aria-labelledby={`hr-hiring-title-${profile._id}`} onCancel={event => { event.preventDefault(); close(); }}>
          <header className="hr-hiring-dialog__header">
            <div><small>HR · HIRING WORKSPACE</small><h2 id={`hr-hiring-title-${profile._id}`}>Hiring &amp; Interview</h2><p>{profile._candidate?.name} · {profile._course?.name}</p></div>
            <button type="button" aria-label="Close hiring details" onClick={close} disabled={saving}>×</button>
          </header>
          <div className="hr-hiring-dialog__body">
            {loading && <p role="status">Loading hiring details…</p>}
            {error && <div className="hr-hiring-dialog__error" role="alert">{error}{!data && !loading && <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button>}</div>}
            {data && !loading && <form onSubmit={save}>
              <div className="hr-hiring-dialog__context"><strong>{data.company.name}</strong><span>Job: {data.job.title}</span></div>
              <p className="hr-hiring-dialog__note">This company’s hiring record is shared with the corporate portal. Lead performance and Call/Visit follow-ups remain separate.</p>
              {data.hiring?.jobId && data.hiring.jobId !== data.job.id && <p className="hr-hiring-dialog__note">Current record: {data.hiring.jobTitle || 'Another job at this company'}. Saving will link it to {data.job.title}.</p>}
              <div className="hr-hiring-dialog__fields">
                <label>Hiring stage<select name="status" value={form.status} onChange={updateField} required disabled={saving}>
                  {!STAGES.includes(form.status) && <option value={form.status}>{title(form.status)}</option>}
                  {STAGES.map(stage => <option key={stage} value={stage}>{title(stage)}</option>)}
                </select></label>
                <label>Event date &amp; time · IST<input type="datetime-local" name="eventDate" value={form.eventDate} onChange={updateField} required={form.status === 'interview due'} disabled={saving} /></label>
                <label className="hr-hiring-dialog__full">Concerned person<select name="concernedPerson" value={form.concernedPerson} onChange={updateField} disabled={saving}>
                  <option value="">Not assigned</option>
                  {form.concernedPerson && !data.executives.some(person => person.id === form.concernedPerson) && <option value={form.concernedPerson} disabled>Previously assigned person (select again)</option>}
                  {data.executives.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
                </select></label>
                <label className="hr-hiring-dialog__full">Comment / interview notes<textarea name="comment" value={form.comment} onChange={updateField} rows={4} maxLength={2000} disabled={saving} /></label>
              </div>
              {data.hiring?.updatedAt && <p className="hr-hiring-dialog__note">Last updated: {formatDate(data.hiring.updatedAt)} IST</p>}
              <footer className="hr-hiring-dialog__actions"><button type="button" onClick={close} disabled={saving}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save hiring details'}</button></footer>
            </form>}
          </div>
        </dialog>, document.body)}
    </section>
  );
}
