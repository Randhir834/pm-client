import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../services/api';
import '../../styles/global.css';

const ProjectDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusValue, setStatusValue] = useState('');
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
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
          setProject(null);
          setError(data?.message || 'Unable to load project');
          return;
        }

        setProject(data?.project || null);
        setStatusValue((data?.project?.status || '').trim());
      } catch {
        setProject(null);
        setError('Unable to load project');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    } else {
      setLoading(false);
      setProject(null);
      setError('Invalid project');
    }
  }, [id]);

  const formatDate = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return '';
    }
  };

  const fileItems = useMemo(() => {
    const files = project?.files || [];
    if (!Array.isArray(files)) return [];
    return files.map((f, idx) => {
      return {
        key: f?.filename || `${idx}`,
        label: f?.originalName || f?.filename || 'File',
        filename: f?.filename || ''
      };
    });
  }, [project]);

  const openProjectFile = async (filename) => {
    if (!filename || !id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl(`api/projects/${id}/files/${encodeURIComponent(filename)}`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        return;
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      return;
    }
  };

  const linkItems = useMemo(() => {
    const links = project?.links || [];
    if (!Array.isArray(links)) return [];
    return links
      .filter(l => l && typeof l.url === 'string' && l.url.trim())
      .map((l, idx) => ({
        key: `${idx}`,
        label: (l?.label || '').trim() || l.url,
        url: l.url
      }));
  }, [project]);

  const allowedStatuses = useMemo(() => {
    const base = ['Planned', 'In Design', 'Concept Shared', 'Under Correction'];
    if (isAdmin) {
      return [...base, 'Delivered', 'Client Pending'];
    }
    return base;
  }, [isAdmin]);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading Project..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h2>Project Details</h2>
            <p>{project?.projectId || ''}</p>
          </div>
          <div className="header-actions">
            <div className="header-actions-box">
              {isAdmin && (
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => navigate(`/projects/${id}/edit`)}
                  disabled={!id}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="content-section">
          {error ? (
            <div className="empty-state">
              <h3>{error}</h3>
            </div>
          ) : !project ? (
            <div className="empty-state">
              <h3>Project not found</h3>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <tbody>
                  <tr>
                    <th style={{ width: 'clamp(140px, 25vw, 220px)' }}>Project ID</th>
                    <td>{project.projectId || ''}</td>
                  </tr>
                  <tr>
                    <th>Client</th>
                    <td>{project.clientName || ''}</td>
                  </tr>
                  <tr>
                    <th>Type</th>
                    <td>{project.projectType || ''}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            value={statusValue}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              if (!id || !newStatus || newStatus === project?.status) return;
                              const previousStatus = statusValue;
                              setStatusValue(newStatus);
                              setStatusError('');
                              try {
                                const token = localStorage.getItem('token');
                                const res = await fetch(getApiUrl(`api/projects/${id}/status`), {
                                  method: 'PATCH',
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({ status: newStatus })
                                });
                                const data = await res.json().catch(() => ({}));
                                if (!res.ok) {
                                  setStatusError(data?.message || 'Unable to update status');
                                  setStatusValue(previousStatus);
                                  return;
                                }
                                setProject(data?.project || null);
                                setStatusValue((data?.project?.status || '').trim());
                              } catch {
                                setStatusError('Unable to update status');
                                setStatusValue(previousStatus);
                              }
                            }}
                            style={{
                              width: 'min(100%, 320px)',
                              minWidth: 0,
                              height: 44,
                              padding: '0 12px',
                              fontSize: 16,
                              fontWeight: 500,
                              borderRadius: 10,
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#fff',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {allowedStatuses.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        {statusError ? (
                          <div style={{ color: '#b42318', fontSize: 14 }}>{statusError}</div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>Start Date</th>
                    <td>{formatDate(project.startDate)}</td>
                  </tr>
                  <tr>
                    <th>Deadline</th>
                    <td>{formatDate(project.deadline)}</td>
                  </tr>
                  <tr>
                    <th>Assigned To</th>
                    <td>{project.assignedTo?.name || ''}</td>
                  </tr>
                  <tr>
                    <th>Created By</th>
                    <td>{project.createdBy?.name || ''}</td>
                  </tr>
                  {isAdmin && project.projectValue !== undefined && (
                    <tr>
                      <th>Amount</th>
                      <td>{typeof project.projectValue === 'number' ? project.projectValue.toLocaleString() : project.projectValue}</td>
                    </tr>
                  )}
                  <tr>
                    <th>Description</th>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{project.description || ''}</td>
                  </tr>
                  {linkItems.length > 0 && (
                    <tr>
                      <th>Links</th>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {linkItems.map(l => (
                            <a key={l.key} href={l.url} target="_blank" rel="noreferrer">
                              {l.label}
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {fileItems.length > 0 && (
                    <tr>
                      <th>Files</th>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {fileItems.map(f => (
                            <button
                              key={f.key}
                              type="button"
                              className="btn-secondary"
                              style={{ width: 'fit-content' }}
                              onClick={() => openProjectFile(f.filename)}
                              disabled={!f.filename}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetails;
