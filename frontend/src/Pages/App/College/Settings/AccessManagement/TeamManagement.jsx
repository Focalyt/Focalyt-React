import React, { useState } from 'react';
import {
  Plus,
  Download,
  Eye,
  Edit,
  User
} from 'lucide-react';

const TeamManagement = ({ 
  organizationTree, 
  allRoles, 
  leads, 
  onViewUserDetails 
}) => {
  const getUserLeads = (userId) => {
    // This would typically come from props or context
    const userLeads = leads.filter(lead => lead.assigned_to === userId);
    return userLeads;
  };

  const buildTree = () => {
    const tree = {};
    
    // Build hierarchy
    Object.values(organizationTree).forEach(user => {
      if (user.level === 1) { // Top level managers
        tree[user.user_id] = {
          ...user,
          children: getDirectReports(user.user_id)
        };
      }
    });
    
    return tree;
  };

  const getDirectReports = (managerId) => {
    return Object.values(organizationTree)
      .filter(user => user.reporting_to?.includes(managerId))
      .map(user => ({
        ...user,
        children: getDirectReports(user.user_id)
      }));
  };

  const TreeNode = ({ node, level = 0 }) => {
    const [expanded, setExpanded] = useState(true);
    const userLeads = getUserLeads(node.user_id);
    
    return (
      <div className="tree-node">
        <div 
          className={`d-flex align-items-center gap-3 p-3 border rounded mb-2 ${
            level === 0 ? 'bg-primary bg-opacity-10' : 
            level === 1 ? 'bg-info bg-opacity-10' : 'bg-light'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          {/* Expand/Collapse Button */}
          {node.children?.length > 0 && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '−' : '+'}
            </button>
          )}
          
          {/* User Avatar */}
          <div className={`bg-${level === 0 ? 'primary' : level === 1 ? 'info' : 'secondary'} bg-opacity-25 rounded-circle p-2`}>
            <User size={16} className={`text-${level === 0 ? 'primary' : level === 1 ? 'info' : 'secondary'}`} />
          </div>
          
          {/* User Details */}
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2">
              <div className="fw-medium">{node.name}</div>
              <span className={`badge bg-${node.department === 'SALES' ? 'success' : 'info'}`}>
                {allRoles[node.role]?.name}
              </span>
            </div>
            <div className="text-muted small">{node.email}</div>
            
            {/* Reporting Info */}
            {node.reporting_to?.length > 0 && (
              <div className="small text-warning mt-1">
                Reports to: {node.reporting_to.map(managerId => 
                  organizationTree[managerId]?.name
                ).join(', ')}
              </div>
            )}
            
            {/* Performance Metrics */}
            <div className="d-flex gap-3 mt-2">
              <div className="small">
                <span className="text-primary fw-medium">{userLeads.length}</span>
                <span className="text-muted"> leads</span>
              </div>
              <div className="small">
                <span className="text-success fw-medium">
                  {userLeads.filter(lead => lead.status === 'qualified').length}
                </span>
                <span className="text-muted"> qualified</span>
              </div>
              {node.direct_reports?.length > 0 && (
                <div className="small">
                  <span className="text-info fw-medium">{node.direct_reports.length}</span>
                  <span className="text-muted"> reports</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="d-flex gap-2">
            <button
              onClick={() => onViewUserDetails(node)}
              className="btn btn-sm btn-outline-primary"
            >
              <Eye size={14} />
            </button>
            <button className="btn btn-sm btn-outline-success">
              <Edit size={14} />
            </button>
          </div>
        </div>
        
        {/* Children */}
        {expanded && node.children?.map(child => (
          <TreeNode key={child.user_id} node={child} level={level + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="organization-tree">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Organization Structure</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm">
            <Download size={14} className="me-1" />
            Export Org Chart
          </button>
          <button className="btn btn-success btn-sm">
            <Plus size={14} className="me-1" />
            Add Position
          </button>
        </div>
      </div>
      
      {/* Department Filters */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <input type="radio" className="btn-check" name="dept" id="all" defaultChecked />
          <label className="btn btn-outline-secondary" htmlFor="all">All Departments</label>
          
          <input type="radio" className="btn-check" name="dept" id="sales" />
          <label className="btn btn-outline-success" htmlFor="sales">Sales</label>
          
          <input type="radio" className="btn-check" name="dept" id="counselling" />
          <label className="btn btn-outline-info" htmlFor="counselling">Counselling</label>
        </div>
      </div>
      
      {/* Tree Structure */}
      <div className="tree-container">
        {Object.values(buildTree()).map(rootNode => (
          <TreeNode key={rootNode.user_id} node={rootNode} level={0} />
        ))}
      </div>
      
      {/* Statistics */}
      <div className="row g-3 mt-4">
        <div className="col-md-3">
          <div className="card bg-primary bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="fw-bold text-primary">
                {Object.values(organizationTree).filter(u => u.level === 1).length}
              </div>
              <div className="small">Managers</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="fw-bold text-info">
                {Object.values(organizationTree).filter(u => u.level === 2).length}
              </div>
              <div className="small">Team Members</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="fw-bold text-success">
                {leads.filter(l => l.status === 'qualified').length}
              </div>
              <div className="small">Total Qualified</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="fw-bold text-warning">
                {Object.values(organizationTree).filter(u => u.reporting_to?.length > 1).length}
              </div>
              <div className="small">Matrix Reporting</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;