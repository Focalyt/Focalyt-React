import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import OverviewDashboard from './OverviewDashboard';
import CounselorPerformance from './CounselorPerformance';
import CenterAnalytics from './CenterAnalytics';
import CourseAnalysis from './CourseAnalysis';
import DetailedLeads from './DetailedLeads';

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState('today');
  const [activeMainTab, setActiveMainTab] = useState('overview');
  const [activeMetric, setActiveMetric] = useState('students');

  // Tab configuration
  const tabs = [
    {
      id: 'overview',
      label: 'Overview Dashboard',
      icon: 'fas fa-tachometer-alt',
      component: null, // We'll render overview content directly
      color: 'primary',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'counselors',
      label: 'Counselor Performance',
      icon: 'fas fa-users',
      component: CounselorPerformance,
      color: 'success',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'centers',
      label: 'Center Analytics',
      icon: 'fas fa-building',
      component: CenterAnalytics,
      color: 'info',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      id: 'courses',
      label: 'Course Analysis',
      icon: 'fas fa-graduation-cap',
      component: CourseAnalysis,
      color: 'warning',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      id: 'leads',
      label: 'Detailed Leads',
      icon: 'fas fa-chart-line',
      component: DetailedLeads,
      color: 'danger',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeMainTab);
  const ActiveComponent = activeTabData?.component;

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
      { label: 'Total Verticals', value: 12, icon: 'fas fa-building', color: 'primary', change: '+8%', changeType: 'positive' },
      { label: 'Active Projects', value: 45, icon: 'fas fa-project-diagram', color: 'success', change: '+12%', changeType: 'positive' },
      { label: 'Learning Centers', value: 28, icon: 'fas fa-map-marker-alt', color: 'info', change: '+5%', changeType: 'positive' },
      { label: 'Total Courses', value: 156, icon: 'fas fa-book', color: 'warning', change: '+15%', changeType: 'positive' },
      { label: 'Active Batches', value: 234, icon: 'fas fa-users', color: 'danger', change: '+7%', changeType: 'positive' },
      { label: 'Total Students', value: 3456, icon: 'fas fa-graduation-cap', color: 'dark', change: '+18%', changeType: 'positive' }
    ],
    revenueChart: [
       { month: 'Jan', students: 2800, leads: 456 },
      { month: 'Feb', students: 2950, leads: 512 },
      { month: 'Mar', students: 3100, leads: 478 },
      { month: 'Apr', students: 3200, leads: 534 },
      { month: 'May', students: 3350, leads: 567 },
      { month: 'Jun', students: 3456, leads: 589 }
    ],
    leadsData: [
      { day: 'Mon', leads: 15, conversions: 8 },
      { day: 'Tue', leads: 22, conversions: 12 },
      { day: 'Wed', leads: 18, conversions: 9 },
      { day: 'Thu', leads: 25, conversions: 15 },
      { day: 'Fri', leads: 20, conversions: 11 },
      { day: 'Sat', leads: 18, conversions: 10 },
      { day: 'Today', leads: 18, conversions: 7 }
    ],
    verticalData: [
      { name: 'Technology', value: 35, students: 1200, color: '#667eea' },
      { name: 'Business', value: 28, students: 980, color: '#f093fb' },
      { name: 'Design', value: 22, students: 760, color: '#4facfe' },
      { name: 'Marketing', value: 15, students: 516, color: '#43e97b' }
    ],
    centerPerformance: [
      { name: 'Mumbai Center', students: 856, attendance: 94, satisfaction: 4.6, trend: 'up' },
      { name: 'Delhi Center', students: 723, attendance: 91, satisfaction: 4.4, trend: 'up' },
      { name: 'Bangalore Center', students: 654, attendance: 96, satisfaction: 4.7, trend: 'up' },
      { name: 'Chennai Center', students: 543, attendance: 89, satisfaction: 4.2, trend: 'down' },
      { name: 'Pune Center', students: 445, attendance: 93, satisfaction: 4.5, trend: 'up' }
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
    switch (timeRange) {
      case 'today': return today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'week': return `Week of ${today.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
      case 'month': return today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
      case 'year': return today.getFullYear().toString();
      default: return 'Today';
    }
  };

  const timeRangeOptions = [
    { value: 'today', label: 'Today', icon: 'fas fa-calendar-day' },
    { value: 'week', label: 'Week', icon: 'fas fa-calendar-week' },
    { value: 'month', label: 'Month', icon: 'fas fa-calendar-alt' },
    { value: 'year', label: 'Year', icon: 'fas fa-calendar' }
  ];

  // Overview Dashboard Content Component
  const renderOverviewContent = () => (
    <>
      {/* Enhanced Metrics Cards */}
      <div className="metrics-section">
        <div className="row g-4 mb-4">
          {dashboardData.quickStats.map((stat, index) => (
            <div key={index} className="col-xl-2 col-lg-4 col-md-6">
              <div className="metric-card">
                <div className="metric-background"></div>
                <div className="metric-content">
                  <div className="metric-header">
                    <div className="metric-icon-wrapper">
                      <i className={stat.icon}></i>
                    </div>
                    <div className="metric-change">
                      <i className={`fas fa-arrow-${stat.changeType === 'positive' ? 'up' : 'down'}`}></i>
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  <div className="metric-body">
                    <div className="metric-value">
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="metric-label">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="row g-4 mb-4">
          {/* Revenue Trend Chart */}
          <div className="col-xl-8 col-lg-7">
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title">
                  <div className="title-icon">📈</div>
                  <div className="title-content">
                    <h6>Revenue & Growth Trends</h6>
                    <p>Track performance metrics over time</p>
                  </div>
                </div>
                <div className="chart-controls">
                  <div className="metric-selector">
                    {['students', 'leads'].map(metric => (
                      <button
                        key={metric}
                        className={`metric-btn ${activeMetric === metric ? 'active' : ''}`}
                        onClick={() => setActiveMetric(metric)}
                      >
                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={dashboardData.revenueChart}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f6" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: '#8B9AAF' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#8B9AAF' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => {
                        if (activeMetric === 'revenue') return formatCurrency(value);
                        return value.toLocaleString();
                      }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={activeMetric}
                      stroke="#667eea"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Today's Performance */}
          <div className="col-xl-4 col-lg-5">
            <div className="performance-card">
              <div className="performance-header">
                <div className="performance-title">
                  <div className="title-icon">🎯</div>
                  <h6>Today's Performance</h6>
                </div>
                <div className="performance-badge">
                  <span>Live</span>
                </div>
              </div>
              <div className="performance-grid">
                <div className="performance-item primary">
                  <div className="item-icon">
                    <i className="fas fa-user-plus"></i>
                  </div>
                  <div className="item-content">
                    <div className="item-value">{dashboardData.todayStats.newEnrollments}</div>
                    <div className="item-label">New Enrollments</div>
                  </div>
                </div>
                <div className="performance-item success">
                  <div className="item-icon">
                    <i className="fas fa-chalkboard-teacher"></i>
                  </div>
                  <div className="item-content">
                    <div className="item-value">{dashboardData.todayStats.activeClasses}</div>
                    <div className="item-label">Active Classes</div>
                  </div>
                </div>
                <div className="performance-item info">
                  <div className="item-icon">
                    <i className="fas fa-percentage"></i>
                  </div>
                  <div className="item-content">
                    <div className="item-value">{dashboardData.todayStats.conversionRate}%</div>
                    <div className="item-label">Conversion Rate</div>
                  </div>
                </div>
                <div className="performance-item warning">
                  <div className="item-icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="item-content">
                    <div className="item-value">{dashboardData.todayStats.attendanceRate}%</div>
                    <div className="item-label">Attendance Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row Charts */}
        <div className="row g-4 mb-4">
          {/* Leads Tracking */}
          <div className="col-xl-6">
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title">
                  <div className="title-icon">📊</div>
                  <div className="title-content">
                    <h6>Weekly Leads Tracking</h6>
                    <p>Leads vs conversions comparison</p>
                  </div>
                </div>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.leadsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f6" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12, fill: '#8B9AAF' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#8B9AAF' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="leads" fill="#667eea" name="Leads" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="conversions" fill="#f093fb" name="Conversions" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Vertical Distribution */}
          <div className="col-xl-6">
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title">
                  <div className="title-icon">🏢</div>
                  <div className="title-content">
                    <h6>Vertical Distribution</h6>
                    <p>Student distribution across verticals</p>
                  </div>
                </div>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={400}>
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
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Center Performance Table */}
      <div className="table-section">
        <div className="table-card">
          <div className="table-header">
            <div className="table-title">
              <div className="title-icon">🏫</div>
              <div className="title-content">
                <h6>Learning Centers Performance</h6>
                <p>Real-time performance metrics across all centers</p>
              </div>
            </div>
            <div className="table-actions">
              <button className="action-btn">
                <i className="fas fa-filter"></i>
                Filter
              </button>
              <button className="action-btn">
                <i className="fas fa-sort"></i>
                Sort
              </button>
            </div>
          </div>
          <div className="table-body">
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>CENTER</th>
                    <th>STUDENTS</th>
                    <th>ATTENDANCE</th>
                    <th>SATISFACTION</th>
                    <th>TREND</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.centerPerformance.map((center, index) => (
                    <tr key={index} className="table-row">
                      <td>
                        <div className="center-info">
                          <div className="center-avatar">
                            <i className="fas fa-building"></i>
                          </div>
                          <div className="center-details">
                            <div className="center-name">{center.name}</div>
                            <div className="center-type">Learning Center</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="student-count">
                          <span className="count-value">{center.students.toLocaleString()}</span>
                          <span className="count-label">students</span>
                        </div>
                      </td>
                      <td>
                        <div className="attendance-display">
                          <div className="attendance-bar">
                            <div 
                              className="attendance-fill"
                              style={{ width: `${center.attendance}%` }}
                            ></div>
                          </div>
                          <span className="attendance-value">{center.attendance}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="satisfaction-display">
                          <div className="rating-stars">
                            {[...Array(5)].map((_, i) => (
                              <i 
                                key={i} 
                                className={`fas fa-star ${i < Math.floor(center.satisfaction) ? 'filled' : ''}`}
                              ></i>
                            ))}
                          </div>
                          <span className="rating-value">{center.satisfaction}</span>
                        </div>
                      </td>
                      <td>
                        <div className={`trend-indicator ${center.trend}`}>
                          <i className={`fas fa-arrow-${center.trend === 'up' ? 'up' : 'down'}`}></i>
                          <span>{center.trend === 'up' ? 'Growing' : 'Declining'}</span>
                        </div>
                      </td>
                      <td>
                        <div className={`status-badge ${center.attendance >= 95 ? 'excellent' : center.attendance >= 90 ? 'good' : 'attention'}`}>
                          <div className="status-dot"></div>
                          <span>
                            {center.attendance >= 95 ? 'Excellent' : center.attendance >= 90 ? 'Good' : 'Needs Attention'}
                          </span>
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
    </>
  );

  return (
    <div className="modern-dashboard">
      {/* Enhanced Header Section */}
      <div className="dashboard-header">
        <div className="header-background">
          <div className="header-pattern"></div>
          <div className="header-content">
            <div className="container-fluid">
              <div className="row align-items-center py-4">
                <div className="col-lg-6">
                  <div className="header-title-section">
                    <div className="title-wrapper">
                      <div className="title-icon">
                        🎯
                      </div>
                      <div className="title-content">
                        <h1 className="dashboard-title">
                          Lead Management Dashboard
                        </h1>
                        <p className="dashboard-subtitle">
                          Comprehensive lead tracking, counselor performance & conversion analytics
                        </p>
                        <div className="live-indicator">
                          <div className="pulse-dot"></div>
                          <span>Live Data • {getTimeRangeText()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6 text-end">
                  <div className="header-controls">
                    {/* Enhanced Time Range Selector */}
                    <div className="time-range-selector">
                      <div className="range-label">View Period:</div>
                      <div className="range-buttons">
                        {timeRangeOptions.map(option => (
                          <button
                            key={option.value}
                            className={`range-btn ${timeRange === option.value ? 'active' : ''}`}
                            onClick={() => setTimeRange(option.value)}
                          >
                            <i className={option.icon}></i>
                            <span>{option.label}</span>
                            {timeRange === option.value && <div className="active-indicator"></div>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button className="export-btn">
                      <i className="fas fa-download"></i>
                      <span>Export Report</span>
                      <div className="btn-shine"></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Tab Navigation */}
              <div className="enhanced-tabs-container">
                <div className="tabs-wrapper">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`enhanced-tab ${activeMainTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveMainTab(tab.id)}
                      style={{
                        '--tab-gradient': tab.gradient
                      }}
                    >
                      <div className="tab-background"></div>
                      <div className="tab-content">
                        <div className="tab-icon-wrapper">
                          <i className={tab.icon}></i>
                        </div>
                        <span className="tab-text">{tab.label}</span>
                        {activeMainTab === tab.id && (
                          <div className="tab-active-indicator"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-body">
        <div className="container-fluid">
          {/* Tab Content Rendering */}
          {activeMainTab === 'overview' ? (
            renderOverviewContent()
          ) : ActiveComponent ? (
            <div className="tab-content-container">
              <ActiveComponent />
            </div>
          ) : (
            <div className="tab-content-container">
              <div className="tab-content-placeholder">
                <i className={`${activeTabData?.icon} fa-3x mb-3`} style={{ color: activeTabData?.gradient.match(/#[a-fA-F0-9]{6}/)?.[0] || '#667eea' }}></i>
                <div>{activeTabData?.label} Content</div>
                <p style={{ fontSize: '1rem', marginTop: '1rem', opacity: 0.7 }}>
                  This will show your {activeTabData?.label} component
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced CSS Styles */}
      <style jsx>{`
        .modern-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Enhanced Header */
        .dashboard-header {
          position: relative;
          overflow: hidden;
        }

        .header-background {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
        }

        .header-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%);
          background-size: 100px 100px;
        }

        .header-content {
          position: relative;
          z-index: 2;
        }

        .title-wrapper {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .title-icon {
          font-size: 3rem;
          background: rgba(255, 255, 255, 0.2);
          padding: 1rem;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .dashboard-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
          margin: 0.5rem 0 1rem 0;
          font-weight: 400;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #00ff88;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(0, 255, 136, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0); }
        }

        /* Enhanced Time Range Selector */
        .header-controls {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: flex-end;
        }

        .time-range-selector {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-end;
        }

        .range-label {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .range-buttons {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem;
          border-radius: 15px;
          backdrop-filter: blur(10px);
        }

        .range-btn {
          position: relative;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          overflow: hidden;
        }

        .range-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          transform: translateY(-2px);
        }

        .range-btn.active {
          background: rgba(255, 255, 255, 0.25);
          color: white;
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .active-indicator {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 3px;
          background: white;
          border-radius: 2px;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { width: 0; }
          to { width: 30px; }
        }

        .export-btn {
          position: relative;
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          border: none;
          color: white;
          padding: 1rem 2rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .export-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(0, 255, 136, 0.4);
        }

        .btn-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .export-btn:hover .btn-shine {
          left: 100%;
        }

        /* Enhanced Tabs */
        .enhanced-tabs-container {
          margin-top: 2rem;
          padding-bottom: 2rem;
        }

        .tabs-wrapper {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding: 0.5rem;
        }

        .enhanced-tab {
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          padding: 1rem 2rem;
          border-radius: 15px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          overflow: hidden;
          min-width: 200px;
        }

        .tab-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--tab-gradient);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .enhanced-tab.active .tab-background {
          opacity: 1;
        }

        .tab-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .tab-icon-wrapper {
          font-size: 1.2rem;
        }

        .enhanced-tab:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          color: white;
        }

        .enhanced-tab.active {
          color: white;
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }

        .tab-active-indicator {
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 4px;
          background: white;
          border-radius: 2px;
          animation: slideIn 0.3s ease;
        }

        /* Dashboard Body */
        .dashboard-body {
          padding: 2rem 0;
          margin-top: -1rem;
          position: relative;
          z-index: 3;
        }

        /* Enhanced Metrics Cards */
        .metrics-section {
          margin-bottom: 2rem;
        }

        .metric-card {
          position: relative;
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          height: 100%;
        }

        .metric-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
        }

        .metric-background {
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #667eea20, #764ba220);
          border-radius: 50%;
          transform: translate(30px, -30px);
        }

        .metric-content {
          position: relative;
          z-index: 2;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .metric-icon-wrapper {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .metric-change {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #00cc6a;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .metric-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .metric-label {
          color: #718096;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Enhanced Chart Cards */
        .charts-section {
          margin-bottom: 2rem;
        }

        .chart-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          height: 100%;
        }

        .chart-header {
          padding: 2rem 2rem 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #f1f5f9;
        }

        .chart-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .title-icon {
          font-size: 1.5rem;
          background: linear-gradient(135deg, #667eea20, #764ba220);
          padding: 0.75rem;
          border-radius: 12px;
        }

        .chart-title h6 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
        }

        .chart-title p {
          color: #718096;
          margin: 0.25rem 0 0 0;
          font-size: 0.9rem;
        }

        .metric-selector {
          display: flex;
          gap: 0.5rem;
          background: #f1f5f9;
          padding: 0.5rem;
          border-radius: 12px;
        }

        .metric-btn {
          background: none;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          color: #718096;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .metric-btn.active {
          background: white;
          color: #667eea;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .chart-body {
          padding: 1rem 2rem 2rem 2rem;
        }

        /* Performance Card */
        .performance-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          height: 100%;
        }

        .performance-header {
          padding: 2rem 2rem 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }

        .performance-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .performance-title h6 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
        }

        .performance-badge {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          animation: pulse 2s infinite;
        }

        .performance-grid {
          padding: 1.5rem 2rem 2rem 2rem;
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
        }

        .performance-item {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 15px;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
        }

        .performance-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .performance-item.primary { border-left: 4px solid #667eea; }
        .performance-item.success { border-left: 4px solid #00cc6a; }
        .performance-item.info { border-left: 4px solid #00b4d8; }
        .performance-item.warning { border-left: 4px solid #f59e0b; }

        .item-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
        }

        .performance-item.primary .item-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
        .performance-item.success .item-icon { background: linear-gradient(135deg, #00ff88, #00cc6a); }
        .performance-item.info .item-icon { background: linear-gradient(135deg, #00b4d8, #0077b6); }
        .performance-item.warning .item-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }

        .item-value {
          font-size: 2rem;
          font-weight: 800;
          color: #2d3748;
          line-height: 1;
        }

        .item-label {
          color: #718096;
          font-weight: 600;
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        /* Enhanced Table */
        .table-section {
          margin-top: 2rem;
        }

        .table-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .table-header {
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #f1f5f9;
        }

        .table-title h6 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
        }

        .table-title p {
          color: #718096;
          margin: 0.25rem 0 0 0;
          font-size: 0.9rem;
        }

        .table-actions {
          display: flex;
          gap: 1rem;
        }

        .action-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-btn:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .modern-table {
          width: 100%;
          border-collapse: collapse;
        }

        .modern-table th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 1.5rem 2rem;
          text-align: left;
          border: none;
        }

        .table-row {
          transition: all 0.3s ease;
          border-bottom: 1px solid #f1f5f9;
        }

        .table-row:hover {
          background: #f8fafc;
        }

        .modern-table td {
          padding: 1.5rem 2rem;
          border: none;
          vertical-align: middle;
        }

        .center-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .center-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
        }

        .center-name {
          font-weight: 700;
          color: #2d3748;
          font-size: 1rem;
        }

        .center-type {
          color: #718096;
          font-size: 0.85rem;
        }

        .student-count {
          display: flex;
          flex-direction: column;
        }

        .count-value {
          font-weight: 800;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .count-label {
          color: #718096;
          font-size: 0.8rem;
        }

        .attendance-display {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .attendance-bar {
          width: 80px;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .attendance-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .attendance-value {
          font-weight: 700;
          color: #2d3748;
          min-width: 40px;
        }

        .satisfaction-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rating-stars {
          display: flex;
          gap: 2px;
        }

        .rating-stars .fas.fa-star {
          color: #e2e8f0;
          font-size: 0.9rem;
        }

        .rating-stars .fas.fa-star.filled {
          color: #fbbf24;
        }

        .rating-value {
          font-weight: 700;
          color: #2d3748;
          margin-left: 0.5rem;
        }

        .trend-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .trend-indicator.up {
          background: rgba(0, 204, 106, 0.1);
          color: #00cc6a;
        }

        .trend-indicator.down {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .status-badge.excellent {
          background: rgba(0, 204, 106, 0.1);
          color: #00cc6a;
        }

        .status-badge.good {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .status-badge.attention {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        /* Tab Content */
        .tab-content-container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          margin: 2rem 0;
        }

        .tab-content-placeholder {
          text-align: center;
          padding: 4rem 2rem;
          color: #64748b;
          font-size: 1.2rem;
          font-weight: 600;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 15px;
          border: 2px dashed #cbd5e1;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .dashboard-title {
            font-size: 2rem;
          }
          
          .title-wrapper {
            flex-direction: column;
            text-align: center;
          }
          
          .header-controls {
            align-items: center;
            margin-top: 2rem;
          }
          
          .range-buttons {
            flex-wrap: wrap;
          }
          
          .tabs-wrapper {
            flex-direction: column;
          }
          
          .performance-grid {
            grid-template-columns: 1fr;
          }
          
          .chart-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          
          .table-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;


// import React, { useState, useEffect } from 'react';
// import {
//   LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
// } from 'recharts';

// import OverviewDashboard from './OverviewDashboard';
// import CounselorPerformance from './CounselorPerformance';
// import CenterAnalytics from './CenterAnalytics';
// import CourseAnalysis from './CourseAnalysis';
// import DetailedLeads from './DetailedLeads';
// import Lead from './Lead'

// const Dashboard = () => {
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [timeRange, setTimeRange] = useState('today');
//   const [activeMainTab, setActiveMainTab] = useState('overview');
//   const [activeMetric, setActiveMetric] = useState('students');

//   // Tab configuration
//   const tabs = [
//     {
//       id: 'overview',
//       label: 'Overview Dashboard',
//       icon: 'fas fa-tachometer-alt',
//       component: OverviewDashboard,
//       color: 'primary'
//     },
//     {
//       id: 'counselors',
//       label: 'Counselor Performance',
//       icon: 'fas fa-users',
//       component: CounselorPerformance,
//       color: 'success'
//     },
//     {
//       id: 'centers',
//       label: 'Center Analytics',
//       icon: 'fas fa-building',
//       component: CenterAnalytics,
//       color: 'info'
//     },
//     {
//       id: 'courses',
//       label: 'Course Analysis',
//       icon: 'fas fa-graduation-cap',
//       component: CourseAnalysis,
//       color: 'warning'
//     },
//     {
//       id: 'leads',
//       label: 'Detailed Leads',
//       icon: 'fas fa-chart-line',
//       component: DetailedLeads,
//       color: 'danger'
//     }
//   ];

//   const activeTabData = tabs.find(tab => tab.id === activeMainTab);
//   const ActiveComponent = activeTabData?.component;

//   // Sample data
//   const [dashboardData] = useState({
//     todayStats: {
//       totalStudents: 3456,
//       newEnrollments: 23,
//       activeClasses: 47,
//       todayLeads: 18,
//       yesterdayLeads: 15,
//       conversionRate: 24.5,
//       attendanceRate: 94.2
//     },
//     quickStats: [
//       { label: 'Total Verticals', value: 12, icon: 'bi-building', color: 'primary', change: '+8%' },
//       { label: 'Active Projects', value: 45, icon: 'bi-kanban', color: 'success', change: '+12%' },
//       { label: 'Learning Centers', value: 28, icon: 'bi-geo-alt', color: 'info', change: '+5%' },
//       { label: 'Total Courses', value: 156, icon: 'bi-book', color: 'warning', change: '+15%' },
//       { label: 'Active Batches', value: 234, icon: 'bi-people', color: 'danger', change: '+7%' },
//       { label: 'Total Students', value: 3456, icon: 'bi-mortarboard', color: 'dark', change: '+18%' }
//     ],
//     revenueChart: [
//       { month: 'Jan', students: 2800, leads: 456 },
//       { month: 'Feb', students: 2950, leads: 512 },
//       { month: 'Mar', students: 3100, leads: 478 },
//       { month: 'Apr', students: 3200, leads: 534 },
//       { month: 'May', students: 3350, leads: 567 },
//       { month: 'Jun', students: 3456, leads: 589 }
//     ],
//     leadsData: [
//       { day: 'Mon', leads: 15, conversions: 8},
//       { day: 'Tue', leads: 22, conversions: 12},
//       { day: 'Wed', leads: 18, conversions: 9},
//       { day: 'Thu', leads: 25, conversions: 15 },
//       { day: 'Fri', leads: 20, conversions: 11},
//       { day: 'Sat', leads: 18, conversions: 10},
//       { day: 'Today', leads: 18, conversions: 7}
//     ],
//     verticalData: [
//       { name: 'Technology', value: 35, students: 1200, color: '#0d6efd' },
//       { name: 'Business', value: 28, students: 980, color: '#198754' },
//       { name: 'Design', value: 22, students: 760, color: '#dc3545' },
//       { name: 'Marketing', value: 15, students: 516, color: '#ffc107' }
//     ],
//     centerPerformance: [
//       { name: 'Mumbai Center', students: 856, attendance: 94, satisfaction: 4.6 },
//       { name: 'Delhi Center', students: 723, attendance: 91, satisfaction: 4.4 },
//       { name: 'Bangalore Center', students: 654, attendance: 96, satisfaction: 4.7 },
//       { name: 'Chennai Center', students: 543, attendance: 89, satisfaction: 4.2},
//       { name: 'Pune Center', students: 445, attendance: 93, satisfaction: 4.5 }
//     ]
//   });

//   const formatCurrency = (value) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(value);
//   };

//   const getTimeRangeText = () => {
//     const today = new Date();
//     switch (timeRange) {
//       case 'today': return today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
//       case 'week': return `Week of ${today.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
//       case 'month': return today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
//       case 'year': return today.getFullYear().toString();
//       default: return 'Today';
//     }
//   };

//   return (
//     <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
//       {/* Header Section */}
//       <div className="row mb-4">
//        <div className="dashboard-header">
//         <div className="container-fluid">
//           <div className="row align-items-center py-3">
//             <div className="col-md-8">
//               <h1 className="dashboard-title">
//                 🎯 Lead Management Dashboard
//               </h1>
//               <p className="dashboard-subtitle">
//                 Comprehensive lead tracking, counselor performance & conversion analytics
//               </p>
//             </div>



//             <div className="col-md-4 text-end">
//               <div className="btn-group me-2">
//                 {['today', 'week', 'month', 'year'].map(range => (
//                   <button
//                     key={range}
//                     className={`btn ${timeRange === range ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
//                     onClick={() => setTimeRange(range)}
//                   >
//                     {range.charAt(0).toUpperCase() + range.slice(1)}
//                   </button>
//                 ))}
//               </div>
//               <button className="btn btn-success btn-sm">
//                 <i className="fas fa-download me-1"></i>
//                 Export Report
//               </button>
//             </div>
//           </div>

//           {/* Enhanced Tab Navigation */}
//           <div className="dashboard-tabs-container">
//             <ul className="nav nav-tabs dashboard-tabs">
//               {tabs.map((tab) => (
//                 <li className="nav-item" key={tab.id}>
//                   <button
//                     className={`nav-link dashboard-tab ${activeMainTab === tab.id ? 'active' : ''}`}
//                     onClick={() => setActiveMainTab(tab.id)}
//                     data-tab-color={tab.color}
//                   >
//                     <div className="tab-content-wrapper">
//                       <i className={`${tab.icon} tab-icon`}></i>
//                       <span className="tab-label">{tab.label}</span>
//                       {activeMainTab === tab.id && (
//                         <div className="tab-indicator"></div>
//                       )}
//                     </div>
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       </div>

//       {/* Tab Content */}
//       <div className="dashboard-content">
//         <div className="container-fluid py-4">
//           {ActiveComponent && <ActiveComponent />}
//         </div>
//       </div>



//       </div>

//       {/* Key Metrics Cards */}
//       <div className="row mb-4">
//         {dashboardData.quickStats.map((stat, index) => (
//           <div key={index} className="col-xl-2 col-lg-4 col-md-6 mb-3">
//             <div className="card border-0 shadow-sm h-100 hover-card">
//               <div className="card-body">
//                 <div className="d-flex align-items-center justify-content-between">
//                   <div className="flex-grow-1">
//                     <div className="text-muted small mb-1">{stat.label}</div>
//                     <div className="h5 mb-2 fw-bold">{stat.value.toLocaleString()}</div>
//                     <div className={`small text-${stat.color} fw-semibold`}>
//                       <i className="bi bi-arrow-up"></i> {stat.change}
//                     </div>
//                   </div>
//                   <div className={`bg-${stat.color} bg-opacity-10 rounded-3 p-3`}>
//                     <i className={`${stat.icon} text-${stat.color} fs-4`}></i>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Main Dashboard Content */}
//       <div className="row">
//         {/* Revenue Trend Chart */}
//         <div className="col-xl-8 col-lg-7 mb-4">
//           <div className="card border-0 shadow-sm h-100">
//             <div className="card-header bg-white border-0 pb-0">
//               <div className="d-flex justify-content-between align-items-center">
//                 <h6 className="card-title mb-0 fw-semibold">📈 Revenue & Growth Trends</h6>
//                 <div className="btn-group btn-group-sm">
                
//                   <button
//                     className={`btn ${activeMetric === 'students' ? 'btn-primary' : 'btn-outline-primary'}`}
//                     onClick={() => setActiveMetric('students')}
//                   >
//                     Students
//                   </button>
//                   <button
//                     className={`btn ${activeMetric === 'leads' ? 'btn-primary' : 'btn-outline-primary'}`}
//                     onClick={() => setActiveMetric('leads')}
//                   >
//                     Leads
//                   </button>
//                 </div>
//               </div>
//             </div>
//             <div className="card-body">
//               <div style={{ height: '350px' }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <AreaChart data={dashboardData.revenueChart}>
//                     <defs>
//                       <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.3} />
//                         <stop offset="95%" stopColor="#0d6efd" stopOpacity={0} />
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
//                     <XAxis dataKey="month" tick={{ fontSize: 12 }} />
//                     <YAxis tick={{ fontSize: 12 }} />
//                     <Tooltip
//                       formatter={(value) => activeMetric === 'revenue' ? formatCurrency(value) : value.toLocaleString()}
//                       labelStyle={{ color: '#495057' }}
//                       contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}
//                     />
//                     <Area
//                       type="monotone"
//                       dataKey={activeMetric}
//                       stroke="#0d6efd"
//                       fillOpacity={1}
//                       fill="url(#colorRevenue)"
//                       strokeWidth={3}
//                     />
//                   </AreaChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Today's Performance */}
//         <div className="col-xl-4 col-lg-5 mb-4">
//           <div className="card border-0 shadow-sm h-100">
//             <div className="card-header bg-white border-0 pb-0">
//               <h6 className="card-title mb-0 fw-semibold">🎯 Today's Performance</h6>
//             </div>
//             <div className="card-body">
//               <div className="row g-3">
//                 <div className="col-6">
//                   <div className="text-center p-3 bg-primary bg-opacity-10 rounded-3">
//                     <div className="h4 mb-1 text-primary fw-bold">{dashboardData.todayStats.newEnrollments}</div>
//                     <div className="small text-muted">New Enrollments</div>
//                   </div>
//                 </div>
//                 <div className="col-6">
//                   <div className="text-center p-3 bg-success bg-opacity-10 rounded-3">
//                     <div className="h4 mb-1 text-success fw-bold">{dashboardData.todayStats.activeClasses}</div>
//                     <div className="small text-muted">Active Classes</div>
//                   </div>
//                 </div>
               
//                 <div className="col-6">
//                   <div className="text-center p-3 bg-info bg-opacity-10 rounded-3">
//                     <div className="h4 mb-1 text-info fw-bold">{dashboardData.todayStats.conversionRate}%</div>
//                     <div className="small text-muted">Conversion Rate</div>
//                   </div>
//                 </div>
//                 <div className="col-6">
//                   <div className="text-center p-3 bg-danger bg-opacity-10 rounded-3">
//                     <div className="h4 mb-1 text-danger fw-bold">{dashboardData.todayStats.attendanceRate}%</div>
//                     <div className="small text-muted">Attendance Rate</div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="row">
//         {/* Leads Tracking */}
//         <div className="col-xl-6 col-lg-6 mb-4">
//           <div className="card border-0 shadow-sm h-100">
//             <div className="card-header bg-white border-0 pb-0">
//               <h6 className="card-title mb-0 fw-semibold">📊 Weekly Leads Tracking</h6>
//             </div>
//             <div className="card-body">
//               <div style={{ height: '300px' }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={dashboardData.leadsData}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
//                     <XAxis dataKey="day" tick={{ fontSize: 12 }} />
//                     <YAxis tick={{ fontSize: 12 }} />
//                     <Tooltip
//                       contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}
//                     />
//                     <Legend />
//                     <Bar dataKey="leads" fill="#0d6efd" name="Leads" radius={[4, 4, 0, 0]} />
//                     <Bar dataKey="conversions" fill="#198754" name="Conversions" radius={[4, 4, 0, 0]} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Vertical Distribution */}
//         <div className="col-xl-6 col-lg-6 mb-4">
//           <div className="card border-0 shadow-sm h-100">
//             <div className="card-header bg-white border-0 pb-0">
//               <h6 className="card-title mb-0 fw-semibold">🏢 Vertical Distribution</h6>
//             </div>
//             <div className="card-body">
//               <div style={{ height: '300px' }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={dashboardData.verticalData}
//                       cx="50%"
//                       cy="50%"
//                       innerRadius={60}
//                       outerRadius={120}
//                       dataKey="value"
//                       label={({ name, value }) => `${name}: ${value}%`}
//                       labelLine={false}
//                     >
//                       {dashboardData.verticalData.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={entry.color} />
//                       ))}
//                     </Pie>
//                     <Tooltip
//                       formatter={(value, name) => [`${value}%`, 'Share']}
//                       contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}
//                     />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Center Performance Table */}
//       <div className="row">
//         <div className="col-12">
//           <div className="card border-0 shadow-sm">
//             <div className="card-header bg-white border-0 pb-0">
//               <h6 className="card-title mb-0 fw-semibold">🏫 Learning Centers Performance</h6>
//             </div>
//             <div className="card-body">
//               <div className="table-responsive">
//                 <table className="table table-hover align-middle">
//                   <thead>
//                     <tr>
//                       <th className="border-0 text-muted small fw-semibold">CENTER NAME</th>
//                       <th className="border-0 text-muted small fw-semibold">STUDENTS</th>
//                       <th className="border-0 text-muted small fw-semibold">ATTENDANCE</th>
//                       <th className="border-0 text-muted small fw-semibold">SATISFACTION</th>
//                       <th className="border-0 text-muted small fw-semibold">STATUS</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {dashboardData.centerPerformance.map((center, index) => (
//                       <tr key={index}>
//                         <td>
//                           <div className="d-flex align-items-center">
//                             <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
//                               <i className="bi bi-building text-primary"></i>
//                             </div>
//                             <div>
//                               <div className="fw-semibold">{center.name}</div>
//                               <small className="text-muted">Learning Center</small>
//                             </div>
//                           </div>
//                         </td>
//                         <td>
//                           <span className="fw-semibold">{center.students.toLocaleString()}</span>
//                         </td>
//                         <td>
//                           <div className="d-flex align-items-center">
//                             <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
//                               <div
//                                 className={`progress-bar ${center.attendance >= 95 ? 'bg-success' : center.attendance >= 90 ? 'bg-warning' : 'bg-danger'}`}
//                                 style={{ width: `${center.attendance}%` }}
//                               ></div>
//                             </div>
//                             <span className="small fw-semibold">{center.attendance}%</span>
//                           </div>
//                         </td>
//                         <td>
//                           <div className="d-flex align-items-center">
//                             <span className="fw-semibold me-1">{center.satisfaction}</span>
//                             <div className="text-warning">
//                               {[...Array(5)].map((_, i) => (
//                                 <i key={i} className={`bi ${i < Math.floor(center.satisfaction) ? 'bi-star-fill' : 'bi-star'}`}></i>
//                               ))}
//                             </div>
//                           </div>
//                         </td>
                        
//                         <td>
//                           <span className={`badge ${center.attendance >= 95 ? 'bg-success' : center.attendance >= 90 ? 'bg-warning' : 'bg-danger'}`}>
//                             {center.attendance >= 95 ? 'Excellent' : center.attendance >= 90 ? 'Good' : 'Needs Attention'}
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Custom CSS */}
//       <style jsx>{`
//         .hover-card {
//           transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
//         }
//         .hover-card:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
//         }
//         .table th {
//           background-color: #f8f9fa;
//           font-weight: 600;
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//           font-size: 0.75rem;
//         }
//         .card {
//           border-radius: 12px;
//         }
//         .btn {
//           border-radius: 8px;
//         }
//         .progress {
//           border-radius: 4px;
//         }
//         .bg-opacity-10 {
//           background-color: rgba(var(--bs-primary-rgb), 0.1) !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Dashboard;