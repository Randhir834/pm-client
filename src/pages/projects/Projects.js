import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useCachedApi } from '../../hooks/useCachedApi';
import '../../styles/global.css';

const Projects = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data, loading } = useCachedApi('api/projects', { ttlMs: 30_000 });
  const projects = useMemo(() => {
    return data?.projects || [];
  }, [data]);
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns = useMemo(() => {
    const base = [
      { key: 'projectId', label: 'PROJECT ID' },
      { key: 'clientName', label: 'CLIENT' },
      { key: 'projectType', label: 'TYPE' },
      { key: 'assignedTo', label: 'ASSIGNED TO' },
      { key: 'status', label: 'STATUS' },
      { key: 'startDate', label: 'START DATE' },
      { key: 'deadline', label: 'DEADLINE' }
    ];

    if (isAdmin) {
      base.push({ key: 'projectValue', label: 'AMOUNT' });
    }

    return base;
  }, [isAdmin]);

  const formatDate = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'In Design': { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
      'Concept Shared': { bg: '#e0e7ff', color: '#3730a3', border: '#a5b4fc' },
      'Under Correction': { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
      'Delivered': { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
      'Closed': { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
      'Client Pending': { bg: '#fce7f3', color: '#9d174d', border: '#f9a8d4' },
      'Planned': { bg: '#e0f2fe', color: '#075985', border: '#7dd3fc' },
      'In Progress': { bg: '#cffafe', color: '#155e75', border: '#67e8f9' },
      'On Hold': { bg: '#ffedd5', color: '#9a3412', border: '#fdba74' },
      'Completed': { bg: '#dcfce7', color: '#166534', border: '#86efac' },
      'Cancelled': { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
    };

    const style = statusColors[status] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 600,
          backgroundColor: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
          whiteSpace: 'nowrap'
        }}
      >
        {status || 'Unknown'}
      </span>
    );
  };

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set();
    projects.forEach(p => {
      if (p.assignedTo?.name) assignees.add(p.assignedTo.name);
    });
    return Array.from(assignees).sort();
  }, [projects]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    projects.forEach(p => {
      if (p.status) statuses.add(p.status);
    });
    if (!Array.from(statuses).some((s) => String(s).toLowerCase() === 'planned')) {
      statuses.add('Planned');
    }
    const statusOrder = [
      'Planned',
      'In Design',
      'Concept Shared',
      'Under Correction',
      'In Progress',
      'On Hold',
      'Client Pending',
      'Delivered',
      'Closed',
      'Completed',
      'Cancelled'
    ];

    const normalized = new Map(
      statusOrder.map((s) => [String(s).toLowerCase(), s])
    );

    const canonicalStatuses = new Set(
      Array.from(statuses).map((s) => normalized.get(String(s).toLowerCase()) || s)
    );

    const ordered = statusOrder.filter((s) => canonicalStatuses.has(s));
    const remaining = Array.from(canonicalStatuses)
      .filter((s) => !statusOrder.includes(s))
      .sort();

    return [...ordered, ...remaining];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchAssignee = !assignedToFilter || project.assignedTo?.name === assignedToFilter;
      const matchStatus = !statusFilter || project.status === statusFilter;
      return matchAssignee && matchStatus;
    });
  }, [projects, assignedToFilter, statusFilter]);

  const goToProject = (project) => {
    if (!project?._id) return;
    navigate(`/projects/${project._id}`);
  };

  const handleClearFilters = () => {
    setAssignedToFilter('');
    setStatusFilter('');
  };

  const handleExport = async () => {
    if (filteredProjects.length === 0) return;

    const exportData = filteredProjects.map(project => ({
      'PROJECT ID': project.projectId || '',
      'CLIENT': project.clientName || '',
      'TYPE': project.projectType || '',
      'ASSIGNED TO': project.assignedTo?.name || '',
      'STATUS': project.status || '',
      'START DATE': project.startDate ? new Date(project.startDate).toLocaleDateString() : '',
      'DEADLINE': project.deadline ? new Date(project.deadline).toLocaleDateString() : '',
      'AMOUNT': project.projectValue || 0
    }));

    const XLSX = await import('xlsx');
    const xlsx = XLSX?.default || XLSX;

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Projects');
    xlsx.writeFile(workbook, `Projects_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading Projects..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h2>Projects</h2>
            <p>Manage your projects here.</p>
          </div>
          <div className="header-actions">
            {isAdmin && (
              <div className="header-actions-box">
                <div className="export-filters">
                  <div className="filter-group">
                    <select
                      value={assignedToFilter}
                      onChange={(e) => setAssignedToFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Assigned To</option>
                      {uniqueAssignees.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Status</option>
                      {uniqueStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  {(assignedToFilter || statusFilter) && (
                    <button
                      className="btn-clear"
                      onClick={handleClearFilters}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button className="btn-secondary" onClick={handleExport} disabled={filteredProjects.length === 0}>
                  Export
                </button>
                <button className="btn-primary" onClick={() => navigate('/projects/new')}>
                  Add New Project
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="content-section">
          <div className="table-container">
            {filteredProjects.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => (
                    <tr
                      key={project._id || project.projectId}
                      onClick={() => goToProject(project)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          goToProject(project);
                        }
                      }}
                      style={{ cursor: project?._id ? 'pointer' : 'default' }}
                    >
                      {columns.map(col => {
                        if (col.key === 'assignedTo') {
                          return (
                            <td key={col.key}>
                              {project.assignedTo?.name || ''}
                            </td>
                          );
                        }

                        if (col.key === 'startDate') {
                          return <td key={col.key}>{formatDate(project.startDate)}</td>;
                        }

                        if (col.key === 'deadline') {
                          return <td key={col.key}>{formatDate(project.deadline)}</td>;
                        }

                        if (col.key === 'projectValue') {
                          return <td key={col.key}>{typeof project.projectValue === 'number' ? project.projectValue.toLocaleString() : ''}</td>;
                        }

                        if (col.key === 'status') {
                          return <td key={col.key}>{getStatusBadge(project.status)}</td>;
                        }

                        return <td key={col.key}>{project[col.key] || ''}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z"/>
                  </svg>
                </div>
                <h3>No projects found</h3>
                <p>{isAdmin ? 'Create your first project to get started.' : 'No projects assigned to you yet.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Projects;
