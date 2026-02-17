import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useCachedApi } from '../../hooks/useCachedApi';
import '../../styles/global.css';
import './Delivered.css';

const Delivered = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data, loading } = useCachedApi('api/projects/delivered', { ttlMs: 30_000 });
  const projects = data?.projects || [];
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  const formatDate = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const filteredProjects = projects.filter(project => {
    const projectDate = new Date(project.startDate || project.deadline);

    switch (filterType) {
      case 'date':
        if (!filterDate) return true;
        const filterDateObj = new Date(filterDate);
        return projectDate.toDateString() === filterDateObj.toDateString();

      case 'month':
        if (!filterMonth) return true;
        const [year, month] = filterMonth.split('-');
        return projectDate.getFullYear() === parseInt(year) &&
               projectDate.getMonth() === parseInt(month) - 1;

      case 'year':
        if (!filterYear) return true;
        return projectDate.getFullYear() === parseInt(filterYear);

      case 'range':
        if (!dateRangeStart || !dateRangeEnd) return true;
        const start = new Date(dateRangeStart);
        const end = new Date(dateRangeEnd);
        end.setHours(23, 59, 59, 999);
        return projectDate >= start && projectDate <= end;

      case 'all':
      default:
        return true;
    }
  });

  const getFilterIcon = () => {
    const icons = {
      all: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
      date: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>,
      month: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      year: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      range: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M17 14h6"/><path d="M20 11v6"/><path d="M1 14h6"/></svg>
    };
    return icons[filterType] || icons.all;
  };

  const goToProject = (projectId) => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading Delivered Projects..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header delivered-header">
          <div className="welcome-section">
            <h2>Delivered Projects</h2>
            <p>View all delivered projects with complete details.</p>
          </div>

          <div className="filter-section">
            <div className="filter-wrapper">
              <div className="filter-main">
                <div className="filter-icon-wrapper">
                  {getFilterIcon()}
                </div>
                <select
                  id="filter-type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Projects</option>
                  <option value="date">Specific Date</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="range">Date Range</option>
                </select>
              </div>

              <div className={`filter-inputs-container ${filterType !== 'all' ? 'expanded' : ''}`}>
                {filterType === 'date' && (
                  <div className="filter-input-group animate-in">
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="filter-input"
                      placeholder="Select date"
                    />
                  </div>
                )}

                {filterType === 'month' && (
                  <div className="filter-input-group animate-in">
                    <input
                      type="month"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                )}

                {filterType === 'year' && (
                  <div className="filter-input-group animate-in">
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="filter-input"
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - 5 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {filterType === 'range' && (
                  <div className="filter-range-group animate-in">
                    <input
                      type="date"
                      value={dateRangeStart}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                      className="filter-input"
                      placeholder="From"
                    />
                    <span className="range-separator">→</span>
                    <input
                      type="date"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      className="filter-input"
                      placeholder="To"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">

          {filteredProjects.length > 0 ? (
            <div className="delivered-grid">
              {filteredProjects.map(project => (
                <div
                  key={project._id}
                  className="delivered-card"
                  onClick={() => goToProject(project._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goToProject(project._id);
                    }
                  }}
                >
                  <div className="delivered-card-header">
                    <div className="project-id">{project.projectId}</div>
                    <div className="status-badge">Delivered</div>
                  </div>

                  <div className="delivered-card-body">
                    <div className="card-section">
                      <h4 className="section-title">Client Information</h4>
                      <div className="detail-row">
                        <span className="detail-label">Client Name:</span>
                        <span className="detail-value">{project.clientName || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Project Type:</span>
                        <span className="detail-value">{project.projectType || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="card-section">
                      <h4 className="section-title">Assignment</h4>
                      <div className="detail-row">
                        <span className="detail-label">Assigned To:</span>
                        <span className="detail-value">{project.assignedTo?.name || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Created By:</span>
                        <span className="detail-value">{project.createdBy?.name || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="card-section">
                      <h4 className="section-title">Timeline</h4>
                      <div className="detail-row">
                        <span className="detail-label">Start Date:</span>
                        <span className="detail-value">{formatDate(project.startDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Deadline:</span>
                        <span className="detail-value">{formatDate(project.deadline)}</span>
                      </div>
                    </div>

                    {isAdmin && project.projectValue !== undefined && (
                      <div className="card-section amount-section">
                        <h4 className="section-title">Financial</h4>
                        <div className="detail-row">
                          <span className="detail-label">Amount:</span>
                          <span className="detail-value amount-value">{formatCurrency(project.projectValue)}</span>
                        </div>
                      </div>
                    )}

                    {project.description && (
                      <div className="card-section">
                        <h4 className="section-title">Description</h4>
                        <p className="description-text">{project.description}</p>
                      </div>
                    )}

                    {(project.links?.length > 0 || project.files?.length > 0) && (
                      <div className="card-section">
                        <h4 className="section-title">Attachments</h4>
                        {project.links?.length > 0 && (
                          <div className="attachment-group">
                            <span className="attachment-label">Links:</span>
                            <span className="attachment-count">{project.links.length}</span>
                          </div>
                        )}
                        {project.files?.length > 0 && (
                          <div className="attachment-group">
                            <span className="attachment-label">Files:</span>
                            <span className="attachment-count">{project.files.length}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="delivered-card-footer">
                    <span className="view-details">Click to view full details</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
              </div>
              <h3>No delivered projects found</h3>
              <p>{isAdmin ? 'Projects marked as Delivered will appear here.' : 'No delivered projects assigned to you yet.'}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Delivered;
