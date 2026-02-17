import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/ui';
import { useCachedApi } from '../../hooks/useCachedApi';
import { getApiUrl } from '../../services/api';
import '../../styles/global.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const statsResult = useCachedApi('api/auth/stats', { ttlMs: 5 * 60_000 });
  const usersResult = useCachedApi('api/auth/users', { ttlMs: 5 * 60_000 });

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (statsResult.data?.stats) {
      setStats(statsResult.data.stats);
    }
  }, [statsResult.data]);

  useEffect(() => {
    if (Array.isArray(usersResult.data?.users)) {
      setUsers(usersResult.data.users);
    }
  }, [usersResult.data]);

  const loading = statsResult.loading || usersResult.loading;


  useEffect(() => {
    const firstError = statsResult.error || usersResult.error;
    if (!firstError) {
      setError(null);
      return;
    }

    const message = firstError?.message || 'Failed to load admin data. Please try again.';
    setError(message);
  }, [statsResult.error, usersResult.error]);

  const fetchAdminData = async () => {
    setError(null);
    await Promise.all([statsResult.refetch(), usersResult.refetch()]);
  };



  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`api/auth/users/${userId}/role`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        // Update the user's role locally
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, role: newRole } : user
          )
        );
        console.log(`Successfully updated user role to ${newRole}`);
      } else {
        console.error('Failed to update user role:', response.status);
        alert('Failed to update user role. Please try again.');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role. Please try again.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    // Confirm deletion with user
    const isConfirmed = window.confirm(
      `Are you sure you want to delete user "${userName}"?\n\nThis action will:\n• Permanently delete the user account\n• Delete all associated sessions\n• Delete all leads created by this user\n• Remove user assignments from leads\n\nThis action cannot be undone.`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`api/auth/users/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove user from local state
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        
        // Update stats
        setStats(prevStats => ({
          ...prevStats,
          totalUsers: prevStats.totalUsers - 1
        }));
        
        console.log(`Successfully deleted user: ${userName}`);
        alert(`User "${userName}" has been permanently deleted.`);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete user:', response.status, errorData);
        alert(`Failed to delete user: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    }
  };



  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading Admin Dashboard..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="dashboard-container">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Error Loading Dashboard</h2>
            <p>{error}</p>
            <button 
              className="btn-primary"
              onClick={fetchAdminData}
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <h2>Admin Dashboard</h2>
            <p>System overview and user management for Innovatiq Media</p>
          </div>
        </div>

        {/* System Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>Total Users</h3>
              <p className="stat-number">{stats.totalUsers}</p>
              <span className="stat-change positive">Users in the system</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>Active Users</h3>
              <p className="stat-number">{stats.activeUsers}</p>
              <span className="stat-change positive">Currently online</span>
            </div>
          </div>
        </div>



        {/* User Management */}
        <div className="content-section">
          <div className="section-header">
            <div className="section-title">
              <h3>User Management</h3>
              <p>Manage user roles and permissions</p>
            </div>
            <div className="section-actions">
              <button 
                className="import-button"
                onClick={() => navigate('/register', { state: { fromAdmin: true } })}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V8c0-.55-.45-1-1-1s-1 .45-1 1v2H2c-.55 0-1 .45-1 1s.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Registration
              </button>
            </div>
          </div>
          
          <div className="table-container">
            {users.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="lead-name">
                          <div className="lead-avatar">
                            <span>{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <div className="role-actions">
                          <span className={`assigned-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </span>
                          {user.email === 'innovatiqmedia@gmail.com' && user.role !== 'admin' && (
                            <button 
                              className="action-btn edit"
                              style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px' }}
                              onClick={() => updateUserRole(user._id, 'admin')}
                              title="Make Admin"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="user-actions">
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            title="Delete User"
                            disabled={user.email === 'innovatiqmedia@gmail.com'}
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No Users Found</h3>
                <p>There are no users in the system yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;