import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { API_BASE_URL } from '../../services/api';
import '../../styles/global.css';
import './Attendance.css';

const API_URL = `${API_BASE_URL}/api`;

const MyAttendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    month: '' // For quick month selection
  });
  const [error, setError] = useState('');

  // Handle month selection (same as admin panel)
  const handleMonthChange = (monthValue) => {
    if (monthValue) {
      // monthValue format: "2026-06" (YYYY-MM)
      const [year, month] = monthValue.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of the month
      
      setFilters({
        ...filters,
        month: monthValue,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
    } else {
      // Clear month filter
      setFilters({
        ...filters,
        month: ''
      });
    }
  };

  useEffect(() => {
    // Only fetch if user is available
    if (user && user.id) {
      fetchMyAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, user]);

  const fetchMyAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      setError(''); // Clear previous errors
      
      // Check if user and user.id are available
      if (!user || !user.id) {
        console.error('User ID not available:', user);
        setError('User information not available. Please refresh the page.');
        return;
      }
      
      // Fetch attendance records using the SAME API as admin panel
      // Just with employee filter set to current user's ID
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        employee: user.id, // Use user.id (not user._id)
        limit: 1000
      });
      
      console.log('🔍 Fetching attendance for user:', user.id);
      console.log('📅 Date range:', filters.startDate, 'to', filters.endDate);
      
      const attendanceRes = await fetch(
        `${API_URL}/attendance?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const attendanceData = await attendanceRes.json();
      
      console.log('📦 Attendance response:', attendanceData);
      
      if (attendanceData.success) {
        // Filter out any records without employee data to prevent display errors
        // (same validation as admin panel)
        const validRecords = attendanceData.attendance.filter(record => record.employee);
        setAttendanceRecords(validRecords);
        console.log('✅ Loaded', validRecords.length, 'attendance records');
      } else {
        setError(attendanceData.message || 'Failed to load attendance data');
      }

    } catch (error) {
      console.error('❌ Error fetching attendance:', error);
      setError('Failed to load attendance data');
    } finally {
      // Only set loading false on initial load
      if (loading) {
        setLoading(false);
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return '#43e97b';
      case 'Absent': return '#ff6b6b';
      case 'Half Day': return '#ffd93d';
      case 'On Leave': return '#a8dadc';
      case 'Holiday': return '#457b9d';
      case 'Weekend': return '#6c757d';
      default: return '#95a5a6';
    }
  };

  // Loading state
  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="dashboard-container attendance-container">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h2>My Attendance</h2>
            <p>View your attendance records</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, maxWidth: '400px' }}>
            {error}
            <button onClick={() => setError('')} className="alert-close">×</button>
          </div>
        )}

        {/* Filters - Same structure as admin panel but simplified */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Quick Select Month:</label>
            <input 
              type="month" 
              value={filters.month}
              onChange={(e) => handleMonthChange(e.target.value)}
              placeholder="Select Month"
            />
          </div>
          <div className="filter-group">
            <label>Start Date:</label>
            <input 
              type="date" 
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value, month: ''})}
            />
          </div>
          <div className="filter-group">
            <label>End Date:</label>
            <input 
              type="date" 
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value, month: ''})}
            />
          </div>
        </div>

        {/* Records Table - Same structure as admin panel */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="2" className="no-data">No attendance records found</td>
                </tr>
              ) : (
                attendanceRecords.filter(record => record.employee).map((record) => (
                  <tr key={record._id}>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ background: getStatusColor(record.status) }}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default MyAttendance;
