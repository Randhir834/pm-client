import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useCachedApi } from '../../hooks/useCachedApi';
import '../../styles/global.css';
import './Dashboard.css';

const DashboardProjects = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data, loading } = useCachedApi('api/projects', { ttlMs: 30_000 });

  const projects = useMemo(() => {
    return data?.projects || [];
  }, [data]);

  const metrics = useMemo(() => {
    const totalProjects = projects.length;

    const activeStatuses = ['in design', 'concept shared', 'under correction', 'in progress'];
    const activeProjects = projects.filter(p => activeStatuses.includes((p.status || '').toLowerCase())).length;
    const closedProjects = projects.filter(p => (p.status || '').toLowerCase() === 'delivered').length;

    const totalRevenue = projects.reduce((sum, p) => {
      if (typeof p.projectValue !== 'number') return sum;
      if ((p.status || '').toLowerCase() !== 'delivered') return sum;
      return sum + p.projectValue;
    }, 0);

    const outstandingAmount = projects.reduce((sum, p) => {
      if (typeof p.projectValue !== 'number') return sum;
      const received =
        typeof p.amountReceived === 'number'
          ? p.amountReceived
          : typeof p.paidAmount === 'number'
            ? p.paidAmount
            : 0;
      const remaining = Math.max(0, p.projectValue - received);
      return sum + remaining;
    }, 0);

    const now = Date.now();
    const overdueProjects = projects.reduce((count, p) => {
      const status = (p.status || '').toLowerCase();
      if (status === 'completed' || status === 'cancelled') return count;
      const deadline = p.deadline ? new Date(p.deadline).getTime() : NaN;
      if (!Number.isFinite(deadline)) return count;
      return deadline < now ? count + 1 : count;
    }, 0);

    const dueSoonProjects = projects.reduce((count, p) => {
      const status = (p.status || '').toLowerCase();
      if (status === 'completed' || status === 'cancelled') return count;
      const deadline = p.deadline ? new Date(p.deadline).getTime() : NaN;
      if (!Number.isFinite(deadline)) return count;
      const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7 ? count + 1 : count;
    }, 0);

    const recentProjects = [...projects]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);

    return {
      totalProjects,
      activeProjects,
      closedProjects,
      totalRevenue,
      outstandingAmount,
      overdueProjects,
      dueSoonProjects,
      recentProjects
    };
  }, [projects]);

  const formatMoney = (value) => {
    if (!Number.isFinite(value)) return '';
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading Dashboard..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h2>Welcome back, {user && user.name}!</h2>
            <p>Here’s a quick snapshot of your projects.</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>Total</h3>
              <p className="stat-number">{metrics.totalProjects}</p>
              <span className="stat-change positive">All projects visible to you</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 11h4v-2h-3V7h-2v6z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>Active</h3>
              <p className="stat-number">{metrics.activeProjects}</p>
              <span className="stat-change positive">Currently in progress</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>Closed</h3>
              <p className="stat-number">{metrics.closedProjects}</p>
              <span className="stat-change positive">Delivered</span>
            </div>
          </div>

          {isAdmin && (
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm1 17.93c-3.39-.49-6-3.4-6-6.93V6.3l6-2.67V18.93z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>Revenue</h3>
                <p className="stat-number">{formatMoney(metrics.totalRevenue)}</p>
                <span className="stat-change positive">Sum of project values</span>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm1.07-7.75l-.9.92A1.5 1.5 0 0012 12.5V13h-2v-.5a3.5 3.5 0 011.03-2.48l1.24-1.26A1.5 1.5 0 0011.5 6a1.5 1.5 0 00-1.5 1.5H8A3.5 3.5 0 0111.5 4 3.5 3.5 0 0115 7.5a3.47 3.47 0 01-.93 2.43z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>Outstanding</h3>
                <p className="stat-number">{formatMoney(metrics.outstandingAmount)}</p>
                <span className="stat-change positive">Remaining amount</span>
              </div>
            </div>
          )}

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ff5858 0%, #f09819 100%)' }}>
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm5 11H7v-2h10z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>Overdue</h3>
              <p className="stat-number">{metrics.overdueProjects}</p>
              <span className="stat-change positive">Past deadline</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>This Week</h3>
              <p className="stat-number">{metrics.dueSoonProjects}</p>
              <span className="stat-change positive">Deadline in 7 days</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Projects</h3>
              <button className="btn-text" onClick={() => navigate('/projects')}>View all</button>
            </div>
            <div className="activity-list">
              {metrics.recentProjects.length > 0 ? (
                metrics.recentProjects.map((p) => (
                  <div key={p._id || p.projectId} className="activity-item" onClick={() => navigate('/projects')}>
                    <div className="activity-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M10 16.5l6-4.5-6-4.5v9z" />
                      </svg>
                    </div>
                    <div className="activity-content">
                      <p className="activity-message">{p.clientName || 'Client'} • {p.projectType || 'Project'}</p>
                      <p className="activity-details">Status: {p.status || 'Planned'}{p.assignedTo?.name ? ` • Assigned: ${p.assignedTo.name}` : ''}</p>
                      <span className="activity-time">{p.deadline ? `Deadline: ${new Date(p.deadline).toLocaleDateString()}` : ''}</span>
                    </div>
                    {p.status && (
                      <div className="activity-status">
                        <span className={`status-badge status-${String(p.status).toLowerCase().replace(/\s+/g, '-')}`}>{p.status}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-activity">
                  <div className="empty-icon">📁</div>
                  <p>No projects yet</p>
                  <span>Create your first project to see KPIs here.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardProjects;
