import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const OverviewDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState('today');
  const [activeMetric, setActiveMetric] = useState('students');

  // Sample data
  const [dashboardData] = useState({
    todayStats: {
      totalStudents: 3456,
      newEnrollments: 23,
      activeClasses: 47,
      todayLeads: 18,
      yesterdayLeads: 15,
      conversionRate: 24.5,
      attendanceRate: 94.2
    },
    quickStats: [
      { label: 'Total Verticals', value: 12, icon: 'bi-building', color: 'primary', change: '+8%' },
      { label: 'Active Projects', value: 45, icon: 'bi-kanban', color: 'success', change: '+12%' },
      { label: 'Learning Centers', value: 28, icon: 'bi-geo-alt', color: 'info', change: '+5%' },
      { label: 'Total Courses', value: 156, icon: 'bi-book', color: 'warning', change: '+15%' },
      { label: 'Active Batches', value: 234, icon: 'bi-people', color: 'danger', change: '+7%' },
      { label: 'Total Students', value: 3456, icon: 'bi-mortarboard', color: 'dark', change: '+18%' }
    ],
    leadsData: [
      { day: 'Mon', leads: 15, conversions: 8},
      { day: 'Tue', leads: 22, conversions: 12},
      { day: 'Wed', leads: 18, conversions: 9},
      { day: 'Thu', leads: 25, conversions: 15},
      { day: 'Fri', leads: 20, conversions: 11},
      { day: 'Sat', leads: 18, conversions: 10},
      { day: 'Today', leads: 18, conversions: 7}
    ],
    revenueChart: [
      { month: 'Jan', students: 2800, leads: 456 },
      { month: 'Feb', students: 2950, leads: 512 },
      { month: 'Mar', students: 3100, leads: 478 },
      { month: 'Apr', students: 3200, leads: 534 },
      { month: 'May', students: 3350, leads: 567 },
      { month: 'Jun', students: 3456, leads: 589 }
    ], 
    verticalData: [
      { name: 'Technology', value: 35, students: 1200, color: '#0d6efd' },
      { name: 'Business', value: 28, students: 980, color: '#198754' },
      { name: 'Design', value: 22, students: 760, color: '#dc3545' },
      { name: 'Marketing', value: 15, students: 516, color: '#ffc107' }
    ],
    centerPerformance: [
      { name: 'Mumbai Center', students: 856, attendance: 94, satisfaction: 4.6 },
      { name: 'Delhi Center', students: 723, attendance: 91, satisfaction: 4.4 },
      { name: 'Bangalore Center', students: 654, attendance: 96, satisfaction: 4.7},
      { name: 'Chennai Center', students: 543, attendance: 89, satisfaction: 4.2},
      { name: 'Pune Center', students: 445, attendance: 93, satisfaction: 4.5}
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

  const getTimeRangeText = () => {
    const today = new Date();
    switch(timeRange) {
      case 'today': return today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'week': return `Week of ${today.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
      case 'month': return today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
      case 'year': return today.getFullYear().toString();
      default: return 'Today';
    }
  };

  return (
    <div className="overview-dashboard">
      {/* Date Display */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center">
                <i className="bi bi-calendar3 text-primary me-3 fs-5"></i>
                <div>
                  <h6 className="mb-0 fw-semibold">{getTimeRangeText()}</h6>
                  <small className="text-muted">Last updated: {new Date().toLocaleTimeString()}</small>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-md-end">
              <div className="d-flex justify-content-md-end gap-4">
                <div className="text-center">
                  <div className="text-muted small">Yesterday</div>
                  <div className="fw-bold text-secondary">{dashboardData.todayStats.yesterdayLeads} leads</div>
                </div>
                <div className="text-center">
                  <div className="text-muted small">Today</div>
                  <div className="fw-bold text-primary">{dashboardData.todayStats.todayLeads} leads</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="row mb-4">
        {dashboardData.quickStats.map((stat, index) => (
          <div key={index} className="col-xl-2 col-lg-4 col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100 hover-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="flex-grow-1">
                    <div className="text-muted small mb-1">{stat.label}</div>
                    <div className="h5 mb-2 fw-bold">{stat.value.toLocaleString()}</div>
                    <div className={`small text-${stat.color} fw-semibold`}>
                      <i className="bi bi-arrow-up"></i> {stat.change}
                    </div>
                  </div>
                  <div className={`bg-${stat.color} bg-opacity-10 rounded-3 p-3`}>
                    <i className={`${stat.icon} text-${stat.color} fs-4`}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Dashboard Content */}
      <div className="row">
        {/* Revenue Trend Chart */}
        <div className="col-xl-8 col-lg-7 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0 fw-semibold">Growth Trends</h6>
                <div className="btn-group btn-group-sm">
                 
                  <button 
                    className={`btn ${activeMetric === 'students' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveMetric('students')}
                  >
                    Students
                  </button>
                  <button 
                    className={`btn ${activeMetric === 'leads' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveMetric('leads')}
                  >
                    Leads
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.revenueChart}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => activeMetric === 'revenue' ? formatCurrency(value) : value.toLocaleString()}
                      labelStyle={{ color: '#495057' }}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={activeMetric} 
                      stroke="#0d6efd" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Performance */}
        <div className="col-xl-4 col-lg-5 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="card-title mb-0 fw-semibold">🎯 Today's Performance</h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6">
                  <div className="text-center p-3 bg-primary bg-opacity-10 rounded-3">
                    <div className="h4 mb-1 text-primary fw-bold">{dashboardData.todayStats.newEnrollments}</div>
                    <div className="small text-muted">New Enrollments</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded-3">
                    <div className="h4 mb-1 text-success fw-bold">{dashboardData.todayStats.activeClasses}</div>
                    <div className="small text-muted">Active Classes</div>
                  </div>
                </div>
               
                <div className="col-6">
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded-3">
                    <div className="h4 mb-1 text-info fw-bold">{dashboardData.todayStats.conversionRate}%</div>
                    <div className="small text-muted">Conversion Rate</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center p-3 bg-danger bg-opacity-10 rounded-3">
                    <div className="h4 mb-1 text-danger fw-bold">{dashboardData.todayStats.attendanceRate}%</div>
                    <div className="small text-muted">Attendance Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Leads Tracking */}
        <div className="col-xl-6 col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="card-title mb-0 fw-semibold">📊 Weekly Leads Tracking</h6>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.leadsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="leads" fill="#0d6efd" name="Leads" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conversions" fill="#198754" name="Conversions" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Distribution */}
        <div className="col-xl-6 col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="card-title mb-0 fw-semibold">🏢 Vertical Distribution</h6>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.verticalData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={false}
                    >
                      {dashboardData.verticalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, 'Share']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Performance Table */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="card-title mb-0 fw-semibold">🏫 Learning Centers Performance</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th className="border-0 text-muted small fw-semibold">CENTER NAME</th>
                      <th className="border-0 text-muted small fw-semibold">STUDENTS</th>
                      <th className="border-0 text-muted small fw-semibold">ATTENDANCE</th>
                      <th className="border-0 text-muted small fw-semibold">SATISFACTION</th>
                      <th className="border-0 text-muted small fw-semibold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.centerPerformance.map((center, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                              <i className="bi bi-building text-primary"></i>
                            </div>
                            <div>
                              <div className="fw-semibold">{center.name}</div>
                              <small className="text-muted">Learning Center</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-semibold">{center.students.toLocaleString()}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                              <div 
                                className={`progress-bar ${center.attendance >= 95 ? 'bg-success' : center.attendance >= 90 ? 'bg-warning' : 'bg-danger'}`}
                                style={{ width: `${center.attendance}%` }}
                              ></div>
                            </div>
                            <span className="small fw-semibold">{center.attendance}%</span>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="fw-semibold me-1">{center.satisfaction}</span>
                            <div className="text-warning">
                              {[...Array(5)].map((_, i) => (
                                <i key={i} className={`bi ${i < Math.floor(center.satisfaction) ? 'bi-star-fill' : 'bi-star'}`}></i>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${center.attendance >= 95 ? 'bg-success' : center.attendance >= 90 ? 'bg-warning' : 'bg-danger'}`}>
                            {center.attendance >= 95 ? 'Excellent' : center.attendance >= 90 ? 'Good' : 'Needs Attention'}
                          </span>
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

      {/* Custom CSS */}
      <style jsx>{`
        .hover-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .table th {
          background-color: #f8f9fa;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.75rem;
        }
        .card {
          border-radius: 12px;
        }
        .btn {
          border-radius: 8px;
        }
        .progress {
          border-radius: 4px;
        }
        .bg-opacity-10 {
          background-color: rgba(var(--bs-primary-rgb), 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default OverviewDashboard;