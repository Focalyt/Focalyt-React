import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, TrendingUp, Users, Building, Clock, Target, CheckCircle, XCircle, DollarSign, AlertCircle, UserCheck, FileCheck, AlertTriangle } from 'lucide-react';

const LeadAnalyticsDashboard = () => {
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get today's date for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sample data based on actual AppliedCourses schema
  const appliedCoursesData = [
    {
      _id: '1',
      _candidate: 'cand1',
      _course: 'course1',
      _center: { _id: 'center1', name: 'Delhi Center' },
      _leadStatus: { name: 'Interested' },
      _leadSubStatus: { name: 'Follow-up Required' },
      _initialStatus: 'Hot',
      courseStatus: 1, // Assigned
      kycStage: true,
      kyc: true,
      admissionDone: true,
      admissionDate: new Date('2025-01-23'),
      dropout: false,
      registrationFee: 'Paid',
      leadAssignment: [
        {
          _id: 'user1',
          counsellorName: 'Rajesh Kumar',
          assignDate: new Date('2025-01-15'),
          assignedBy: 'admin1'
        }
      ],
      followups: [
        { date: new Date('2025-01-16'), status: 'Done' },
        { date: new Date('2025-01-18'), status: 'Done' }
      ],
      createdAt: new Date('2025-01-10')
    },
    {
      _id: '2',
      _candidate: 'cand2',
      _course: 'course1',
      _center: { _id: 'center1', name: 'Delhi Center' },
      _leadStatus: { name: 'Thinking' },
      _initialStatus: 'Warm',
      courseStatus: 1,
      kycStage: true,
      kyc: false,
      admissionDone: false,
      dropout: false,
      registrationFee: 'Unpaid',
      leadAssignment: [
        {
          _id: 'user1',
          counsellorName: 'Rajesh Kumar',
          assignDate: new Date('2025-01-12')
        }
      ],
      followups: [
        { date: new Date('2025-01-20'), status: 'Planned' }
      ],
      createdAt: new Date('2025-01-11')
    },
    {
      _id: '3',
      _candidate: 'cand3',
      _course: 'course2',
      _center: { _id: 'center2', name: 'Mumbai Center' },
      _leadStatus: { name: 'Not Interested' },
      _initialStatus: 'Cold',
      courseStatus: 1,
      kycStage: false,
      kyc: false,
      admissionDone: false,
      dropout: true,
      registrationFee: 'Unpaid',
      leadAssignment: [
        {
          _id: 'user2',
          counsellorName: 'Priya Singh',
          assignDate: new Date('2025-01-14')
        }
      ],
      createdAt: new Date('2025-01-13')
    },
    {
      _id: '4',
      _candidate: 'cand4',
      _course: 'course1',
      _center: { _id: 'center2', name: 'Mumbai Center' },
      _leadStatus: { name: 'Ready to Join' },
      _initialStatus: 'Hot',
      courseStatus: 1,
      kycStage: true,
      kyc: true,
      admissionDone: true,
      admissionDate: new Date('2025-01-22'),
      dropout: false,
      registrationFee: 'Paid',
      leadAssignment: [
        {
          _id: 'user2',
          counsellorName: 'Priya Singh',
          assignDate: new Date('2025-01-10')
        }
      ],
      createdAt: new Date('2025-01-09')
    },
    {
      _id: '5',
      _candidate: 'cand5',
      _course: 'course1',
      _center: { _id: 'center1', name: 'Delhi Center' },
      _leadStatus: { name: 'Interested' },
      _initialStatus: 'Hot',
      courseStatus: 1,
      kycStage: true,
      kyc: true,
      admissionDone: true,
      admissionDate: new Date('2025-01-23'),
      dropout: false,
      registrationFee: 'Paid',
      leadAssignment: [
        {
          _id: 'user3',
          counsellorName: 'Amit Sharma',
          assignDate: new Date('2025-01-17')
        }
      ],
      createdAt: new Date('2025-01-16')
    },
    {
      _id: '6',
      _candidate: 'cand6',
      _course: 'course2',
      _center: { _id: 'center1', name: 'Delhi Center' },
      _leadStatus: { name: 'Thinking' },
      _initialStatus: 'Warm',
      courseStatus: 0, // Due - not assigned yet
      kycStage: false,
      kyc: false,
      admissionDone: false,
      dropout: false,
      registrationFee: 'Unpaid',
      leadAssignment: [],
      createdAt: new Date('2025-01-18')
    },
    {
      _id: '7',
      _candidate: 'cand7',
      _course: 'course1',
      _center: { _id: 'center2', name: 'Mumbai Center' },
      _leadStatus: { name: 'Ready to Join' },
      _initialStatus: 'Hot',
      courseStatus: 1,
      kycStage: true,
      kyc: true,
      admissionDone: true,
      admissionDate: new Date('2025-01-21'),
      dropout: false,
      registrationFee: 'Paid',
      leadAssignment: [
        {
          _id: 'user4',
          counsellorName: 'Neha Patel',
          assignDate: new Date('2025-01-11')
        }
      ],
      createdAt: new Date('2025-01-10')
    },
    {
      _id: '8',
      _candidate: 'cand8',
      _course: 'course2',
      _center: { _id: 'center2', name: 'Mumbai Center' },
      _leadStatus: { name: 'Interested' },
      _initialStatus: 'Warm',
      courseStatus: 1,
      kycStage: true,
      kyc: false,
      admissionDone: false,
      dropout: false,
      registrationFee: 'Unpaid',
      leadAssignment: [
        {
          _id: 'user4',
          counsellorName: 'Neha Patel',
          assignDate: new Date('2025-01-15')
        }
      ],
      followups: [
        { date: new Date('2025-01-22'), status: 'Planned' }
      ],
      createdAt: new Date('2025-01-14')
    },
    {
      _id: '9',
      _candidate: 'cand9',
      _course: 'course1',
      _center: { _id: 'center1', name: 'Delhi Center' },
      _leadStatus: { name: 'Admitted' },
      _initialStatus: 'Hot',
      courseStatus: 1,
      kycStage: true,
      kyc: true,
      admissionDone: true,
      admissionDate: new Date('2025-01-20'),
      dropout: false,
      registrationFee: 'Paid',
      leadAssignment: [
        {
          _id: 'user1',
          counsellorName: 'Rajesh Kumar',
          assignDate: new Date('2025-01-18')
        }
      ],
      createdAt: new Date('2025-01-17')
    },
    {
      _id: '10',
      _candidate: 'cand10',
      _course: 'course1',
      _center: { _id: 'center2', name: 'Mumbai Center' },
      _leadStatus: { name: 'Admitted' },
      _initialStatus: 'Hot',
      courseStatus: 1,
      kycStage: true,
      kyc: true,
      admissionDone: true,
      admissionDate: new Date('2025-01-23'),
      dropout: false,
      registrationFee: 'Paid',
      leadAssignment: [
        {
          _id: 'user2',
          counsellorName: 'Priya Singh',
          assignDate: new Date('2025-01-20')
        }
      ],
      createdAt: new Date('2025-01-19')
    }
  ];

  // Extract unique centers
  const centers = [...new Set(appliedCoursesData.map(lead => lead._center.name))];
  
  // Filter data based on selected period
  const filterDataByPeriod = (data) => {
    if (selectedPeriod === 'all') return data;
    
    const now = new Date();
    const startDate = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }
    
    return data.filter(lead => new Date(lead.createdAt) >= startDate);
  };
  
  // Get daily admissions data
  const getDailyAdmissions = () => {
    const admissionsByDate = {};
    
    appliedCoursesData
      .filter(lead => lead.admissionDone && lead.admissionDate)
      .forEach(lead => {
        const dateStr = new Date(lead.admissionDate).toLocaleDateString('en-IN');
        if (!admissionsByDate[dateStr]) {
          admissionsByDate[dateStr] = {
            date: dateStr,
            admissions: 0,
            revenue: 0,
            centers: {},
            counselors: {}
          };
        }
        
        admissionsByDate[dateStr].admissions++;
        if (lead.registrationFee === 'Paid') {
          admissionsByDate[dateStr].revenue += 15000;
        }
        
        // Track by center
        const centerName = lead._center.name;
        if (!admissionsByDate[dateStr].centers[centerName]) {
          admissionsByDate[dateStr].centers[centerName] = 0;
        }
        admissionsByDate[dateStr].centers[centerName]++;
        
        // Track by counselor
        if (lead.leadAssignment && lead.leadAssignment.length > 0) {
          const counselorName = lead.leadAssignment[lead.leadAssignment.length - 1].counsellorName;
          if (!admissionsByDate[dateStr].counselors[counselorName]) {
            admissionsByDate[dateStr].counselors[counselorName] = 0;
          }
          admissionsByDate[dateStr].counselors[counselorName]++;
        }
      });
    
    // Convert to array and sort by date
    const sortedAdmissions = Object.values(admissionsByDate).sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateB - dateA;
    });
    
    return sortedAdmissions;
  };
  
  // Apply period filter to main data
  const filteredData = filterDataByPeriod(appliedCoursesData);

  // Get counselor-status matrix from actual data
  const getCounselorMatrix = () => {
    const matrix = {};
    
    // Filter leads based on selected center
    const centerFilteredLeads = selectedCenter === 'all' 
      ? filteredData 
      : filteredData.filter(lead => lead._center.name === selectedCenter);

    // Process each lead
    centerFilteredLeads.forEach(lead => {
      if (lead.leadAssignment && lead.leadAssignment.length > 0) {
        // Get the latest counselor assignment
        const latestAssignment = lead.leadAssignment[lead.leadAssignment.length - 1];
        const counselorName = latestAssignment.counsellorName;
        
        if (!matrix[counselorName]) {
          matrix[counselorName] = {
            Hot: 0,
            Warm: 0,
            Cold: 0,
            Total: 0,
            Assigned: 0,
            Due: 0,
            KYCStage: 0,
            KYCDone: 0,
            Admissions: 0,
            Dropouts: 0,
            Paid: 0,
            Unpaid: 0,
            ConversionRate: 0,
            DropoutRate: 0
          };
        }
        
        // Count by initial status
        matrix[counselorName][lead._initialStatus]++;
        matrix[counselorName].Total++;
        
        // Count by course status
        if (lead.courseStatus === 1) matrix[counselorName].Assigned++;
        else matrix[counselorName].Due++;
        
        // KYC metrics
        if (lead.kycStage) matrix[counselorName].KYCStage++;
        if (lead.kyc) matrix[counselorName].KYCDone++;
        
        // Admission and dropout metrics
        if (lead.admissionDone) matrix[counselorName].Admissions++;
        if (lead.dropout) matrix[counselorName].Dropouts++;
        
        // Payment metrics
        if (lead.registrationFee === 'Paid') matrix[counselorName].Paid++;
        else matrix[counselorName].Unpaid++;
      }
    });

    // Calculate rates
    Object.keys(matrix).forEach(counselor => {
      const data = matrix[counselor];
      data.ConversionRate = data.Total > 0 ? ((data.Admissions / data.Total) * 100).toFixed(1) : 0;
      data.DropoutRate = data.Total > 0 ? ((data.Dropouts / data.Total) * 100).toFixed(1) : 0;
    });

    return matrix;
  };

  // Get center-wise analytics
  const getCenterAnalytics = () => {
    const centerData = {};
    
    filteredData.forEach(lead => {
      const centerName = lead._center.name;
      
      if (!centerData[centerName]) {
        centerData[centerName] = {
          totalLeads: 0,
          hot: 0,
          warm: 0,
          cold: 0,
          assigned: 0,
          due: 0,
          kyc: 0,
          admissions: 0,
          dropouts: 0,
          revenue: 0,
          counselors: {}
        };
      }
      
      centerData[centerName].totalLeads++;
      centerData[centerName][lead._initialStatus.toLowerCase()]++;
      
      if (lead.courseStatus === 1) centerData[centerName].assigned++;
      else centerData[centerName].due++;
      
      if (lead.kyc) centerData[centerName].kyc++;
      if (lead.admissionDone) centerData[centerName].admissions++;
      if (lead.dropout) centerData[centerName].dropouts++;
      if (lead.registrationFee === 'Paid') centerData[centerName].revenue += 15000; // Assuming 15000 per registration
      
      // Track counselor performance per center
      if (lead.leadAssignment && lead.leadAssignment.length > 0) {
        const counselor = lead.leadAssignment[lead.leadAssignment.length - 1].counsellorName;
        
        if (!centerData[centerName].counselors[counselor]) {
          centerData[centerName].counselors[counselor] = { 
            leads: 0, 
            admissions: 0, 
            dropouts: 0,
            kyc: 0 
          };
        }
        
        centerData[centerName].counselors[counselor].leads++;
        if (lead.admissionDone) centerData[centerName].counselors[counselor].admissions++;
        if (lead.dropout) centerData[centerName].counselors[counselor].dropouts++;
        if (lead.kyc) centerData[centerName].counselors[counselor].kyc++;
      }
    });

    return centerData;
  };

  // Get followup analytics
  const getFollowupAnalytics = () => {
    let totalFollowups = 0;
    let doneFollowups = 0;
    let missedFollowups = 0;
    let plannedFollowups = 0;
    
    filteredData.forEach(lead => {
      if (lead.followups && lead.followups.length > 0) {
        lead.followups.forEach(followup => {
          totalFollowups++;
          if (followup.status === 'Done') doneFollowups++;
          else if (followup.status === 'Missed') missedFollowups++;
          else if (followup.status === 'Planned') plannedFollowups++;
        });
      }
    });
    
    return { totalFollowups, doneFollowups, missedFollowups, plannedFollowups };
  };

  const counselorMatrix = getCounselorMatrix();
  const centerAnalytics = getCenterAnalytics();
  const followupStats = getFollowupAnalytics();
  const dailyAdmissions = getDailyAdmissions();

  // Prepare chart data
  const conversionChartData = Object.entries(counselorMatrix).map(([name, data]) => ({
    name,
    conversionRate: parseFloat(data.ConversionRate),
    dropoutRate: parseFloat(data.DropoutRate)
  }));

  const statusDistribution = [
    { name: 'Hot', value: Object.values(counselorMatrix).reduce((sum, c) => sum + c.Hot, 0) },
    { name: 'Warm', value: Object.values(counselorMatrix).reduce((sum, c) => sum + c.Warm, 0) },
    { name: 'Cold', value: Object.values(counselorMatrix).reduce((sum, c) => sum + c.Cold, 0) }
  ];
  
  // Prepare daily admissions chart data (last 7 days)
  const admissionTrendData = dailyAdmissions.slice(0, 7).reverse().map(day => ({
    date: day.date,
    admissions: day.admissions,
    revenue: day.revenue / 1000 // in thousands
  }));

  const colors = {
    Hot: '#dc2626',
    Warm: '#f59e0b',
    Cold: '#3b82f6'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Management Analytics Dashboard</h1>
        <p className="text-gray-600">Real-time analytics based on Applied Courses data</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Center:</label>
            <select 
              value={selectedCenter} 
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Centers</option>
              {centers.map(center => (
                <option key={center} value={center}>{center}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Period:</label>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredData.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredData.filter(l => l.courseStatus === 0).length} Due
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">KYC Done</p>
              <p className="text-2xl font-bold text-purple-600">
                {filteredData.filter(l => l.kyc).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredData.filter(l => l.kycStage && !l.kyc).length} In Progress
              </p>
            </div>
            <FileCheck className="w-8 h-8 text-purple-500 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admissions</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredData.filter(l => l.admissionDone).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredData.length > 0 ? ((filteredData.filter(l => l.admissionDone).length / filteredData.length) * 100).toFixed(0) : 0}% Rate
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{(filteredData.filter(l => l.registrationFee === 'Paid').length * 15000).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredData.filter(l => l.registrationFee === 'Paid').length} Paid
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dropouts</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredData.filter(l => l.dropout).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredData.length > 0 ? ((filteredData.filter(l => l.dropout).length / filteredData.length) * 100).toFixed(0) : 0}% Rate
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Main Analytics Matrix */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Counselor Performance Matrix
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counselor</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hot</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Warm</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cold</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">KYC</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Admissions</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Dropouts</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Conv. Rate</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Centers</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(counselorMatrix).map(([counselor, data]) => (
                  <tr key={counselor} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{counselor}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-800 font-semibold">
                        {data.Hot}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
                        {data.Warm}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold">
                        {data.Cold}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-semibold">{data.Total}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span className="text-purple-600 font-medium">{data.KYCDone}</span>
                      <span className="text-gray-400 text-xs">/{data.KYCStage}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span className="text-green-600 font-medium">{data.Admissions}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`font-medium ${data.Dropouts > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {data.Dropouts}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span className="text-green-600 font-medium">₹{(data.Paid * 15000).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        data.ConversionRate > 50 ? 'bg-green-100 text-green-800' : 
                        data.ConversionRate > 30 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {data.ConversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Conversion vs Dropout Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Conversion vs Dropout Rates
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={conversionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="conversionRate" fill="#10b981" name="Conversion Rate" />
              <Bar dataKey="dropoutRate" fill="#ef4444" name="Dropout Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Lead Temperature Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Center-wise Analytics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-purple-600" />
          Center-wise Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(centerAnalytics).map(([center, data]) => (
            <div key={center} className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">{center}</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{data.totalLeads}</p>
                  <p className="text-xs text-gray-500">{data.assigned} assigned</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Admissions</p>
                  <p className="text-2xl font-bold text-green-600">{data.admissions}</p>
                  <p className="text-xs text-gray-500">{data.kyc} KYC done</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-xl font-bold text-green-600">₹{data.revenue.toLocaleString()}</p>
                  <p className="text-xs text-red-500">{data.dropouts} dropouts</p>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Lead Distribution:</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-red-100 rounded p-1 text-center">
                    <span className="text-xs font-medium text-red-800">Hot: {data.hot}</span>
                  </div>
                  <div className="flex-1 bg-yellow-100 rounded p-1 text-center">
                    <span className="text-xs font-medium text-yellow-800">Warm: {data.warm}</span>
                  </div>
                  <div className="flex-1 bg-blue-100 rounded p-1 text-center">
                    <span className="text-xs font-medium text-blue-800">Cold: {data.cold}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Counselor Contribution:</p>
                {Object.entries(data.counselors).map(([counselor, stats]) => (
                  <div key={counselor} className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-600">{counselor}</span>
                    <div className="text-right">
                      <span className="font-medium">{stats.leads} leads</span>
                      <span className="text-green-600 ml-2">{stats.admissions} adm</span>
                      {stats.dropouts > 0 && <span className="text-red-600 ml-2">{stats.dropouts} drop</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Admissions Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Admissions Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Daily Admissions Table
          </h2>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Admissions</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyAdmissions.length > 0 ? (
                  dailyAdmissions.map((day, index) => (
                    <tr key={index} className={`hover:bg-gray-50 ${
                      day.date === new Date().toLocaleDateString('en-IN') ? 'bg-blue-50' : ''
                    }`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {day.date}
                        {day.date === new Date().toLocaleDateString('en-IN') && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Today</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <span className="text-lg font-bold text-green-600">{day.admissions}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium text-green-600">
                        ₹{day.revenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-600">
                            Centers: {Object.entries(day.centers).map(([center, count]) => 
                              `${center} (${count})`
                            ).join(', ')}
                          </div>
                          <div className="text-xs text-gray-600">
                            Counselors: {Object.entries(day.counselors).map(([counselor, count]) => 
                              `${counselor} (${count})`
                            ).join(', ')}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No admissions data available
                    </td>
                  </tr>
                )}
              </tbody>
              {dailyAdmissions.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-green-600">
                      {dailyAdmissions.reduce((sum, day) => sum + day.admissions, 0)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-green-600">
                      ₹{dailyAdmissions.reduce((sum, day) => sum + day.revenue, 0).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Daily Admissions Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Admission Trends (Last 7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={admissionTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'revenue') return [`₹${value}k`, 'Revenue'];
                  return [value, 'Admissions'];
                }}
              />
              <Legend />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="admissions" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.6}
                name="Admissions"
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stroke="#6366f1" 
                fill="#6366f1" 
                fillOpacity={0.3}
                name="Revenue (₹k)"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Today's Admissions</p>
              <p className="text-2xl font-bold text-green-600">
                {dailyAdmissions.find(d => d.date === new Date().toLocaleDateString('en-IN'))?.admissions || 0}
              </p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded">
              <p className="text-sm text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-indigo-600">
                ₹{(dailyAdmissions.find(d => d.date === new Date().toLocaleDateString('en-IN'))?.revenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Followup Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          Follow-up Analytics
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Follow-ups</p>
            <p className="text-2xl font-bold text-gray-900">{followupStats.totalFollowups}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{followupStats.doneFollowups}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Missed</p>
            <p className="text-2xl font-bold text-red-600">{followupStats.missedFollowups}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Planned</p>
            <p className="text-2xl font-bold text-blue-600">{followupStats.plannedFollowups}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadAnalyticsDashboard;