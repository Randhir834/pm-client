import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { API_BASE_URL } from '../../services/api';
import '../../styles/global.css';
import './Attendance.css';

const API_URL = `${API_BASE_URL}/api`;

const Attendance = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('records');
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '',
    employee: '',
    month: '' // For quick month selection
  });
  const [showManageModal, setShowManageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [manageDate, setManageDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employeesForManage, setEmployeesForManage] = useState([]);
  const [selectedAttendance, setSelectedAttendance] = useState({}); // Store selected status for each employee
  const [isSaving, setIsSaving] = useState(false); // Track save state

  // Handle month selection
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
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (showManageModal) {
      fetchEmployeesForManage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showManageModal, manageDate]);

  const fetchData = async () => {
    try {
      // Don't show loading spinner for refresh - only for initial load
      const token = localStorage.getItem('token');
      setError(''); // Clear previous errors
      
      // Fetch attendance stats
      const statsRes = await fetch(
        `${API_URL}/attendance/stats/overview?startDate=${filters.startDate}&endDate=${filters.endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Fetch attendance records
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.status && { status: filters.status }),
        ...(filters.employee && { employee: filters.employee }),
        limit: 100
      });
      
      const attendanceRes = await fetch(
        `${API_URL}/attendance?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const attendanceData = await attendanceRes.json();
      if (attendanceData.success) {
        // Filter out any records without employee data to prevent display errors
        const validRecords = attendanceData.attendance.filter(record => record.employee);
        setAttendanceRecords(validRecords);
      }

      // Fetch users for filters (admin only) - same as Employee Management
      if (isAdmin) {
        const usersRes = await fetch(`${API_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        
        if (usersData.users) {
          // Filter to get only users with role 'user' (exclude admins)
          let users = usersData.users.filter(user => user.role === 'user' && user.isActive);
          
          // Transform users to employee format for the filter dropdown
          const transformedUsers = users.map(user => {
            const nameParts = user.name.trim().split(' ');
            const firstName = nameParts[0] || user.name;
            const lastName = nameParts.slice(1).join(' ') || '';
            
            return {
              _id: user._id,
              firstName: firstName,
              lastName: lastName,
              email: user.email
            };
          });
          
          setEmployees(transformedUsers);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load attendance data');
    } finally {
      // Only set loading false on initial load
      if (loading) {
        setLoading(false);
      }
    }
  };

  const fetchEmployeesForManage = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('🔍 Fetching users for attendance management...');
      console.log('🔑 Token exists:', !!token);
      console.log('👤 Current user role:', isAdmin ? 'admin' : 'user');
      
      // Check if user is admin
      if (!isAdmin) {
        console.warn('⚠️ User is not admin, cannot fetch all users');
        setError('You need admin privileges to manage attendance');
        setEmployeesForManage([]);
        return;
      }
      
      // Fetch all registered users directly from auth/users endpoint (same as Employee Management)
      const usersRes = await fetch(`${API_URL}/auth/users`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Users API response status:', usersRes.status);
      console.log('📡 Users API response URL:', `${API_URL}/auth/users`);
      
      if (!usersRes.ok) {
        const errorText = await usersRes.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to fetch users: ${usersRes.status} ${usersRes.statusText}`);
      }
      
      const usersData = await usersRes.json();
      console.log('📦 Users data received:', usersData);
      
      if (usersData.users && Array.isArray(usersData.users)) {
        console.log('👥 Total users fetched:', usersData.users.length);
        
        // Filter to get only users with role 'user' (exclude admins)
        let users = usersData.users.filter(user => user.role === 'user' && user.isActive);
        console.log('✅ Filtered users (role=user, active):', users.length);
        
        // Fetch attendance records for the selected date
        const attendanceRes = await fetch(
          `${API_URL}/attendance?startDate=${manageDate}&endDate=${manageDate}&limit=1000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const attendanceData = await attendanceRes.json();
        console.log('📅 Attendance data for date:', manageDate, attendanceData);
        
        // Create a map of employee attendance records
        const attendanceMap = {};
        if (attendanceData.success) {
          attendanceData.attendance.forEach(record => {
            if (record.employee && record.employee._id) {
              attendanceMap[record.employee._id] = record;
            }
          });
        }
        console.log('🗺️  Attendance map created with', Object.keys(attendanceMap).length, 'records');
        
        // Transform users to employee format and merge with attendance records
        const employeesWithAttendance = users.map(user => {
          // Split name into first and last name
          const nameParts = user.name.trim().split(' ');
          const firstName = nameParts[0] || user.name;
          const lastName = nameParts.slice(1).join(' ') || '';
          
          return {
            _id: user._id,
            employeeId: `USER${user._id.toString().slice(-8).toUpperCase()}`,
            firstName: firstName,
            lastName: lastName,
            email: user.email,
            designation: user.designation || 'User',
            department: 'General',
            attendanceRecord: attendanceMap[user._id] || null
          };
        });
        
        console.log('✨ Final employees with attendance:', employeesWithAttendance.length);
        setEmployeesForManage(employeesWithAttendance);
        
        // Clear any previous errors
        if (employeesWithAttendance.length > 0) {
          setError('');
        }
      } else {
        console.warn('⚠️ No users array in response:', usersData);
        setEmployeesForManage([]);
        setError('No users found in the system');
      }
    } catch (error) {
      console.error('❌ Error fetching employees for manage:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      setError(`Failed to load users: ${error.message}`);
      setEmployeesForManage([]);
    }
  };

  const handleEditAttendance = (record) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleUpdateAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/attendance/${editingRecord._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          checkIn: editingRecord.checkIn,
          checkOut: editingRecord.checkOut,
          status: editingRecord.status,
          notes: editingRecord.notes
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccess('Attendance updated successfully!');
        setShowEditModal(false);
        setEditingRecord(null);
        // Refresh both the main table and manage modal
        await fetchData();
        if (showManageModal) {
          await fetchEmployeesForManage();
        }
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      setError('Failed to update attendance');
    }
  };

  const handleDeleteAttendance = async (attendanceId) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/attendance/${attendanceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccess('Attendance deleted successfully!');
        // Refresh both the main table and manage modal immediately
        await fetchData();
        await fetchEmployeesForManage();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete attendance');
    }
  };

  const handleQuickMarkAttendance = async (employeeId, status) => {
    // This is now just for updating existing records
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employee: employeeId,
          date: manageDate,
          status: status,
          checkIn: status === 'Present' ? new Date(`${manageDate}T09:00:00`) : undefined,
          checkOut: status === 'Present' ? new Date(`${manageDate}T18:00:00`) : undefined
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccess(`Attendance marked as ${status}!`);
        // Refresh both the main table and manage modal immediately
        await fetchData();
        await fetchEmployeesForManage();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Quick mark error:', error);
      setError('Failed to mark attendance');
    }
  };

  // Handle status selection for an employee
  const handleStatusSelect = (employeeId, status) => {
    setSelectedAttendance(prev => ({
      ...prev,
      [employeeId]: status
    }));
  };

  // Save all selected attendance at once
  const handleSaveAllAttendance = async () => {
    const selectedEmployees = Object.keys(selectedAttendance);
    
    if (selectedEmployees.length === 0) {
      setError('Please select attendance status for at least one employee');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsSaving(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      let errorCount = 0;

      // Process each selected employee
      for (const employeeId of selectedEmployees) {
        const status = selectedAttendance[employeeId];
        
        try {
          const res = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              employee: employeeId,
              date: manageDate,
              status: status,
              checkIn: status === 'Present' ? new Date(`${manageDate}T09:00:00`) : undefined,
              checkOut: status === 'Present' ? new Date(`${manageDate}T18:00:00`) : undefined
            })
          });

          const data = await res.json();
          
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      // Refresh data
      await fetchData();
      await fetchEmployeesForManage();
      
      // Clear selections
      setSelectedAttendance({});
      
      // Show result
      if (errorCount === 0) {
        setSuccess(`✅ Successfully marked attendance for ${successCount} employee(s)!`);
      } else {
        setSuccess(`✅ Marked ${successCount} employee(s). ${errorCount} failed.`);
      }
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Save all error:', error);
      setError('Failed to save attendance records');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset selections when modal opens
  const handleOpenManageModal = () => {
    setSelectedAttendance({});
    setShowManageModal(true);
  };

  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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

  const exportToCSV = () => {
    const headers = ['Date', 'ID', 'Employee', 'Status'];
    
    // Function to properly escape CSV values
    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return 'N/A';
      const stringValue = String(value);
      // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = attendanceRecords.filter(record => record.employee).map(record => [
      escapeCsvValue(formatDate(record.date)),
      escapeCsvValue(record.employee?.employeeId || 'N/A'),
      escapeCsvValue(record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'N/A'),
      escapeCsvValue(record.status)
    ]);

    // Create CSV with proper formatting
    const csvContent = [headers.map(h => escapeCsvValue(h)), ...rows].map(row => row.join(',')).join('\n');
    
    // Add BOM for proper Excel encoding
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${filters.startDate}_to_${filters.endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // Create a simple HTML report and print it
    const printWindow = window.open('', '', 'height=600,width=800');
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2c3e50; text-align: center; margin-bottom: 10px; }
          .meta { text-align: center; color: #7f8c8d; margin-bottom: 30px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
          th { background-color: #6366f1; color: white; font-weight: 600; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .status { 
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }
          .status-present { background-color: #43e97b; color: white; }
          .status-absent { background-color: #ff6b6b; color: white; }
          .status-halfday { background-color: #ffd93d; color: #333; }
          .status-onleave { background-color: #a8dadc; color: white; }
        </style>
      </head>
      <body>
        <h1>Attendance Report</h1>
        <div class="meta">
          <p><strong>Period:</strong> ${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}</p>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Records:</strong> ${attendanceRecords.filter(record => record.employee).length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>ID</th>
              <th>Employee</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${attendanceRecords.filter(record => record.employee).map(record => {
              const statusClass = record.status.toLowerCase().replace(' ', '');
              return `
              <tr>
                <td>${formatDate(record.date)}</td>
                <td>${record.employee?.employeeId || 'N/A'}</td>
                <td>${record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'N/A'}</td>
                <td><span class="status status-${statusClass}">${record.status}</span></td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Loading state
  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="dashboard-container attendance-container">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h2>Attendance Management</h2>
            <p>Track employee attendance and work hours</p>
          </div>
          {isAdmin && (
            <div className="header-actions">
              <button 
                className="btn btn-primary"
                onClick={handleOpenManageModal}
              >
                <span className="icon">📅</span>
                Manage Attendance
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-error" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, maxWidth: '400px' }}>
            {error}
            <button onClick={() => setError('')} className="alert-close">×</button>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, maxWidth: '400px' }}>
            {success}
            <button onClick={() => setSuccess('')} className="alert-close">×</button>
          </div>
        )}

        {/* Filters */}
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
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
              <option value="On Leave">On Leave</option>
              <option value="Holiday">Holiday</option>
              <option value="Weekend">Weekend</option>
            </select>
          </div>
          {isAdmin && (
            <>
              <div className="filter-group">
                <label>Employee:</label>
                <select 
                  value={filters.employee}
                  onChange={(e) => setFilters({...filters, employee: e.target.value})}
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <span className="icon">📥</span>
            CSV
          </button>
          <button className="btn btn-secondary" onClick={exportToPDF}>
            <span className="icon">📄</span>
            PDF
          </button>
        </div>

        {/* Records Table */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>ID</th>
                    {isAdmin && <th>Employee</th>}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? "4" : "3"} className="no-data">No attendance records found</td>
                    </tr>
                  ) : (
                    attendanceRecords.filter(record => record.employee).map((record) => (
                      <tr key={record._id}>
                        <td>{formatDate(record.date)}</td>
                        <td>{record.employee?.employeeId || 'N/A'}</td>
                        {isAdmin && (
                          <td>
                            <strong>{record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'N/A'}</strong>
                          </td>
                        )}
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

        {/* Manage Attendance Modal */}
        {showManageModal && (
          <div className="modal-overlay" onClick={() => setShowManageModal(false)}>
            <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Manage Attendance</h3>
                <button onClick={() => setShowManageModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Date</label>
                  <input 
                    type="date" 
                    value={manageDate}
                    onChange={(e) => setManageDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>All Employees ({employeesForManage.length} employees)</label>
                  <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Select Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeesForManage.length === 0 ? (
                          <tr>
                            <td colSpan="2" className="no-data">No employees found</td>
                          </tr>
                        ) : (
                          employeesForManage.map(emp => {
                            const record = emp.attendanceRecord;
                            const selectedStatus = selectedAttendance[emp._id];
                            
                            return (
                              <tr key={emp._id}>
                                <td>
                                  <div className="employee-cell">
                                    <strong>{emp.firstName} {emp.lastName}</strong>
                                    <small>{emp.employeeId}</small>
                                  </div>
                                </td>
                                <td>
                                  {record ? (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <span 
                                        className="status-badge" 
                                        style={{ background: getStatusColor(record.status) }}
                                      >
                                        {record.status} (Already Marked)
                                      </span>
                                      <button 
                                        className="btn-icon btn-delete" 
                                        onClick={() => handleDeleteAttendance(record._id)}
                                        title="Delete to mark again"
                                        style={{ fontSize: '12px' }}
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="action-buttons">
                                      <button 
                                        className={`btn-icon ${selectedStatus === 'Present' ? 'status-present' : ''}`}
                                        onClick={() => handleStatusSelect(emp._id, 'Present')}
                                        title="Select Present"
                                      >
                                        ✓ Present
                                      </button>
                                      <button 
                                        className={`btn-icon ${selectedStatus === 'Absent' ? 'status-absent' : ''}`}
                                        onClick={() => handleStatusSelect(emp._id, 'Absent')}
                                        title="Select Absent"
                                      >
                                        ✗ Absent
                                      </button>
                                      <button 
                                        className={`btn-icon ${selectedStatus === 'Half Day' ? 'status-halfday' : ''}`}
                                        onClick={() => handleStatusSelect(emp._id, 'Half Day')}
                                        title="Select Half Day"
                                      >
                                        ◐ Half Day
                                      </button>
                                      <button 
                                        className={`btn-icon ${selectedStatus === 'On Leave' ? 'status-onleave' : ''}`}
                                        onClick={() => handleStatusSelect(emp._id, 'On Leave')}
                                        title="Select On Leave"
                                      >
                                        🏖 On Leave
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowManageModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveAllAttendance}
                  disabled={isSaving || Object.keys(selectedAttendance).length === 0}
                  style={{ 
                    opacity: Object.keys(selectedAttendance).length === 0 ? 0.5 : 1,
                    cursor: Object.keys(selectedAttendance).length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSaving ? 'Saving...' : `Save Attendance (${Object.keys(selectedAttendance).length})`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Attendance Modal */}
        {showEditModal && editingRecord && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Attendance</h3>
                <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Employee</label>
                  <input 
                    type="text" 
                    value={editingRecord.employee ? `${editingRecord.employee.firstName} ${editingRecord.employee.lastName}` : 'N/A'}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={new Date(editingRecord.date).toISOString().split('T')[0]}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Check In</label>
                  <input 
                    type="datetime-local" 
                    value={editingRecord.checkIn ? new Date(editingRecord.checkIn).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingRecord({...editingRecord, checkIn: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Check Out</label>
                  <input 
                    type="datetime-local" 
                    value={editingRecord.checkOut ? new Date(editingRecord.checkOut).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingRecord({...editingRecord, checkOut: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={editingRecord.status}
                    onChange={(e) => setEditingRecord({...editingRecord, status: e.target.value})}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Weekend">Weekend</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    value={editingRecord.notes || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
                    placeholder="Add notes..."
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleUpdateAttendance}>
                  Update Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Attendance;
