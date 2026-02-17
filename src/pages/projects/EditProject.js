import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../services/api';
import '../../styles/global.css';
import './AddProject.css';

const EditProject = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [error, setError] = useState('');

  const [clientName, setClientName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [projectValue, setProjectValue] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');

  const [files, setFiles] = useState([]);
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

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        setError('Invalid project');
        setIsLoadingProject(false);
        return;
      }

      setIsLoadingProject(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(getApiUrl(`api/projects/${id}`), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message || 'Unable to load project');
          return;
        }

        const p = data?.project;
        setClientName((p?.clientName || '').toString());
        setProjectType((p?.projectType || '').toString());

        const toDateInput = (value) => {
          if (!value) return '';
          try {
            return new Date(value).toISOString().slice(0, 10);
          } catch {
            return '';
          }
        };

        setStartDate(toDateInput(p?.startDate));
        setDeadline(toDateInput(p?.deadline));
        setProjectValue(p?.projectValue !== undefined && p?.projectValue !== null ? String(p.projectValue) : '');
        setAssignedTo(p?.assignedTo?._id || '');
        setDescription((p?.description || '').toString());

        const existingLinks = Array.isArray(p?.links) ? p.links : [];
        const normalizedLinks = existingLinks
          .filter(l => l && typeof l.url === 'string' && l.url.trim())
          .map(l => ({ label: (l.label || '').toString(), url: (l.url || '').toString() }));

        setLinks(normalizedLinks.length > 0 ? normalizedLinks : [{ label: '', url: '' }]);
      } catch {
        setError('Unable to load project');
      } finally {
        setIsLoadingProject(false);
      }
    };

    if (isAdmin) {
      fetchProject();
    }
  }, [id, isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/projects" replace />;
  }

  if (isLoadingUsers || isLoadingProject) {
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
    if (!canSubmit || submitting || !id) return;

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

      files.forEach(f => form.append('files', f));

      const res = await fetch(getApiUrl(`api/projects/${id}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || 'Unable to update project');
        return;
      }

      navigate(`/projects/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard-container add-project-page">
        <div className="dashboard-header add-project-header">
          <div className="welcome-section">
            <h2>Edit Project</h2>
            <p>Update project details, assignment, and attach files/links.</p>
          </div>
        </div>

        <div className="add-project-surface">
          <div className="add-project-surface-inner">
            {error ? (
              <div className="empty-state">
                <h3>{error}</h3>
              </div>
            ) : (
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
                        <label>Upload Files</label>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        />
                        {files.length > 0 && (
                          <ul className="add-project-files-list">
                            {files.map((f, i) => (
                              <li key={`${f.name}_${i}`}>{f.name}</li>
                            ))}
                          </ul>
                        )}
                      </div>

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
                    {submitting ? 'Saving...' : 'Update Project'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditProject;
