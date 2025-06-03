import React from 'react';
import {
  Plus,
  Edit,
  Eye,
  Trash2
} from 'lucide-react';

const AssignmentRule = ({ 
  assignmentRules, 
  entities, 
  users 
}) => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Assignment Rules</h3>
        <button className="btn btn-success d-flex align-items-center gap-2">
          <Plus size={16} />
          <span>Create Rule</span>
        </button>
      </div>

      <div className="row g-4">
        {assignmentRules.map((rule) => (
          <div key={rule.id} className="col-md-6">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title mb-0">{rule.name}</h5>
                    <div className="text-muted small">{rule.type.replace('_', ' ')}</div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${rule.active ? 'bg-success' : 'bg-secondary'}`}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={rule.active}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <p className="text-muted mb-3">{rule.description}</p>

                {rule.type === 'location_based' && (
                  <div>
                    <h6 className="fw-medium mb-2">Center Mapping</h6>
                    {Object.entries(rule.conditions.center_mapping).map(([centerId, userIds]) => {
                      const center = entities.CENTER.find(c => c.id === centerId);
                      return (
                        <div key={centerId} className="mb-2">
                          <div className="fw-medium small">{center?.name}</div>
                          <div className="small text-muted">
                            → {userIds.map(userId =>
                              users.find(u => u.user_id === userId)?.name
                            ).join(', ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {rule.type === 'course_based' && (
                  <div>
                    <h6 className="fw-medium mb-2">Course Specialization</h6>
                    {Object.entries(rule.conditions.course_mapping).map(([course, userIds]) => (
                      <div key={course} className="mb-2">
                        <div className="fw-medium small">{course}</div>
                        <div className="small text-muted">
                          → {userIds.map(userId =>
                            users.find(u => u.user_id === userId)?.name
                          ).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {rule.type === 'load_based' && (
                  <div>
                    <h6 className="fw-medium mb-2">Load Balancing</h6>
                    <div className="small">
                      <div>Max leads per user: {rule.conditions.max_leads_per_user}</div>
                      <div>Rebalance: {rule.conditions.rebalance_frequency}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-primary">
                    <Edit size={14} className="me-1" />
                    Edit
                  </button>
                  <button className="btn btn-sm btn-outline-info">
                    <Eye size={14} className="me-1" />
                    Test
                  </button>
                  <button className="btn btn-sm btn-outline-danger">
                    <Trash2 size={14} className="me-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignmentRule;