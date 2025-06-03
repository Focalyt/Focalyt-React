import React, { useState } from 'react';

const PermissionAnalysis = ({ 
  users, 
  allRoles 
}) => {
  const [analysisUser, setAnalysisUser] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisView, setAnalysisView] = useState('single');

  return (
    <div>
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="card-title">Permission Analysis</h3>
            <div className="btn-group" role="group">
              <input
                type="radio"
                className="btn-check"
                name="analysisView"
                id="single"
                checked={analysisView === 'single'}
                onChange={() => setAnalysisView('single')}
              />
              <label className="btn btn-outline-primary" htmlFor="single">
                Single User
              </label>

              <input
                type="radio"
                className="btn-check"
                name="analysisView"
                id="matrix"
                checked={analysisView === 'matrix'}
                onChange={() => setAnalysisView('matrix')}
              />
              <label className="btn btn-outline-primary" htmlFor="matrix">
                Permission Matrix
              </label>
            </div>
          </div>

          {analysisView === 'single' && (
            <div className="row">
              <div className="col-lg-6">
                <div className="mb-4">
                  <label className="form-label fw-medium">Select User</label>
                  <select
                    value={analysisUser}
                    onChange={(e) => {
                      setAnalysisUser(e.target.value);
                      if (e.target.value) {
                        const user = users.find(u => u.user_id === e.target.value);
                        setAnalysisResult(user);
                      }
                    }}
                    className="form-select"
                  >
                    <option value="">Choose a user...</option>
                    {users.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name} ({allRoles[user.role]?.name})
                      </option>
                    ))}
                  </select>
                </div>

                {analysisResult && (
                  <div>
                    <div className="card bg-light mb-4">
                      <div className="card-body">
                        <h5 className="card-title">User Summary</h5>
                        <div className="row g-2 small">
                          <div className="col-6">
                            <span className="text-muted">Permission Type:</span>
                          </div>
                          <div className="col-6">
                            <span className="fw-medium">
                              {analysisResult.permission_type === 'hierarchical' && '📋 Content Management'}
                              {analysisResult.permission_type === 'lead_based' && '🎯 Lead Management'}
                              {analysisResult.permission_type === 'hybrid' && '⚡ Hybrid Access'}
                            </span>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Role:</span>
                          </div>
                          <div className="col-6">
                            <span className="fw-medium">{allRoles[analysisResult.role]?.name}</span>
                          </div>
                          {analysisResult.permission_type !== 'lead_based' && (
                            <>
                              <div className="col-6">
                                <span className="text-muted">Entity Control:</span>
                              </div>
                              <div className="col-6">
                                <span className="fw-medium">{analysisResult.entity_name}</span>
                              </div>
                            </>
                          )}
                          {analysisResult.permission_type !== 'hierarchical' && (
                            <>
                              <div className="col-6">
                                <span className="text-muted">Assigned Leads:</span>
                              </div>
                              <div className="col-6">
                                <span className="fw-medium">{analysisResult.assigned_leads?.length || 0}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {analysisResult && (
                <div className="col-lg-6">
                  <h5 className="fw-medium mb-3">Detailed Permissions</h5>

                  <div className="row g-3">
                    {analysisResult.permission_type === 'hierarchical' && (
                      <>
                        <div className="col-12">
                          <div className="card border-primary">
                            <div className="card-body">
                              <h6 className="card-title text-primary mb-2">📋 Content Access</h6>
                              <p className="card-text small text-primary mb-0">
                                Can access {analysisResult.entity_name} and all its children content
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="card border-success">
                            <div className="card-body">
                              <h6 className="card-title text-success mb-2">➕ Add Permissions</h6>
                              <p className="card-text small text-success mb-0">
                                Can add content based on role level and hierarchy
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {analysisResult.permission_type === 'lead_based' && (
                      <>
                        <div className="col-12">
                          <div className="card border-success">
                            <div className="card-body">
                              <h6 className="card-title text-success mb-2">🎯 Lead Access</h6>
                              <p className="card-text small text-success mb-0">
                                {analysisResult.assigned_leads?.length || 0} assigned leads
                                {analysisResult.team_leads && ` + ${analysisResult.team_leads.length - (analysisResult.assigned_leads?.length || 0)} team leads`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="card border-info">
                            <div className="card-body">
                              <h6 className="card-title text-info mb-2">📋 Dynamic Center Access</h6>
                              <p className="card-text small text-info mb-0">
                                Access to {analysisResult.centers_access?.length || 0} centers based on lead assignments
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {analysisResult.permission_type === 'hybrid' && (
                      <>
                        <div className="col-12">
                          <div className="card border-warning">
                            <div className="card-body">
                              <h6 className="card-title text-warning mb-2">⚡ Hybrid Access</h6>
                              <p className="card-text small text-warning mb-0">
                                Content: {analysisResult.entity_name}<br />
                                Leads: {analysisResult.assigned_leads?.length || 0} direct + team management
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {analysisView === 'matrix' && (
            <div className="text-center py-5">
              <h5 className="text-muted">Permission Matrix View</h5>
              <p className="text-muted">Coming soon - Comprehensive permission matrix for all users</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionAnalysis;