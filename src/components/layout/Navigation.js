import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { prefetchCachedApi } from '../../hooks/useCachedApi';
import '../../styles/global.css';
import './Navigation.css';
// Logo is in public directory, so we can reference it directly

const preloaders = {
  dashboard: () => import('../../pages/dashboard/DashboardProjects'),
  admin: () => import('../../pages/dashboard/AdminDashboard'),
  projects: () => import('../../pages/projects/Projects'),
  delivered: () => import('../../pages/projects/Delivered')
};

const apiPrefetchers = {
  dashboard: () => prefetchCachedApi('api/projects'),
  projects: () => prefetchCachedApi('api/projects'),
  delivered: () => prefetchCachedApi('api/projects/delivered'),
  admin: async () => {
    await prefetchCachedApi('api/auth/stats');
    await prefetchCachedApi('api/auth/users');
  }
};

const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const preloadRoute = (key) => {
    const fn = preloaders[key];
    if (!fn) return;
    // Fire-and-forget; errors are non-fatal for UX.
    Promise.resolve()
      .then(fn)
      .catch(() => {});
  };

  const preloadData = (key) => {
    const fn = apiPrefetchers[key];
    if (!fn) return;
    Promise.resolve()
      .then(fn)
      .catch(() => {});
  };

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Function to get the dynamic title based on current route
  const getPageTitle = () => {
    return 'Innovatiq Media';
  };

  return (
    <nav className="app-navigation">
      <div className="nav-left">
                  <div className="nav-brand">
            <div className="animated-logo">
              <img src={require('../../assets/logo.png')} alt="Innovatiq Media" className="logo-image" />
              <div className="logo-glow"></div>
            </div>
            <h1>{getPageTitle().replace(/^[^\w]*/,'')}</h1>
          </div>
      </div>
      
      <div className="nav-center">
        <div className="nav-menu">
          <button 
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
            onMouseEnter={() => preloadRoute('dashboard')}
            onFocus={() => preloadRoute('dashboard')}
            onMouseEnterCapture={() => preloadData('dashboard')}
            onFocusCapture={() => preloadData('dashboard')}
          >
            Dashboard
          </button>
          {isAdmin && (
            <button 
              className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
              onClick={() => navigate('/admin')}
              onMouseEnter={() => preloadRoute('admin')}
              onFocus={() => preloadRoute('admin')}
              onMouseEnterCapture={() => preloadData('admin')}
              onFocusCapture={() => preloadData('admin')}
            >
              Admin
            </button>
          )}
          <button 
            className={`nav-item ${isActive('/projects') ? 'active' : ''}`}
            onClick={() => navigate('/projects')}
            onMouseEnter={() => preloadRoute('projects')}
            onFocus={() => preloadRoute('projects')}
            onMouseEnterCapture={() => preloadData('projects')}
            onFocusCapture={() => preloadData('projects')}
          >
            Projects
          </button>
          <button
            className={`nav-item ${isActive('/delivered') ? 'active' : ''}`}
            onClick={() => navigate('/delivered')}
            onMouseEnter={() => preloadRoute('delivered')}
            onFocus={() => preloadRoute('delivered')}
            onMouseEnterCapture={() => preloadData('delivered')}
            onFocusCapture={() => preloadData('delivered')}
          >
            Delivered
          </button>
        </div>
      </div>

      <div className="nav-right">
        <div className="user-menu">
          <div className="user-avatar">
            <span>{user && user.name && user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="user-info">
            <span className="user-name">{user && user.name}</span>
            <span className="user-role">{user && user.role ? user.role : 'User'}</span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 