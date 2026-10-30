import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './trainerTimetable.css';

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const mondayOf = (value) => {
  const date = new Date(value);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return date;
};
const addDays = (value, count) => {
  const date = new Date(value);
  date.setDate(date.getDate() + count);
  return date;
};

export default function TrainerTimetable({ backendUrl, token, onSelect, onScheduleLoaded }) {
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [batch, setBatch] = useState('');
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(week, index)), [week]);
  const from = dateKey(days[0]);
  const to = dateKey(days[6]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setBookings([]);
    const load = async () => {
      try {
        if (!token) throw new Error('Sign in to view your timetable.');
        const response = await axios.get(`${backendUrl}/college/timetable/my-bookings`, {
          headers: { 'x-auth': token }, params: { from, to }, signal: controller.signal,
        });
        if (!response.data?.status) throw new Error(response.data?.message || 'Could not load timetable');
        if (controller.signal.aborted) return;
        const rows = response.data.data || [];
        setBookings(rows);
        onScheduleLoaded(rows);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.response?.data?.message || err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [backendUrl, token, from, to, refresh, onScheduleLoaded]);

  useEffect(() => {
    const update = () => setRefresh((value) => value + 1);
    window.addEventListener('focus', update);
    const timer = window.setInterval(update, 60000);
    return () => { window.removeEventListener('focus', update); window.clearInterval(timer); };
  }, []);

  const batches = [...new Map(bookings.map((row) => [row.batchId, row.batchName])).entries()];
  const visible = bookings.filter((row) => !batch || row.batchId === batch);
  const ranges = [...new Set(visible.map((row) => `${row.startTime}|${row.endTime}`))].sort();
  const today = dateKey(new Date());
  const changeWeek = (offset) => { setWeek((value) => addDays(value, offset)); setBatch(''); };

  return (
    <section className="trainer-tt" aria-label="My weekly class timetable">
      <div className="trainer-tt__toolbar">
        <div><h2>My Class Timetable</h2><p>Choose a class to view its topic, study material and attendance.</p></div>
        <div className="trainer-tt__controls">
          <button type="button" aria-label="Previous week" onClick={() => changeWeek(-7)}>‹</button>
          <strong>{days[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {days[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
          <button type="button" aria-label="Next week" onClick={() => changeWeek(7)}>›</button>
          <button type="button" onClick={() => { setWeek(mondayOf(new Date())); setBatch(''); }}>This week</button>
          <button type="button" onClick={() => setRefresh((value) => value + 1)}>Refresh</button>
        </div>
      </div>
      <div className="trainer-tt__legend">
        <span>{loading ? 'Loading classes…' : `${visible.length} scheduled classes`}</span>
        <label>Batch <select value={batch} onChange={(event) => setBatch(event.target.value)}><option value="">All batches</option>{batches.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      </div>
      {error ? <div className="trainer-tt__empty" role="alert">{error} <button type="button" onClick={() => setRefresh((value) => value + 1)}>Try again</button></div> : (
        <div className="trainer-tt__scroll" aria-busy={loading} tabIndex={0} role="region" aria-label="Weekly timetable, scroll for more classes">
          <table className="trainer-tt__table">
            <thead><tr><th scope="col">Time</th>{days.map((day) => <th scope="col" key={dateKey(day)} className={dateKey(day) === today ? 'is-today' : ''}><span>{day.toLocaleDateString('en-IN', { weekday: 'short' })}</span><strong>{day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong>{dateKey(day) === today && <small>Today</small>}</th>)}</tr></thead>
            <tbody>{ranges.map((range) => {
              const [start, end] = range.split('|');
              return <tr key={range}><th scope="row">{start}<span>to {end}</span></th>{days.map((day) => {
                const rows = visible.filter((row) => row.dateKey === dateKey(day) && row.startTime === start && row.endTime === end);
                return <td key={dateKey(day)} className={dateKey(day) === today ? 'is-today' : ''}>{rows.length ? rows.map((row) => <button type="button" className={`trainer-tt__class trainer-tt__class--${row.track}`} key={row._id} title={[row.period, row.title, row.topic, row.batchName, `${row.startTime}?${row.endTime}`].filter(Boolean).join(" ? ")} onClick={() => onSelect(row)}><small>{row.period || 'Class'} · {row.track}</small><strong title={row.title}>{row.title || 'Untitled session'}</strong><span title={row.batchName}>{row.batchName}</span><em>View class →</em></button>) : <span className="trainer-tt__free">—</span>}</td>;
              })}</tr>;
            })}{!ranges.length && <tr><td colSpan={8} className="trainer-tt__empty">{loading ? 'Loading timetable…' : 'No classes scheduled for this week.'}</td></tr>}</tbody>
          </table>
        </div>
      )}
      {!loading && !error && ranges.length > 5 && <div className="trainer-tt__scroll-note">Scroll inside the timetable for more classes ? Click a class for details</div>}
    </section>
  );
}
