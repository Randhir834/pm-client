import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/ui';
import { API_BASE_URL } from '../../services/api';
import './EmployeeDetails.css';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Salary state
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [salaryData, setSalaryData] = useState({
    month: new Date().toISOString().slice(0, 7),
    basicSalary: '',
    allowances: '',
    deductions: '',
    bonus: ''
  });
  const [salaries, setSalaries] = useState([]);
  
  // Projects state
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    designation: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchEmployeeDetails();
    fetchSalaries();
    fetchProjects();
  }, [id]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch employee details');
      
      const data = await response.json();
      setEmployee(data.user);
      setEditData({
        name: data.user.name || '',
        email: data.user.email || '',
        designation: data.user.designation || '',
        phone: data.user.phone || '',
        address: data.user.address || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/salary/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSalaries(data.salaries || []);
      }
    } catch (err) {
      console.error('Failed to fetch salaries:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter projects assigned to this employee
        const employeeProjects = data.projects.filter(
          project => project.assignedTo && project.assignedTo._id === id
        );
        setProjects(employeeProjects);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });
      
      if (!response.ok) throw new Error('Failed to update profile');
      
      await fetchEmployeeDetails();
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    }
  };

  const handleAddSalary = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const totalSalary = 
        parseFloat(salaryData.basicSalary || 0) + 
        parseFloat(salaryData.allowances || 0) + 
        parseFloat(salaryData.bonus || 0) - 
        parseFloat(salaryData.deductions || 0);
      
      const response = await fetch(`${API_BASE_URL}/api/salary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: id,
          ...salaryData,
          totalSalary
        })
      });
      
      if (!response.ok) throw new Error('Failed to add salary');
      
      await fetchSalaries();
      setShowSalaryForm(false);
      setSalaryData({
        month: new Date().toISOString().slice(0, 7),
        basicSalary: '',
        allowances: '',
        deductions: '',
        bonus: ''
      });
      alert('Salary added successfully!');
    } catch (err) {
      alert('Error adding salary: ' + err.message);
    }
  };

  const calculateDailyWage = (monthlySalary) => {
    return (monthlySalary / 30).toFixed(2);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (error) return <Layout><div className="error-message">{error}</div></Layout>;
  if (!employee) return <Layout><div className="error-message">Employee not found</div></Layout>;

  return (
    <Layout>
      <div className="dashboard-container employee-details-container">
        {/* Employee Profile Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-large">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h1>{employee.name}</h1>
              <p className="profile-email">{employee.email}</p>
              <div className="profile-badges">
                <span className={`badge badge-${employee.role}`}>
                  {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                </span>
                <span className={`badge badge-${employee.isActive ? 'active' : 'inactive'}`}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="profile-actions">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <button onClick={() => setIsEditing(false)} className="btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </div>

          {isEditing && (
            <form onSubmit={handleUpdateProfile} className="edit-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <input
                    type="text"
                    value={editData.designation}
                    onChange={(e) => setEditData({...editData, designation: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-success">Save Changes</button>
              </div>
            </form>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'salary' ? 'active' : ''}`}
              onClick={() => setActiveTab('salary')}
            >
              Salary Management
            </button>
            <button
              className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              Projects
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="info-cards-grid">
                <div className="info-card">
                  <div className="info-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="info-card-content">
                    <h3>Designation</h3>
                    <p>{employee.designation || 'Not specified'}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="info-card-content">
                    <h3>Phone</h3>
                    <p>{employee.phone || 'Not specified'}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="info-card-content">
                    <h3>Last Login</h3>
                    <p>{employee.lastLogin ? new Date(employee.lastLogin).toLocaleString() : 'Never'}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="info-card-content">
                    <h3>Address</h3>
                    <p>{employee.address || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Salary Tab */}
          {activeTab === 'salary' && (
            <div className="salary-tab">
              <div className="salary-header">
                <h2>Salary Management</h2>
                <button 
                  onClick={() => setShowSalaryForm(!showSalaryForm)} 
                  className="btn-primary"
                >
                  {showSalaryForm ? 'Cancel' : 'Add Salary Entry'}
                </button>
              </div>

              {showSalaryForm && (
                <form onSubmit={handleAddSalary} className="salary-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Month</label>
                      <input
                        type="month"
                        value={salaryData.month}
                        onChange={(e) => setSalaryData({...salaryData, month: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Basic Salary</label>
                      <input
                        type="number"
                        value={salaryData.basicSalary}
                        onChange={(e) => setSalaryData({...salaryData, basicSalary: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Allowances</label>
                      <input
                        type="number"
                        value={salaryData.allowances}
                        onChange={(e) => setSalaryData({...salaryData, allowances: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group">
                      <label>Deductions</label>
                      <input
                        type="number"
                        value={salaryData.deductions}
                        onChange={(e) => setSalaryData({...salaryData, deductions: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group">
                      <label>Bonus</label>
                      <input
                        type="number"
                        value={salaryData.bonus}
                        onChange={(e) => setSalaryData({...salaryData, bonus: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="salary-preview">
                    <div className="preview-item">
                      <span>Total Salary:</span>
                      <strong>
                        {formatCurrency(
                          parseFloat(salaryData.basicSalary || 0) + 
                          parseFloat(salaryData.allowances || 0) + 
                          parseFloat(salaryData.bonus || 0) - 
                          parseFloat(salaryData.deductions || 0)
                        )}
                      </strong>
                    </div>
                    <div className="preview-item">
                      <span>Per Day Wage:</span>
                      <strong>
                        {formatCurrency(calculateDailyWage(
                          parseFloat(salaryData.basicSalary || 0) + 
                          parseFloat(salaryData.allowances || 0) + 
                          parseFloat(salaryData.bonus || 0) - 
                          parseFloat(salaryData.deductions || 0)
                        ))}
                      </strong>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-success">Save Salary Entry</button>
                  </div>
                </form>
              )}

              <div className="salaries-list">
                <h3>Salary History</h3>
                {salaries.length === 0 ? (
                  <div className="no-data">No salary entries found</div>
                ) : (
                  <div className="salaries-grid">
                    {salaries.map((salary) => (
                      <div key={salary._id} className="salary-card">
                        <div className="salary-card-header">
                          <h4>{new Date(salary.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                        </div>
                        <div className="salary-details">
                          <div className="salary-row">
                            <span>Basic Salary:</span>
                            <span>{formatCurrency(salary.basicSalary)}</span>
                          </div>
                          <div className="salary-row">
                            <span>Allowances:</span>
                            <span>{formatCurrency(salary.allowances || 0)}</span>
                          </div>
                          <div className="salary-row">
                            <span>Bonus:</span>
                            <span>{formatCurrency(salary.bonus || 0)}</span>
                          </div>
                          <div className="salary-row negative">
                            <span>Deductions:</span>
                            <span>-{formatCurrency(salary.deductions || 0)}</span>
                          </div>
                          <div className="salary-row total">
                            <span>Total Salary:</span>
                            <strong>{formatCurrency(salary.totalSalary)}</strong>
                          </div>
                          <div className="salary-row highlight">
                            <span>Per Day Wage:</span>
                            <strong>{formatCurrency(calculateDailyWage(salary.totalSalary))}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="projects-tab">
              <h2>Assigned Projects</h2>
              {loadingProjects ? (
                <LoadingSpinner />
              ) : projects.length === 0 ? (
                <div className="no-data">No projects assigned to this employee</div>
              ) : (
                <div className="projects-grid">
                  {projects.map((project) => (
                    <div key={project._id} className="project-card">
                      <div className="project-card-header">
                        <div className="project-title-section">
                          <h3>{project.clientName}</h3>
                          <span className="project-id">{project.projectId}</span>
                        </div>
                        <span className={`status-badge status-${project.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {project.status}
                        </span>
                      </div>
                      
                      <div className="project-card-body">
                        <div className="project-info-row">
                          <span className="label">Project Type:</span>
                          <span className="value">{project.projectType}</span>
                        </div>
                        
                        <div className="project-info-row">
                          <span className="label">Start Date:</span>
                          <span className="value">
                            {new Date(project.startDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <div className="project-info-row">
                          <span className="label">Deadline:</span>
                          <span className="value">
                            {new Date(project.deadline).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        {project.description && (
                          <div className="project-description">
                            <span className="label">Description:</span>
                            <p>{project.description}</p>
                          </div>
                        )}
                        
                        {project.files && project.files.length > 0 && (
                          <div className="project-files">
                            <span className="label">Files: {project.files.length}</span>
                          </div>
                        )}
                        
                        {project.links && project.links.length > 0 && (
                          <div className="project-links">
                            <span className="label">Links:</span>
                            <div className="links-list">
                              {project.links.map((link, index) => (
                                <a 
                                  key={index} 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="project-link"
                                >
                                  {link.label || link.url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="project-card-footer">
                        <button 
                          onClick={() => navigate(`/projects/${project._id}`)}
                          className="btn-view-project"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDetails;
