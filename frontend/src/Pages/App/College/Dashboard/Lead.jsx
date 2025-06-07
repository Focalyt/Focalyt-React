import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  FunnelChart, Funnel, LabelList
} from 'recharts';

const Lead = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState('today');
  const [activeTab, setActiveTab] = useState('overview');
  const [leadFilter, setLeadFilter] = useState('all');
  const [viewMode, setViewMode] = useState('analytics');

  // Sample leads data structure based on CRM
  const [leadsData] = useState({
    summary: {
      totalLeads: 2847,
      todayLeads: 23,
      yesterdayLeads: 18,
      hotLeads: 156,
      warmLeads: 234,
      coldLeads: 189,
      convertedLeads: 445,
      conversionRate: 15.6,
      avgResponseTime: '2.3 hours',
      followupsDue: 67,
      overdueTasks: 12
    },
    
    // Lead status distribution
    statusDistribution: [
      { status: 'Hot Lead', count: 156, percentage: 25, color: '#dc3545', milestone: 'High Priority', icon: '🔥' },
      { status: 'Warm Lead', count: 234, percentage: 37, color: '#fd7e14', milestone: 'Follow-up', icon: '⚡' },
      { status: 'Cold Lead', count: 189, percentage: 30, color: '#6c757d', milestone: 'Nurture', icon: '❄️' },
      { status: 'Converted', count: 445, percentage: 18, color: '#198754', milestone: 'Success', icon: '✅' },
      { status: 'Lost', count: 89, percentage: 8, color: '#dc3545', milestone: 'Archive', icon: '❌' }
    ],

    // Daily leads trend (last 30 days)
    dailyTrend: [
      { date: '01 Jun', newLeads: 15, conversions: 3, followups: 8 },
      { date: '02 Jun', newLeads: 22, conversions: 5, followups: 12 },
      { date: '03 Jun', newLeads: 18, conversions: 2, followups: 9 },
      { date: '04 Jun', newLeads: 25, conversions: 7, followups: 15 },
      { date: '05 Jun', newLeads: 20, conversions: 4, followups: 11 },
      { date: '06 Jun', newLeads: 28, conversions: 6, followups: 14 },
      { date: '07 Jun', newLeads: 32, conversions: 8, followups: 18 },
      { date: '08 Jun', newLeads: 19, conversions: 3, followups: 10 },
      { date: '09 Jun', newLeads: 26, conversions: 6, followups: 13 },
      { date: '10 Jun', newLeads: 30, conversions: 9, followups: 16 }
    ],

    // Monthly performance
    monthlyPerformance: [
      { month: 'Jan', leads: 456, conversions: 67, conversionRate: 14.7 },
      { month: 'Feb', leads: 512, conversions: 79, conversionRate: 15.4 },
      { month: 'Mar', leads: 478, conversions: 72, conversionRate: 15.1 },
      { month: 'Apr', leads: 534, conversions: 88, conversionRate: 16.5 },
      { month: 'May', leads: 567, conversions: 91, conversionRate: 16.1 },
      { month: 'Jun', leads: 589, conversions: 96, conversionRate: 16.3 }
    ],

    // Lead sources
    leadSources: [
      { source: 'Website', leads: 45, percentage: 32, color: '#0d6efd' },
      { source: 'Social Media', leads: 28, percentage: 20, color: '#198754'},
      { source: 'Email Campaign', leads: 22, percentage: 16, color: '#dc3545'},
      { source: 'Referrals', leads: 18, percentage: 13, color: '#ffc107'},
      { source: 'Phone Calls', leads: 15, percentage: 11, color: '#6f42c1'},
      { source: 'Other', leads: 11, percentage: 8, color: '#fd7e14'}
    ],

    // Conversion funnel
    conversionFunnel: [
      { stage: 'Total Leads', value: 1000, fill: '#8884d8' },
      { stage: 'Qualified', value: 750, fill: '#82ca9d' },
      { stage: 'Proposal Sent', value: 500, fill: '#ffc658' },
      { stage: 'Negotiation', value: 300, fill: '#ff7300' },
      { stage: 'Closed Won', value: 156, fill: '#00ff88' }
    ],

    // Team performance
    teamPerformance: [
      { name: 'Rahul Sharma', leads: 67, conversions: 12, conversionRate: 17.9, status: 'online' },
      { name: 'Priya Singh', leads: 54, conversions: 9, conversionRate: 16.7,status: 'online' },
      { name: 'Amit Kumar', leads: 48, conversions: 8, conversionRate: 16.3,status: 'away' },
      { name: 'Sneha Patel', leads: 41, conversions: 6, conversionRate: 14.6,status: 'offline' },
      { name: 'Vikash Gupta', leads: 38, conversions: 5, conversionRate: 13.2,status: 'online' }
    ],

    // Recent activities
    recentActivities: [
      { id: 1, type: 'new_lead', message: 'New lead added - John Doe', time: '2 minutes ago', user: 'Rahul Sharma' },
      { id: 2, type: 'conversion', message: 'Lead converted to admission', time: '15 minutes ago', user: 'Priya Singh' },
      { id: 3, type: 'followup', message: 'Follow-up call completed', time: '1 hour ago', user: 'Amit Kumar' },
      { id: 4, type: 'status_change', message: 'Lead status changed to Hot', time: '2 hours ago', user: 'Sneha Patel' },
      { id: 5, type: 'document', message: 'Documents verified', time: '3 hours ago', user: 'Vikash Gupta' }
    ],

    // Lead quality metrics
    qualityMetrics: {
      avgLeadScore: 78,
      emailOpenRate: 34.5,
      phoneConnectRate: 67.8,
      meetingBookedRate: 23.4,
      proposalAcceptRate: 45.6
    }
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

  const getStatusIcon = (type) => {
    switch(type) {
      case 'new_lead': return 'bi-person-plus-fill text-primary';
      case 'conversion': return 'bi-check-circle-fill text-success';
      case 'followup': return 'bi-telephone-fill text-info';
      case 'status_change': return 'bi-arrow-up-circle-fill text-warning';
      case 'document': return 'bi-file-earmark-check-fill text-secondary';
      default: return 'bi-circle-fill';
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Enhanced Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h1 className="h2 mb-1 text-dark fw-bold">
                🎯 Advanced Leads Management Dashboard
              </h1>
              <p className="text-muted mb-0">Comprehensive lead tracking, analytics & conversion insights</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              {/* Time Range Selector */}
              <div className="btn-group" role="group">
                {[
                  { key: 'today', label: 'Today', icon: 'bi-calendar-day' },
                  { key: 'week', label: 'Week', icon: 'bi-calendar-week' },
                  { key: 'month', label: 'Month', icon: 'bi-calendar-month' },
                  { key: 'year', label: 'Year', icon: 'bi-calendar-range' }
                ].map(range => (
                  <button
                    key={range.key}
                    type="button"
                    className={`btn ${timeRange === range.key ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                    onClick={() => setTimeRange(range.key)}
                  >
                    <i className={`${range.icon} me-1`}></i>
                    {range.label}
                  </button>
                ))}
              </div>
              <button className="btn btn-success btn-sm">
                <i className="bi bi-download me-2"></i>Export Analytics
              </button>
              <button className="btn btn-info btn-sm">
                <i className="bi bi-person-plus me-2"></i>Add Lead
              </button>
            </div>
          </div>
          
          {/* Enhanced Date Display */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body py-3">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                      <i className="bi bi-calendar3 text-primary fs-5"></i>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-semibold">{getTimeRangeText()}</h6>
                      <small className="text-muted">Last updated: {new Date().toLocaleTimeString()}</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-md-end gap-4">
                    <div className="text-center">
                      <div className="text-muted small">Yesterday</div>
                      <div className="fw-bold text-secondary d-flex align-items-center">
                        <i className="bi bi-arrow-down text-danger me-1"></i>
                        {leadsData.summary.yesterdayLeads} leads
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted small">Today</div>
                      <div className="fw-bold text-primary d-flex align-items-center">
                        <i className="bi bi-arrow-up text-success me-1"></i>
                        {leadsData.summary.todayLeads} leads
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted small">Growth</div>
                      <div className="fw-bold text-success">
                        +{Math.round(((leadsData.summary.todayLeads - leadsData.summary.yesterdayLeads) / leadsData.summary.yesterdayLeads) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="row mb-4">
        <div className="col-xl-2 col-lg-4 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100 hover-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Total Leads</div>
                  <div className="h4 mb-2 fw-bold">{leadsData.summary.totalLeads.toLocaleString()}</div>
                  <div className="small text-primary fw-semibold">
                    <i className="bi bi-arrow-up"></i> +12.5%
                  </div>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                  <i className="bi bi-people text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-lg-4 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100 hover-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Hot Leads</div>
                  <div className="h4 mb-2 fw-bold text-danger">{leadsData.summary.hotLeads}</div>
                  <div className="small text-danger fw-semibold">
                    <i className="bi bi-fire"></i> High Priority
                  </div>
                </div>
                <div className="bg-danger bg-opacity-10 rounded-3 p-3">
                  <i className="bi bi-thermometer-sun text-danger fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-lg-4 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100 hover-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Conversions</div>
                  <div className="h4 mb-2 fw-bold text-success">{leadsData.summary.convertedLeads}</div>
                  <div className="small text-success fw-semibold">
                    <i className="bi bi-arrow-up"></i> {leadsData.summary.conversionRate}%
                  </div>
                </div>
                <div className="bg-success bg-opacity-10 rounded-3 p-3">
                  <i className="bi bi-check-circle text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-lg-4 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100 hover-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Follow-ups Due</div>
                  <div className="h4 mb-2 fw-bold text-warning">{leadsData.summary.followupsDue}</div>
                  <div className="small text-danger fw-semibold">
                    <i className="bi bi-exclamation-triangle"></i> {leadsData.summary.overdueTasks} overdue
                  </div>
                </div>
                <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                  <i className="bi bi-calendar-check text-warning fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-lg-4 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100 hover-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Avg Response</div>
                  <div className="h4 mb-2 fw-bold text-info">{leadsData.summary.avgResponseTime}</div>
                  <div className="small text-info fw-semibold">
                    <i className="bi bi-clock"></i> Response Time
                  </div>
                </div>
                <div className="bg-info bg-opacity-10 rounded-3 p-3">
                  <i className="bi bi-speedometer2 text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-lg-4 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100 hover-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Lead Score</div>
                  <div className="h4 mb-2 fw-bold text-purple">{leadsData.qualityMetrics.avgLeadScore}</div>
                  <div className="small text-purple fw-semibold">
                    <i className="bi bi-star"></i> Quality Score
                  </div>
                </div>
                <div className="bg-purple bg-opacity-10 rounded-3 p-3">
                  <i className="bi bi-award text-purple fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Status Filter Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <h6 className="mb-0 me-3 fw-semibold">Lead Categories:</h6>
                {leadsData.statusDistribution.map((status, index) => (
                  <button
                    key={index}
                    className={`btn btn-sm ${leadFilter === status.status ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                    onClick={() => setLeadFilter(status.status)}
                  >
                    <span className="me-1">{status.icon}</span>
                    {status.status}
                    <span className={`ms-1 ${leadFilter === status.status ? 'text-white' : 'text-dark'}`}>
                      ({status.count})
                    </span>
                    {status.milestone && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {status.milestone}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="row">
        {/* Lead Trend Analysis */}
        <div className="col-xl-8 col-lg-7 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0 fw-semibold">📈 Lead Generation & Conversion Trends</h6>
                <div className="btn-group btn-group-sm">
                  <button className="btn btn-outline-primary active">Daily</button>
                  <button className="btn btn-outline-primary">Weekly</button>
                  <button className="btn btn-outline-primary">Monthly</button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadsData.dailyTrend}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#198754" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#198754" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="newLeads" 
                      stroke="#0d6efd" 
                      fillOpacity={1} 
                      fill="url(#colorLeads)"
                      strokeWidth={3}
                      name="New Leads"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="conversions" 
                      stroke="#198754" 
                      fillOpacity={1} 
                      fill="url(#colorConversions)"
                      strokeWidth={3}
                      name="Conversions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="col-xl-4 col-lg-5 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="card-title mb-0 fw-semibold">🎯 Lead Status Distribution</h6>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="count"
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      labelLine={false}
                    >
                      {leadsData.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [value, 'Leads']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Status Legend */}
              <div className="mt-3">
                {leadsData.statusDistribution.map((status, index) => (
                  <div key={index} className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-circle me-2" 
                        style={{ width: '12px', height: '12px', backgroundColor: status.color }}
                      ></div>
                      <span className="small">{status.icon} {status.status}</span>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">{status.count}</div>
                      <small className="text-muted">{status.percentage}%</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Lead Sources Analysis */}
        <div className="col-xl-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="card-title mb-0 fw-semibold">📊 Lead Sources</h6>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsData.leadSources}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}
                    />
                    <Bar dataKey="leads" fill="#0d6efd" name="Leads" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-3">
                {leadsData.leadSources.map((source, index) => (
                  <div key={index} className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-circle me-2" 
                        style={{ width: '10px', height: '10px', backgroundColor: source.color }}
                      ></div>
                      <span className="small">{source.source}</span>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">{source.leads} leads</div>
                      <small className="text-success">{formatCurrency(source)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="col-xl-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="card-title mb-0 fw-semibold">🌊 Lead Conversion Funnel</h6>
            </div>
            <div className="card-body">
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}
                    />
                    <Funnel
                      dataKey="value"
                      data={leadsData.conversionFunnel}
                      isAnimationActive
                    >
                      <LabelList position="center" fill="#fff" stroke="none" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Team Performance */}
        <div className="col-xl-8 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="card-title mb-0 fw-semibold">👥 Team Performance Leaderboard</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th className="border-0 text-muted small fw-semibold">TEAM MEMBER</th>
                      <th className="border-0 text-muted small fw-semibold">LEADS</th>
                      <th className="border-0 text-muted small fw-semibold">CONVERSIONS</th>
                      <th className="border-0 text-muted small fw-semibold">CONVERSION RATE</th>
                      <th className="border-0 text-muted small fw-semibold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsData.teamPerformance.map((member, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                              <i className="bi bi-person text-primary"></i>
                            </div>
                            <div>
                              <div className="fw-semibold">{member.name}</div>
                              <small className="text-muted">Sales Executive</small>
                            </div>
                          </div>
                        </td>
                        <td><span className="fw-semibold">{member.leads}</span></td>
                        <td><span className="fw-semibold text-success">{member.conversions}</span></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                              <div 
                                className={`progress-bar ${member.conversionRate >= 17 ? 'bg-success' : member.conversionRate >= 15 ? 'bg-warning' : 'bg-danger'}`}
                                style={{ width: `${member.conversionRate * 5}%` }}
                              ></div>
                            </div>
                            <span className="small fw-semibold">{member.conversionRate}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${member.status === 'online' ? 'bg-success' : member.status === 'away' ? 'bg-warning' : 'bg-secondary'}`}>
                            {member.status}
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

        {/* Recent Activities & Quality Metrics */}
        <div className="col-xl-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="card-title mb-0 fw-semibold">🔔 Recent Activities</h6>
            </div>
            <div className="card-body">
              <div className="timeline">
                {leadsData.recentActivities.map((activity, index) => (
                  <div key={activity.id} className="timeline-item d-flex mb-3">
                    <div className="timeline-marker me-3">
                      <div className="timeline-icon bg-light rounded-circle p-2">
                        <i className={`${getStatusIcon(activity.type)} small`}></i>
                      </div>
                    </div>
                    <div className="timeline-content flex-grow-1">
                      <div className="timeline-body">
                        <p className="mb-1 small">{activity.message}</p>
                        <div className="d-flex justify-content-between">
                          <small className="text-muted">{activity.user}</small>
                          <small className="text-muted">{activity.time}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Quality Metrics */}
              <div className="mt-4 pt-3 border-top">
                <h6 className="fw-semibold mb-3">📊 Quality Metrics</h6>
                <div className="row g-2">
                  <div className="col-6">
                    <div className="text-center p-2 bg-light rounded">
                      <div className="fw-bold text-primary">{leadsData.qualityMetrics.emailOpenRate}%</div>
                      <small className="text-muted">Email Open Rate</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-2 bg-light rounded">
                      <div className="fw-bold text-success">{leadsData.qualityMetrics.phoneConnectRate}%</div>
                      <small className="text-muted">Phone Connect</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-2 bg-light rounded">
                      <div className="fw-bold text-warning">{leadsData.qualityMetrics.meetingBookedRate}%</div>
                      <small className="text-muted">Meeting Booked</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-2 bg-light rounded">
                      <div className="fw-bold text-info">{leadsData.qualityMetrics.proposalAcceptRate}%</div>
                      <small className="text-muted">Proposal Accept</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Performance Comparison */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="card-title mb-0 fw-semibold">📅 Monthly Performance Comparison</h6>
            </div>
            <div className="card-body">
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsData.monthlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="leads" fill="#0d6efd" name="Total Leads" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conversions" fill="#198754" name="Conversions" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
        .timeline-item {
          position: relative;
        }
        .timeline-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .text-purple {
          color: #6f42c1 !important;
        }
        .bg-purple {
          background-color: #6f42c1 !important;
        }
        .bg-purple.bg-opacity-10 {
          background-color: rgba(111, 66, 193, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default Lead;