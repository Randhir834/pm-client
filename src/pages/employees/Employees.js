import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/ui';
import { API_BASE_URL } from '../../services/api';
import '../../styles/global.css';
import './Employees.css';

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_BASE_URL}/api/auth/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      let users = data.users || [];
      
      // Filter out admin users - only show regular users
      users = users.filter(user => user.role !== 'admin');
      
      // Filter out specific user
      users = users.filter(user => user.email !== 'kumarrandhir1705@gmail.com');
      
      // Apply client-side filtering
      if (searchTerm) {
        users = users.filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (roleFilter) {
        users = users.filter(user => user.role === roleFilter);
      }
      
      setEmployees(users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter]);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="dashboard-container employees-container">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h2>Employee List</h2>
            <p>All employee register on the platform</p>
          </div>
        </div>

        <div className="content-section">
          <div className="filters-container">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="employees-grid">
          {employees.length === 0 ? (
            <div className="no-data">No users found</div>
          ) : (
            employees.map(employee => (
              <div 
                key={employee._id} 
                className="employee-card"
                onClick={() => navigate(`/employees/${employee._id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="employee-header">
                  <div className="employee-avatar">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="employee-info">
                    <h3>{employee.name}</h3>
                    <p className="employee-id">{employee.email}</p>
                  </div>
                </div>
                
                <div className="employee-details">
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span>{employee.email}</span>
                  </div>
                  {employee.designation && (
                    <div className="detail-row">
                      <span className="label">Designation:</span>
                      <span className="designation-badge">{employee.designation}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">Role:</span>
                    <span className={`status-badge status-${employee.role}`}>
                      {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className={`status-badge status-${employee.isActive ? 'active' : 'inactive'}`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Registered:</span>
                    <span>{new Date(employee.createdAt).toLocaleDateString()}</span>
                  </div>
                  {employee.lastLogin && (
                    <div className="detail-row">
                      <span className="label">Last Login:</span>
                      <span>{new Date(employee.lastLogin).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Employees;
