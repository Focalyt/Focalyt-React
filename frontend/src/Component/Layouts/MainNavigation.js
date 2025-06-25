import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MainNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { 
      path: '/candidate-management', 
      label: 'Candidate Management',
      icon: 'bi-people'
    },
    { 
      path: '/projects', 
      label: 'Projects',
      icon: 'bi-folder'
    },
    { 
      path: '/center', 
      label: 'Center',
      icon: 'bi-building'
    },
    { 
      path: '/courses', 
      label: 'Courses',
      icon: 'bi-book'
    },
    { 
      path: '/batches', 
      label: 'Batches',
      icon: 'bi-collection'
    },
    { 
      path: '/students', 
      label: 'Students',
      icon: 'bi-mortarboard'
    }
  ];

  const isActive = (path) => {
    // Exact match for most paths
    if (path === '/candidate-management') {
      return location.pathname === path || location.pathname.startsWith('/candidate-management');
    }
    return location.pathname === path;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container-fluid">
        <a className="navbar-brand" href="#!">
          <i className="bi bi-mortarboard me-2"></i>
          College Management
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {menuItems.map((item) => (
              <li className="nav-item" key={item.path}>
                <button
                  className={`nav-link btn btn-link text-start ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                  style={{ 
                    border: 'none', 
                    background: 'none',
                    color: isActive(item.path) ? '#fff' : 'rgba(255,255,255,.75)'
                  }}
                >
                  <i className={`bi ${item.icon} me-2`}></i>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          
          {/* User info */}
          <div className="navbar-nav">
            <div className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#!" role="button" data-bs-toggle="dropdown">
                <i className="bi bi-person-circle me-1"></i>
                Profile
              </a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#!">Settings</a></li>
                <li><a className="dropdown-item" href="#!">Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;