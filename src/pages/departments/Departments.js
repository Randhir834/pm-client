import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/ui';
import { API_BASE_URL } from '../../services/api';
import '../../styles/global.css';
import './Departments.css';

const Departments = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDept, setCurrentDept] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    budget: '',
    location: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch departments');
      
      const data = await response.json();
      setDepartments(data.departments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const url = editMode 
        ? `${API_BASE_URL}/api/departments/${currentDept._id}`
        : `${API_BASE_URL}/api/departments`;
      
      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save department');
      }
      
      setShowModal(false);
      resetForm();
      fetchDepartments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (dept) => {
    setCurrentDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      budget: dept.budget || '',
      location: dept.location || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete department');
      }
      
      fetchDepartments();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      budget: '',
      location: ''
    });
    setEditMode(false);
    setCurrentDept(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="dashboard-container departments-container">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h2>Department Management</h2>
            <p>Manage departments and organizational structure</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={openAddModal}>
              + Add Department
            </button>
          </div>
        </div>

        <div className="content-section">
          {error && <div className="error-message">{error}</div>}

          <div className="departments-grid">
          {departments.length === 0 ? (
            <div className="no-data">No departments found</div>
          ) : (
            departments.map(dept => (
              <div key={dept._id} className="department-card">
                <div className="department-header">
                  <h3>{dept.name}</h3>
                  <span className="department-code">{dept.code}</span>
                </div>
                
                <div className="department-details">
                  {dept.description && (
                    <p className="description">{dept.description}</p>
                  )}
                  
                  <div className="detail-row">
                    <span className="label">Employees:</span>
                    <span className="value">{dept.employeeCount || 0}</span>
                  </div>
                  
                  {dept.budget > 0 && (
                    <div className="detail-row">
                      <span className="label">Budget:</span>
                      <span className="value">${dept.budget.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {dept.location && (
                    <div className="detail-row">
                      <span className="label">Location:</span>
                      <span className="value">{dept.location}</span>
                    </div>
                  )}
                  
                  {dept.head && (
                    <div className="detail-row">
                      <span className="label">Head:</span>
                      <span className="value">
                        {dept.head.firstName} {dept.head.lastName}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="department-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(dept)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(dept._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editMode ? 'Edit Department' : 'Add Department'}</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Department Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Department Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Budget</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editMode ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Departments;
