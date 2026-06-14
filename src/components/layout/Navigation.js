import React, { useState } from 'react';
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
  delivered: () => import('../../pages/projects/Delivered'),
  employees: () => import('../../pages/employees/Employees')
};

const apiPrefetchers = {
  dashboard: () => prefetchCachedApi('api/projects'),
  projects: () => prefetchCachedApi('api/projects'),
  delivered: () => prefetchCachedApi('api/projects/delivered'),
  employees: () => prefetchCachedApi('api/auth/users'),
  admin: async () => {
    await prefetchCachedApi('api/auth/stats');
    await prefetchCachedApi('api/auth/users');
  }
};

const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    setIsSidebarOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigation = (path, preloadKey) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Horizontal Navbar */}
      <nav className="app-navigation">
        <div className="nav-left">
          {/* Hamburger Menu Button */}
          <button 
            className="hamburger-button"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="nav-brand">
            <div className="animated-logo">
              <img src={require('../../assets/logo.png')} alt="Innovatiq Media" className="logo-image" />
              <div className="logo-glow"></div>
            </div>
          </div>
        </div>

        <div className="nav-right">
          <div className="user-menu">
            <div className="user-avatar">
              <span>{user && user.name && user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="user-info">
              <span className="user-name">{user && user.name}</span>
              {user && user.designation && (
                <span className="user-designation">{user.designation}</span>
              )}
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

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Vertical Sidebar */}
      <nav className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="nav-brand">
            <div className="animated-logo">
              <img src={require('../../assets/logo.png')} alt="Innovatiq Media" className="logo-image" />
              <div className="logo-glow"></div>
            </div>
            <h1>Innovatiq Media</h1>
          </div>
        </div>

        <div className="sidebar-menu">
          <button 
            className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => handleNavigation('/dashboard', 'dashboard')}
            onMouseEnter={() => preloadRoute('dashboard')}
            onFocus={() => preloadRoute('dashboard')}
            onMouseEnterCapture={() => preloadData('dashboard')}
            onFocusCapture={() => preloadData('dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <span>Dashboard</span>
          </button>
          
          {isAdmin && (
            <button 
              className={`sidebar-item ${isActive('/admin') ? 'active' : ''}`}
              onClick={() => handleNavigation('/admin', 'admin')}
              onMouseEnter={() => preloadRoute('admin')}
              onFocus={() => preloadRoute('admin')}
              onMouseEnterCapture={() => preloadData('admin')}
              onFocusCapture={() => preloadData('admin')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              <span>Admin</span>
            </button>
          )}
          
          <button 
            className={`sidebar-item ${isActive('/projects') ? 'active' : ''}`}
            onClick={() => handleNavigation('/projects', 'projects')}
            onMouseEnter={() => preloadRoute('projects')}
            onFocus={() => preloadRoute('projects')}
            onMouseEnterCapture={() => preloadData('projects')}
            onFocusCapture={() => preloadData('projects')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <span>Projects</span>
          </button>
          
          <button
            className={`sidebar-item ${isActive('/delivered') ? 'active' : ''}`}
            onClick={() => handleNavigation('/delivered', 'delivered')}
            onMouseEnter={() => preloadRoute('delivered')}
            onFocus={() => preloadRoute('delivered')}
            onMouseEnterCapture={() => preloadData('delivered')}
            onFocusCapture={() => preloadData('delivered')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            <span>Delivered</span>
          </button>
          
          {isAdmin && (
            <>
              <button
                className={`sidebar-item ${isActive('/employees') ? 'active' : ''}`}
                onClick={() => handleNavigation('/employees', 'employees')}
                onMouseEnter={() => preloadRoute('employees')}
                onFocus={() => preloadRoute('employees')}
                onMouseEnterCapture={() => preloadData('employees')}
                onFocusCapture={() => preloadData('employees')}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span>Employees</span>
              </button>
              
              <button
                className={`sidebar-item ${isActive('/attendance') ? 'active' : ''}`}
                onClick={() => handleNavigation('/attendance')}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <span>Attendance</span>
              </button>
            </>
          )}

          {!isAdmin && (
            <button
              className={`sidebar-item ${isActive('/my-attendance') ? 'active' : ''}`}
              onClick={() => handleNavigation('/my-attendance')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              <span>My Attendance</span>
            </button>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-menu">
            <div className="user-avatar">
              <span>{user && user.name && user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="user-info">
              <span className="user-name">{user && user.name}</span>
              {user && user.designation && (
                <span className="user-designation">{user.designation}</span>
              )}
              <span className="user-role">{user && user.role ? user.role : 'User'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navigation; 