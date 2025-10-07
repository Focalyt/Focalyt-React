import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, TrendingUp, Users, Building, Clock, Target, CheckCircle, XCircle, DollarSign, AlertCircle, UserCheck, FileCheck, AlertTriangle, ChevronLeft, ChevronRight, CalendarDays, Phone, Mail, MapPin, User, Briefcase, Eye, Edit, History, Plus } from 'lucide-react';


const B2BDashboard = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalLeads: 0,
      activeLeads: 0,
      convertedLeads: 0,
      pendingFollowups: 0,
      totalRevenue: 0
    },
    statusDistribution: [],
    monthlyTrends: [],
    leadCategories: [],
    b2bTypes: [],
    topPerformers: [],
    recentLeads: [],
    upcomingFollowups: []
  });

  const [selectedPeriod, setSelectedPeriod] = useState('last30');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.get(`${backendUrl}/college/b2b/dashboard`, {
        headers: { 'x-auth': token },
        params: {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
          period: selectedPeriod
        }
      });

      if (response.data.status) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod, dateRange]);

  // Chart colors
  const chartColors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    indigo: '#6366f1'
  };

  // Status distribution chart data
  const statusChartData = useMemo(() => {
    return dashboardData.statusDistribution.map(status => ({
      name: status.statusName,
      value: status.count,
      color: status.color || chartColors.primary
    }));
  }, [dashboardData.statusDistribution]);

  // Monthly trends chart data
  const trendsChartData = useMemo(() => {
    return dashboardData.monthlyTrends.map(trend => ({
      month: trend.month,
      leads: trend.leads,
      conversions: trend.conversions,
      revenue: trend.revenue
    }));
  }, [dashboardData.monthlyTrends]);

  // Lead categories chart data
  const categoriesChartData = useMemo(() => {
    return dashboardData.leadCategories.map(category => ({
      name: category.categoryName,
      value: category.count,
      color: category.color || chartColors.success
    }));
  }, [dashboardData.leadCategories]);

  // B2B types chart data
  const b2bTypesChartData = useMemo(() => {
    return dashboardData.b2bTypes.map(type => ({
      name: type.typeName,
      value: type.count,
      color: type.color || chartColors.purple
    }));
  }, [dashboardData.b2bTypes]);

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading B2B Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-4">
        {/* Mobile Layout */}
        <div className="d-block d-lg-none">
          <div className="mb-3">
            <h1 className="h3 fw-bold text-dark mb-2">B2B Dashboard</h1>
            <p className="text-muted small">Comprehensive analytics for your B2B lead management</p>
          </div>
          <div className="row g-2">
            <div className="col-7">
              <select 
                className="form-select form-select-sm"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
              </select>
            </div>
            <div className="col-5">
              <button className="btn btn-primary btn-sm w-100">
                <Plus size={16} />
                <span className="ms-1">Add Lead</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="d-none d-lg-flex justify-content-between align-items-center">
          <div>
            <h1 className="display-5 fw-bold text-dark mb-2">B2B Dashboard</h1>
            <p className="text-muted">Comprehensive analytics for your B2B lead management</p>
          </div>
          <div className="d-flex gap-2">
            <select 
              className="form-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
            </select>
            <button className="btn btn-primary">
              <Plus className="me-2" size={20} />
              Add Lead
            </button>
          </div>
        </div>
      </div>


      {/* Key Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-2">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Total Leads</p>
                  <p className="h3 fw-bold mb-0">{dashboardData.overview.totalLeads}</p>
                  <p className="small text-muted mb-0">All time</p>
                </div>
                <Users className="text-primary opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Active Leads</p>
                  <p className="h3 fw-bold text-success mb-0">{dashboardData.overview.activeLeads}</p>
                  <p className="small text-muted mb-0">In pipeline</p>
                </div>
                <CheckCircle className="text-success opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Converted</p>
                  <p className="h3 fw-bold text-warning mb-0">{dashboardData.overview.convertedLeads}</p>
                  <p className="small text-muted mb-0">Success rate</p>
                </div>
                <Target className="text-warning opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Pending Followups</p>
                  <p className="h3 fw-bold text-danger mb-0">{dashboardData.overview.pendingFollowups}</p>
                  <p className="small text-muted mb-0">Need attention</p>
                </div>
                <Clock className="text-danger opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Total Revenue</p>
                  <p className="h3 fw-bold text-success mb-0">₹{dashboardData.overview.totalRevenue.toLocaleString()}</p>
                  <p className="small text-muted mb-0">From converted leads</p>
                </div>
                <DollarSign className="text-success opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        {/* Status Distribution */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h3 className="h5 fw-semibold mb-4 d-flex align-items-center gap-2">
                <AlertCircle className="text-primary" size={20} />
                Lead Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h3 className="h5 fw-semibold mb-4 d-flex align-items-center gap-2">
                <TrendingUp className="text-success" size={20} />
                Monthly Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="New Leads"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Conversions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Categories and B2B Types */}
      <div className="row g-4 mb-4">
        {/* Lead Categories */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h3 className="h5 fw-semibold mb-4 d-flex align-items-center gap-2">
                <Building className="text-purple" size={20} />
                Lead Categories
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoriesChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* B2B Types */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h3 className="h5 fw-semibold mb-4 d-flex align-items-center gap-2">
                <Briefcase className="text-indigo" size={20} />
                B2B Types
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={b2bTypesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="h5 fw-semibold mb-4 d-flex align-items-center gap-2">
                <UserCheck className="text-success" size={20} />
                Top Performers
              </h3>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Counselor</th>
                      <th>Leads</th>
                      <th>Conversions</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.topPerformers.map((performer, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm bg-primary text-white rounded-circle me-2">
                              {performer.name.charAt(0)}
                            </div>
                            {performer.name}
                          </div>
                        </td>
                        <td>{performer.leads}</td>
                        <td>{performer.conversions}</td>
                        <td>
                          <span className={`badge ${performer.rate >= 50 ? 'bg-success' : performer.rate >= 30 ? 'bg-warning' : 'bg-danger'}`}>
                            {performer.rate}%
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

      {/* Recent Leads and Upcoming Followups */}
      <div className="row g-4">
        {/* Recent Leads */}
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="h5 fw-semibold mb-4 d-flex align-items-center gap-2">
                <Eye className="text-primary" size={20} />
                Recent Leads
              </h3>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentLeads.map((lead, index) => (
                      <tr key={index}>
                        <td>
                          <div>
                            <div className="fw-semibold">{lead.businessName}</div>
                            <small className="text-muted">{lead.leadCategory}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-medium">{lead.concernPersonName}</div>
                            <small className="text-muted">{lead.designation}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${lead.status === 'Converted' ? 'bg-success' : 
                                           lead.status === 'Active' ? 'bg-primary' : 
                                           lead.status === 'Pending' ? 'bg-warning' : 'bg-secondary'}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" title="View">
                              <Eye size={16} />
                            </button>
                            <button className="btn btn-outline-secondary" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button className="btn btn-outline-info" title="History">
                              <History size={16} />
                            </button>
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

        {/* Upcoming Followups */}
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="h5 fw-semibold mb-4 d-flex align-items-center gap-2">
                <Clock className="text-warning" size={20} />
                Upcoming Followups
              </h3>
              <div className="space-y-3">
                {dashboardData.upcomingFollowups.map((followup, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-semibold">{followup.businessName}</div>
                        <small className="text-muted">{followup.concernPersonName}</small>
                      </div>
                      <small className="text-muted">
                        {new Date(followup.scheduledDate).toLocaleDateString()}
                      </small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Phone size={16} className="text-muted" />
                      <small className="text-muted">{followup.mobile}</small>
                    </div>
                    <div className="mt-2">
                      <span className={`badge ${followup.priority === 'High' ? 'bg-danger' : 
                                         followup.priority === 'Medium' ? 'bg-warning' : 'bg-success'}`}>
                        {followup.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        .avatar {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }
        
        .space-y-3 > * + * {
          margin-top: 0.75rem;
        }
        
        .btn-group-sm .btn {
          padding: 0.25rem 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default B2BDashboard;