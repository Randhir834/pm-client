import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../services/api';
import '../../styles/global.css';
import './AddProject.css';

const AddProject = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const [clientName, setClientName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [projectValue, setProjectValue] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');

  const [links, setLinks] = useState([{ label: '', url: '' }]);

  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      clientName.trim() &&
      projectType.trim() &&
      startDate &&
      deadline &&
      projectValue !== '' &&
      assignedTo
    );
  }, [clientName, projectType, startDate, deadline, projectValue, assignedTo]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(getApiUrl('api/auth/users/list'), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        } else {
          setUsers([]);
        }
      } catch {
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/projects" replace />;
  }

  if (isLoadingUsers) {
    return (
      <Layout>
        <LoadingSpinner message="Loading..." />
      </Layout>
    );
  }

  const onAddLinkRow = () => {
    setLinks(prev => [...prev, { label: '', url: '' }]);
  };

  const onRemoveLinkRow = (index) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const onUpdateLinkRow = (index, key, value) => {
    setLinks(prev => prev.map((l, i) => (i === index ? { ...l, [key]: value } : l)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');

      const payloadLinks = links
        .map(l => ({ label: (l.label || '').trim(), url: (l.url || '').trim() }))
        .filter(l => l.url);

      const form = new FormData();
      form.append('clientName', clientName.trim());
      form.append('projectType', projectType.trim());
      form.append('startDate', startDate);
      form.append('deadline', deadline);
      form.append('projectValue', projectValue);
      form.append('assignedTo', assignedTo);
      form.append('description', description);
      form.append('links', JSON.stringify(payloadLinks));

      const res = await fetch(getApiUrl('api/projects'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      if (res.ok) {
        navigate('/projects');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard-container add-project-page">
        <div className="dashboard-header add-project-header">
          <div className="welcome-section">
            <h2>Add New Project</h2>
            <p>Create a project, assign it to a person, and attach files/links.</p>
          </div>
        </div>

        <div className="add-project-surface">
          <div className="add-project-surface-inner">
            <form onSubmit={handleSubmit}>
              <div className="add-project-grid">
                <div className="add-project-section">
                  <div className="card-header"><h3>Project Details</h3></div>
                  <div className="add-project-section-body">
                    <div className="add-project-form-grid">
                      <div className="form-group">
                        <label>Client Name</label>
                        <input
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Project Type</label>
                        <input
                          value={projectType}
                          onChange={(e) => setProjectType(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label>Deadline</label>
                        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label>Project Value (Amount)</label>
                        <input
                          type="number"
                          min="0"
                          value={projectValue}
                          onChange={(e) => setProjectValue(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Assigned Person</label>
                        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                          <option value="">Select user</option>
                          {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group span-2">
                        <label>Description</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={5}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="add-project-section">
                  <div className="card-header"><h3>Files & Links</h3></div>
                  <div className="add-project-section-body">
                    <div className="form-group">
                      <label>Links</label>
                      <div className="add-project-links">
                        {links.map((l, index) => (
                          <div key={index} className="add-project-link-row">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Label</label>
                              <input
                                value={l.label}
                                onChange={(e) => onUpdateLinkRow(index, 'label', e.target.value)}
                              />
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>URL</label>
                              <input
                                value={l.url}
                                onChange={(e) => onUpdateLinkRow(index, 'url', e.target.value)}
                              />
                            </div>

                            <div className="add-project-link-actions">
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => onRemoveLinkRow(index)}
                                disabled={links.length === 1}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}

                        <button type="button" className="btn-secondary" onClick={onAddLinkRow}>
                          Add Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="add-project-footer">
                <button type="submit" className="btn-primary" disabled={!canSubmit || submitting}>
                  {submitting ? 'Saving...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddProject;
