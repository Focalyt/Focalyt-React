import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const CounselorPerformance = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';
  const token = JSON.parse(sessionStorage.getItem('user') || '{}')?.token;

  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [matrix, setMatrix] = useState({});
  const [summary, setSummary] = useState(null);

  const fetchMatrix = async () => {
    try {
      if (!token) return;
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateFilter.start && dateFilter.end) {
        params.set('startDate', dateFilter.start);
        params.set('endDate', dateFilter.end);
      }

      const url = `${backendUrl}/college/counselor-performance-matrix${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await axios.get(url, { headers: { 'x-auth': token } });

      if (res.data?.status) {
        setMatrix(res.data.data || {});
        setSummary(res.data.summary || null);
      } else {
        setError(res.data?.message || 'Failed to fetch performance matrix');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch performance matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const entries = Object.entries(matrix || {});
    return entries
      .map(([counsellorName, data]) => ({ counsellorName, ...data }))
      .sort((a, b) => (b.Leads || 0) - (a.Leads || 0));
  }, [matrix]);

  const kycStats = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        const leads = Number(r.Leads || 0);
        const admissions = Number(r.Admissions || 0);
        const pendingKyc = Number(r.PendingKYC || 0);
        acc.totalLeads += leads;
        acc.totalAdmissions += admissions;
        acc.totalPendingKyc += pendingKyc;
        return acc;
      },
      { totalLeads: 0, totalAdmissions: 0, totalPendingKyc: 0 }
    );
  }, [rows]);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h4 className="mb-0">Counsellor Performance</h4>
          <div className="text-muted small">Real data from `GET /college/counselor-performance-matrix`</div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <input
            type="date"
            className="form-control form-control-sm"
            value={dateFilter.start}
            onChange={(e) => setDateFilter((prev) => ({ ...prev, start: e.target.value }))}
          />
          <input
            type="date"
            className="form-control form-control-sm"
            value={dateFilter.end}
            onChange={(e) => setDateFilter((prev) => ({ ...prev, end: e.target.value }))}
          />
          <button className="btn btn-sm btn-outline-primary" onClick={fetchMatrix} disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-sync-alt me-2"></i>}
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {summary && (
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">Counsellors</div>
                <div className="h4 mb-0">{summary.totalCounselors || 0}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">Total Leads</div>
                <div className="h4 mb-0">{summary.totalLeads || 0}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">Admissions</div>
                <div className="h4 mb-0">{summary.totalAdmissions || 0}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">Avg Conversion</div>
                <div className="h4 mb-0">{Number(summary.averageConversionRate || 0).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-start border-3 border-warning">
              <div className="card-body">
                <div className="text-muted small">KYC Pending (all counsellors)</div>
                <div className="h4 mb-0">{kycStats.totalPendingKyc}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">KYC Done (by admissions)</div>
                <div className="h4 mb-0">{kycStats.totalAdmissions}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">KYC Conversion</div>
                <div className="h5 mb-0">
                  {kycStats.totalLeads > 0
                    ? `${((kycStats.totalAdmissions / kycStats.totalLeads) * 100).toFixed(1)}%`
                    : '0.0%'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <strong>Performance table</strong>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Counsellor</th>
                <th>Leads</th>
                <th>Untouch</th>
                <th>Admissions</th>
                <th>Dropouts</th>
                <th>Pending KYC</th>
                <th>Paid</th>
                <th>Unpaid</th>
                <th>Conversion %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.counsellorName}>
                  <td className="fw-semibold">{r.counsellorName}</td>
                  <td>{r.Leads || 0}</td>
                  <td>{r.Untouch || 0}</td>
                  <td>{r.Admissions || 0}</td>
                  <td>{r.Dropouts || 0}</td>
                  <td>{r.PendingKYC || 0}</td>
                  <td>{r.Paid || 0}</td>
                  <td>{r.Unpaid || 0}</td>
                  <td>{Number(r.ConversionRate || 0).toFixed(1)}%</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">
                    {loading ? 'Loading…' : 'No data'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CounselorPerformance;

