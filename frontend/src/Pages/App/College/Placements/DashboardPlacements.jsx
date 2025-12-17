import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, TrendingUp, Users, Building, Clock, Target, CheckCircle, XCircle, DollarSign, AlertCircle, UserCheck, FileCheck, AlertTriangle, ChevronLeft, ChevronRight, CalendarDays, Phone, Mail, MapPin, User, Briefcase, Eye, Edit, History, Plus } from 'lucide-react';


const DashboardPlacements = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalPlacements: 0,
      placed: 0,
      unplaced: 0,
      pendingFollowups: 0,
      activeCandidates: 0
    },
    statusDistribution: [],
    monthlyTrends: [],
    topPerformers: [],
    recentPlacements: [],
    upcomingFollowups: []
  });

  const [selectedPeriod, setSelectedPeriod] = useState('last30');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  // Fetch dashboard data - Using Placements endpoints
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch status counts and placements data
      const [statusCountsResponse, placementsResponse] = await Promise.all([
        axios.get(`${backendUrl}/college/placementStatus/status-count`, {
          headers: { 'x-auth': token }
        }),
        axios.get(`${backendUrl}/college/placementStatus/candidates`, {
          headers: { 'x-auth': token },
          params: {
            page: 1,
            limit: 1000 
          }
        })
      ]);

      if (statusCountsResponse.data.status && placementsResponse.data.status) {
        const statusCounts = statusCountsResponse.data.data?.statusCounts || [];
        const placements = placementsResponse.data.data?.placements || [];
        const totalPlacements = statusCountsResponse.data.data?.totalLeads || placements.length;

        // Find placed and unplaced counts
        const placedStatus = statusCounts.find(s => 
          s.statusName?.toLowerCase() === 'placed'
        );
        const unplacedStatus = statusCounts.find(s => 
          s.statusName?.toLowerCase() === 'unplaced'
        );

        // Calculate monthly trends
        const monthlyTrendsMap = new Map();
        placements.forEach(placement => {
          if (placement.createdAt) {
            const month = new Date(placement.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short' 
            });
            const existing = monthlyTrendsMap.get(month) || { month, placements: 0, placed: 0 };
            existing.placements++;
            if (placement.status?.title?.toLowerCase() === 'placed') {
              existing.placed++;
            }
            monthlyTrendsMap.set(month, existing);
          }
        });
        const monthlyTrends = Array.from(monthlyTrendsMap.values())
          .sort((a, b) => new Date(a.month) - new Date(b.month));

        // Recent placements (last 10)
        const recentPlacements = placements
          .slice(0, 10)
          .map(p => ({
            id: p._id,
            candidateName: p._candidate?.name || p._student?.name || 'N/A',
            email: p._candidate?.email || p._student?.email || 'N/A',
            mobile: p._candidate?.mobile || p._student?.mobile || 'N/A',
            status: p.status?.title || 'No Status',
            createdAt: p.createdAt,
            companyName: p.companyName || 'N/A'
          }));

        // Upcoming followups
        const upcomingFollowups = placements
          .filter(p => p.followup?.followupDate && new Date(p.followup.followupDate) > new Date())
          .sort((a, b) => new Date(a.followup.followupDate) - new Date(b.followup.followupDate))
          .slice(0, 10)
          .map(p => ({
            id: p._id,
            candidateName: p._candidate?.name || p._student?.name || 'N/A',
            mobile: p._candidate?.mobile || p._student?.mobile || 'N/A',
            scheduledDate: p.followup.followupDate,
            priority: 'Medium',
            companyName: p.companyName || 'N/A'
          }));

        // Transform status distribution
        const statusDistribution = statusCounts.map(s => ({
          statusName: s.statusName,
          count: s.count,
          color: s.statusName?.toLowerCase() === 'placed' ? chartColors.success :
                 s.statusName?.toLowerCase() === 'unplaced' ? chartColors.danger :
                 chartColors.primary
        }));

        setDashboardData({
          overview: {
            totalPlacements: totalPlacements,
            placed: placedStatus?.count || 0,
            unplaced: unplacedStatus?.count || 0,
            pendingFollowups: upcomingFollowups.length,
            activeCandidates: totalPlacements - (placedStatus?.count || 0)
          },
          statusDistribution,
          monthlyTrends,
          recentPlacements,
          upcomingFollowups,
          topPerformers: [] // Can be calculated later if needed
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set error state for UI
      setDashboardData({
        overview: {
          totalPlacements: 0,
          placed: 0,
          unplaced: 0,
          pendingFollowups: 0,
          activeCandidates: 0
        },
        statusDistribution: [],
        monthlyTrends: [],
        recentPlacements: [],
        upcomingFollowups: [],
        topPerformers: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, dateRange.start, dateRange.end]);

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
      placements: trend.placements || 0,
      placed: trend.placed || 0
    }));
  }, [dashboardData.monthlyTrends]);

  // Chart colors for status distribution
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading Placements Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-4">
       
        {/* Desktop Layout */}
        <div className="d-none d-lg-flex justify-content-between align-items-center">
          <div>
            <h1 className="display-5 fw-bold text-dark mb-2">Placements Dashboard</h1>
            <p className="text-muted">Comprehensive analytics for your Placements management</p>
          </div>
          <div className="d-flex gap-2">
            
            
          </div>
        </div>
      </div>


      {/* Key Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-2 col-sm-6">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1 fw-medium">Total Placements</p>
                  <p className="h3 fw-bold mb-0 text-primary">{dashboardData.overview.totalPlacements.toLocaleString()}</p>
                  <p className="small text-muted mb-0">All time</p>
                </div>
                <Users className="text-primary opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-2 col-sm-6">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1 fw-medium">Placed</p>
                  <p className="h3 fw-bold text-success mb-0">{dashboardData.overview.placed.toLocaleString()}</p>
                  <p className="small text-muted mb-0">Successfully placed</p>
                </div>
                <CheckCircle className="text-success opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-2 col-sm-6">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1 fw-medium">Unplaced</p>
                  <p className="h3 fw-bold text-warning mb-0">{dashboardData.overview.unplaced.toLocaleString()}</p>
                  <p className="small text-muted mb-0">Pending placement</p>
                </div>
                <Target className="text-warning opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-2 col-sm-6">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1 fw-medium">Pending Followups</p>
                  <p className="h3 fw-bold text-danger mb-0">{dashboardData.overview.pendingFollowups.toLocaleString()}</p>
                  <p className="small text-muted mb-0">Need attention</p>
                </div>
                <Clock className="text-danger opacity-50" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 col-sm-6">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1 fw-medium">Active Candidates</p>
                  <p className="h3 fw-bold text-info mb-0">{dashboardData.overview.activeCandidates.toLocaleString()}</p>
                  <p className="small text-muted mb-0">In pipeline</p>
                </div>
                <UserCheck className="text-info opacity-50" size={32} />
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
                Placement Status Distribution
              </h3>
              {statusChartData.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No status data available</p>
                </div>
              ) : (
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
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
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
              {trendsChartData.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No trend data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="placements"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="New Placements"
                    />
                    <Area
                      type="monotone"
                      dataKey="placed"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Placed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
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
                    {dashboardData.topPerformers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          No performer data available
                        </td>
                      </tr>
                    ) : (
                      dashboardData.topPerformers.map((performer, index) => (
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
                      ))
                    )}
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
                Recent Placements
              </h3>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Contact</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentPlacements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          No recent placements found
                        </td>
                      </tr>
                    ) : (
                      dashboardData.recentPlacements.map((placement, index) => (
                        <tr key={placement.id || index}>
                          <td>
                            <div>
                              <div className="fw-semibold">{placement.candidateName}</div>
                              <small className="text-muted">{placement.email}</small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">{placement.mobile}</div>
                            </div>
                          </td>
                          <td>
                            <div className="fw-medium">{placement.companyName}</div>
                          </td>
                          <td>
                            <span className={`badge ${
                              placement.status === 'Placed' ? 'bg-success' : 
                              placement.status === 'Unplaced' ? 'bg-danger' : 
                              'bg-secondary'
                            }`}>
                              {placement.status}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {placement.createdAt ? new Date(placement.createdAt).toLocaleDateString() : 'N/A'}
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
                      ))
                    )}
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
                {dashboardData.upcomingFollowups.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted">No upcoming followups</p>
                  </div>
                ) : (
                  dashboardData.upcomingFollowups.map((followup, index) => (
                    <div key={followup.id || index} className="border rounded p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="fw-semibold">{followup.candidateName}</div>
                          <small className="text-muted">{followup.companyName}</small>
                        </div>
                        <small className="text-muted">
                          {followup.scheduledDate ? new Date(followup.scheduledDate).toLocaleDateString() : 'N/A'}
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
                  ))
                )}
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

export default DashboardPlacements;