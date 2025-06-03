import React, { useState } from 'react';
import { 
  ComposedChart, Bar, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const CenterAnalytics = () => {
  // Center analytics data
  const [centerData] = useState({
    centerWiseLeads: [
      { center: 'Delhi North', totalLeads: 856, newLeads: 45, conversions: 167, revenue: 2456000, counselors: 4 },
      { center: 'Mumbai Central', totalLeads: 743, newLeads: 38, conversions: 145, revenue: 2234000, counselors: 3 },
      { center: 'Bangalore Tech', totalLeads: 923, newLeads: 52, conversions: 198, revenue: 2890000, counselors: 5 },
      { center: 'Pune City', totalLeads: 567, newLeads: 29, conversions: 112, revenue: 1678000, counselors: 3 },
      { center: 'Hyderabad Hub', totalLeads: 634, newLeads: 34, conversions: 134, revenue: 1945000, counselors: 3 },
      { center: 'Chennai Express', totalLeads: 445, newLeads: 23, conversions: 89, revenue: 1345000, counselors: 2 },
      { center: 'Kolkata Zone', totalLeads: 378, newLeads: 19, conversions: 76, revenue: 1123000, counselors: 2 }
    ]
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="center-analytics">
      <div className="section-header mb-4">
        <h3>🏢 Center-wise Performance Analytics</h3>
        <p className="text-muted">Compare performance across different centers and locations</p>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-2">
                <i className="fas fa-building"></i>
              </div>
              <h4 className="mb-1">{centerData.centerWiseLeads.length}</h4>
              <p className="text-muted mb-0">Active Centers</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-success mb-2">
                <i className="fas fa-users"></i>
              </div>
              <h4 className="mb-1">
                {centerData.centerWiseLeads.reduce((sum, c) => sum + c.totalLeads, 0)}
              </h4>
              <p className="text-muted mb-0">Total Leads</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-info mb-2">
                <i className="fas fa-chart-line"></i>
              </div>
              <h4 className="mb-1">
                {centerData.centerWiseLeads.reduce((sum, c) => sum + c.conversions, 0)}
              </h4>
              <p className="text-muted mb-0">Total Conversions</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-warning mb-2">
                <i className="fas fa-rupee-sign"></i>
              </div>
              <h4 className="mb-1">
                {formatCurrency(centerData.centerWiseLeads.reduce((sum, c) => sum + c.revenue, 0))}
              </h4>
              <p className="text-muted mb-0">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Center Performance Grid */}
      <div className="row mb-4">
        {centerData.centerWiseLeads.map((center, index) => (
          <div key={index} className="col-xl-3 col-lg-4 col-md-6 mb-4">
            <div className="center-card">
              <div className="center-header">
                <h5>{center.center}</h5>
                <span className="counselor-count">{center.counselors} Counselors</span>
              </div>
              <div className="center-stats">
                <div className="stat-row">
                  <span className="stat-label">Total Leads</span>
                  <span className="stat-value">{center.totalLeads}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">New Today</span>
                  <span className="stat-value text-primary">+{center.newLeads}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Conversions</span>
                  <span className="stat-value text-success">{center.conversions}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Revenue</span>
                  <span className="stat-value text-info">{formatCurrency(center.revenue)}</span>
                </div>
              </div>
              <div className="center-progress">
                <div className="progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${(center.conversions / center.totalLeads * 100)}%` }}
                  ></div>
                </div>
                <small className="text-muted">
                  {((center.conversions / center.totalLeads) * 100).toFixed(1)}% conversion rate
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Center Comparison Charts */}
      <div className="row">
        <div className="col-md-8 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h5 className="card-title mb-0 fw-semibold">📊 Center Performance Comparison</h5>
            </div>
            <div className="card-body">
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={centerData.centerWiseLeads}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="center" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalLeads" fill="#0d6efd" name="Total Leads" />
                    <Bar dataKey="conversions" fill="#198754" name="Conversions" />
                    <Line type="monotone" dataKey="newLeads" stroke="#fd7e14" strokeWidth={3} name="New Leads" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h5 className="card-title mb-0 fw-semibold">💰 Revenue Distribution</h5>
            </div>
            <div className="card-body">
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={centerData.centerWiseLeads}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      dataKey="revenue"
                      label={({ center, revenue }) => `${center}: ${formatCurrency(revenue)}`}
                    >
                      {centerData.centerWiseLeads.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Center Performance Table */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 pb-0">
              <h5 className="card-title mb-0 fw-semibold">📋 Detailed Center Performance</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Center Name</th>
                      <th>Total Leads</th>
                      <th>New Leads</th>
                      <th>Conversions</th>
                      <th>Conversion Rate</th>
                      <th>Revenue</th>
                      <th>Counselors</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centerData.centerWiseLeads.map((center, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                              <i className="fas fa-building text-primary"></i>
                            </div>
                            <div>
                              <div className="fw-semibold">{center.center}</div>
                              <small className="text-muted">Learning Center</small>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge bg-primary">{center.totalLeads}</span></td>
                        <td><span className="badge bg-info">+{center.newLeads}</span></td>
                        <td><span className="badge bg-success">{center.conversions}</span></td>
                        <td>
                          <div className="conversion-rate">
                            <div className="progress">
                              <div 
                                className="progress-bar bg-success" 
                                style={{ width: `${(center.conversions / center.totalLeads) * 100}%` }}
                              ></div>
                            </div>
                            <span className="rate-text">
                              {((center.conversions / center.totalLeads) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="text-success fw-bold">{formatCurrency(center.revenue)}</td>
                        <td><span className="badge bg-warning">{center.counselors}</span></td>
                        <td>
                          <div className="performance-indicator">
                            {(center.conversions / center.totalLeads) >= 0.2 ? '🏆' : 
                             (center.conversions / center.totalLeads) >= 0.18 ? '⭐' : 
                             (center.conversions / center.totalLeads) >= 0.15 ? '👍' : '📈'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .center-analytics .section-header h3 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0 0 0.5rem 0;
        }

        .center-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          height: 100%;
          transition: transform 0.2s ease;
        }

        .center-card:hover {
          transform: translateY(-2px);
        }

        .center-header {
          display: flex;
          justify-content: between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .center-header h5 {
          margin: 0;
          font-weight: 600;
          color: #2c3e50;
        }

        .counselor-count {
          background: #e9ecef;
          color: #6c757d;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .center-stats {
          margin-bottom: 1rem;
        }

        .stat-row {
          display: flex;
          justify-content: between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .stat-row:last-child {
          border-bottom: none;
        }

        .stat-label {
          color: #6c757d;
          font-size: 0.875rem;
        }

        .stat-value {
          font-weight: 600;
          color: #2c3e50;
        }

        .center-progress .progress {
          height: 6px;
          margin-bottom: 0.5rem;
        }

        .conversion-rate {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .conversion-rate .progress {
          width: 60px;
          height: 8px;
        }

        .rate-text {
          font-weight: 600;
          min-width: 40px;
        }

        .performance-indicator {
          font-size: 1.25rem;
          text-align: center;
        }

        .table th {
          background-color: #f8f9fa;
          font-weight: 600;
          border: none;
          padding: 1rem;
        }

        .table td {
          padding: 1rem;
          vertical-align: middle;
          border-color: #f0f0f0;
        }

        .card {
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
};

export default CenterAnalytics;