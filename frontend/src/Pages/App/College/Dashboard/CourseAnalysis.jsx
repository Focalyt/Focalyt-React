import React, { useState } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const CourseAnalysis = () => {
  // Course analytics data
  const [courseData] = useState({
    courseWiseLeads: [
      { course: 'Full Stack Development', totalLeads: 1245, interested: 892, converted: 234, avgDuration: '6 months' },
      { course: 'Data Science', totalLeads: 987, interested: 734, converted: 189, avgDuration: '8 months' },
      { course: 'Digital Marketing', totalLeads: 756, interested: 567, converted: 145, avgDuration: '4 months' },
      { course: 'UI/UX Design', totalLeads: 654, interested: 456, converted: 123, avgDuration: '5 months' },
      { course: 'Cybersecurity', totalLeads: 534, interested: 389, converted: 98, avgDuration: '7 months' },
      { course: 'Cloud Computing', totalLeads: 423, interested: 312, converted: 87, avgDuration: '6 months' }
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
    <div className="course-analysis">
      <div className="section-header mb-4">
        <h3>🎓 Course-wise Lead Analysis</h3>
        <p className="text-muted">Analyze lead performance and conversion rates by course offerings</p>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-2">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <h4 className="mb-1">{courseData.courseWiseLeads.length}</h4>
              <p className="text-muted mb-0">Active Courses</p>
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
                {courseData.courseWiseLeads.reduce((sum, c) => sum + c.totalLeads, 0)}
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
                {courseData.courseWiseLeads.reduce((sum, c) => sum + c.converted, 0)}
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
                {formatCurrency(courseData.courseWiseLeads.reduce((sum, c) => sum +  0))}
              </h4>
           
            </div>
          </div>
        </div>
      </div>

      {/* Course Performance Table */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 pb-0">
          <h5 className="card-title mb-0 fw-semibold">📚 Course Performance Dashboard</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover course-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Duration</th>
                  <th>Total Leads</th>
                  <th>Interested</th>
                  <th>Converted</th>
                  <th>Conversion Rate</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {courseData.courseWiseLeads.map((course, index) => (
                  <tr key={index}>
                    <td>
                      <div className="course-info">
                        <div className="course-icon">
                          {course.course.includes('Development') ? '💻' :
                           course.course.includes('Data') ? '📊' :
                           course.course.includes('Marketing') ? '📱' :
                           course.course.includes('Design') ? '🎨' :
                           course.course.includes('Security') ? '🔒' : '☁️'}
                        </div>
                        <div>
                          <div className="course-name">{course.course}</div>
                          <small className="text-muted">{course.avgDuration}</small>
                        </div>
                      </div>
                    </td>
                    <td>{course.avgDuration}</td>
                    <td><span className="badge bg-primary">{course.totalLeads}</span></td>
                    <td><span className="badge bg-info">{course.interested}</span></td>
                    <td><span className="badge bg-success">{course.converted}</span></td>
                    <td>
                      <div className="conversion-rate">
                        <div className="progress">
                          <div 
                            className="progress-bar bg-success" 
                            style={{ width: `${(course.converted / course.totalLeads) * 100}%` }}
                          ></div>
                        </div>
                        <span className="rate-text">
                          {((course.converted / course.totalLeads) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  
                    <td>
                      <div className="performance-indicator">
                        {(course.converted / course.totalLeads) >= 0.2 ? '🏆' : 
                         (course.converted / course.totalLeads) >= 0.18 ? '⭐' : 
                         (course.converted / course.totalLeads) >= 0.15 ? '👍' : '📈'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Course Analytics Charts */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h5 className="card-title mb-0 fw-semibold">📈 Course Lead Distribution</h5>
            </div>
            <div className="card-body">
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseData.courseWiseLeads}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" angle={-45} textAnchor="end" height={120} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalLeads" fill="#0d6efd" name="Total Leads" />
                    <Bar dataKey="converted" fill="#198754" name="Converted" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h5 className="card-title mb-0 fw-semibold">Course</h5>
            </div>
            <div className="card-body">
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={courseData.courseWiseLeads}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      dataKey="revenue"
                      label={({ course }) => `${course}: ${formatCurrency()}`}
                    >
                      {courseData.courseWiseLeads.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 55}, 70%, 60%)`} />
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

      {/* Interest vs Conversion Analysis */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 pb-0">
              <h5 className="card-title mb-0 fw-semibold">📊 Interest vs Conversion Analysis</h5>
            </div>
            <div className="card-body">
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseData.courseWiseLeads}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" angle={-45} textAnchor="end" height={120} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="interested" fill="#ffc107" name="Interested Leads" />
                    <Bar dataKey="converted" fill="#198754" name="Converted Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Performance Grid */}
      <div className="row mt-4">
        <div className="col-12">
          <h5 className="mb-3">🎯 Course Performance Insights</h5>
        </div>
        {courseData.courseWiseLeads.map((course, index) => (
          <div key={index} className="col-lg-4 col-md-6 mb-4">
            <div className="course-insight-card">
              <div className="course-insight-header">
                <div className="course-insight-icon">
                  {course.course.includes('Development') ? '💻' :
                   course.course.includes('Data') ? '📊' :
                   course.course.includes('Marketing') ? '📱' :
                   course.course.includes('Design') ? '🎨' :
                   course.course.includes('Security') ? '🔒' : '☁️'}
                </div>
                <h6 className="course-insight-title">{course.course}</h6>
              </div>
              <div className="course-insight-stats">
                <div className="insight-stat">
                  <span className="insight-label">Leads</span>
                  <span className="insight-value">{course.totalLeads}</span>
                </div>
                <div className="insight-stat">
                  <span className="insight-label">Conversion Rate</span>
                  <span className="insight-value">
                    {((course.converted / course.totalLeads) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="insight-stat">
              
                </div>
              </div>
              <div className="course-insight-progress">
                <div className="progress">
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${(course.converted / course.totalLeads) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .course-analysis .section-header h3 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0 0 0.5rem 0;
        }

        .course-table {
          margin: 0;
        }

        .course-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          border: none;
          padding: 1rem;
        }

        .course-table td {
          padding: 1rem;
          vertical-align: middle;
          border-color: #f0f0f0;
        }

        .course-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .course-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: none;
        }

        .course-name {
          font-weight: 600;
          color: #2c3e50;
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

        .course-insight-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          height: 100%;
          transition: transform 0.2s ease;
        }

        .course-insight-card:hover {
          transform: translateY(-2px);
        }

        .course-insight-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .course-insight-icon {
          font-size: 2rem;
        }

        .course-insight-title {
          margin: 0;
          font-weight: 600;
          color: #2c3e50;
          font-size: 1rem;
        }

        .course-insight-stats {
          margin-bottom: 1rem;
        }

        .insight-stat {
          display: flex;
          justify-content: between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .insight-stat:last-child {
          border-bottom: none;
        }

        .insight-label {
          color: #6c757d;
          font-size: 0.875rem;
        }

        .insight-value {
          font-weight: 600;
          color: #2c3e50;
        }

        .course-insight-progress .progress {
          height: 6px;
        }

        .card {
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
};

export default CourseAnalysis;