import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

/**
 * Dashboard Component
 * 
 * Displays:
 * - 4 live stat cards (Students, Rooms, Invigilators, Exams)
 * - Last Allocation summary card with warnings count
 * - Delete All Data action with confirmation dialog
 * - Backend connection health status
 */
function Dashboard({ onNavigate }) {
  const [counts, setCounts] = useState({
    students: 0,
    rooms: 0,
    invigilators: 0,
    exams: 0,
  });
  const [lastAllocation, setLastAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [backendStatus, setBackendStatus] = useState('Checking connection...');

  const refreshData = async () => {
    try {
      setLoading(true);
      const [studentsRes, roomsRes, invigilatorsRes, examsRes, allocationsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/students`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/rooms`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/invigilators`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/exams`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/allocations`).then((r) => r.ok ? r.json() : []),
      ]);

      const studentsData = studentsRes.status === 'fulfilled' ? studentsRes.value : [];
      const roomsData = roomsRes.status === 'fulfilled' ? roomsRes.value : [];
      const invigilatorsData = invigilatorsRes.status === 'fulfilled' ? invigilatorsRes.value : [];
      const examsData = examsRes.status === 'fulfilled' ? examsRes.value : [];
      const allocationsData = allocationsRes.status === 'fulfilled' ? allocationsRes.value : [];

      setCounts({
        students: Array.isArray(studentsData) ? studentsData.length : 0,
        rooms: Array.isArray(roomsData) ? roomsData.length : 0,
        invigilators: Array.isArray(invigilatorsData) ? invigilatorsData.length : 0,
        exams: Array.isArray(examsData) ? examsData.length : 0,
      });

      if (Array.isArray(allocationsData) && allocationsData.length > 0) {
        setLastAllocation(allocationsData[0]);
      } else {
        setLastAllocation(null);
      }

      setBackendStatus(`Connected to Backend${API_BASE ? ` (${API_BASE})` : ''}`);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setBackendStatus('Could not connect to backend. Please ensure server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const [studentsRes, roomsRes, invigilatorsRes, examsRes, allocationsRes] = await Promise.allSettled([
          fetch(`${API_BASE}/api/students`).then((r) => r.ok ? r.json() : []),
          fetch(`${API_BASE}/api/rooms`).then((r) => r.ok ? r.json() : []),
          fetch(`${API_BASE}/api/invigilators`).then((r) => r.ok ? r.json() : []),
          fetch(`${API_BASE}/api/exams`).then((r) => r.ok ? r.json() : []),
          fetch(`${API_BASE}/api/allocations`).then((r) => r.ok ? r.json() : []),
        ]);

        if (!isMounted) return;

        const studentsData = studentsRes.status === 'fulfilled' ? studentsRes.value : [];
        const roomsData = roomsRes.status === 'fulfilled' ? roomsRes.value : [];
        const invigilatorsData = invigilatorsRes.status === 'fulfilled' ? invigilatorsRes.value : [];
        const examsData = examsRes.status === 'fulfilled' ? examsRes.value : [];
        const allocationsData = allocationsRes.status === 'fulfilled' ? allocationsRes.value : [];

        setCounts({
          students: Array.isArray(studentsData) ? studentsData.length : 0,
          rooms: Array.isArray(roomsData) ? roomsData.length : 0,
          invigilators: Array.isArray(invigilatorsData) ? invigilatorsData.length : 0,
          exams: Array.isArray(examsData) ? examsData.length : 0,
        });

        if (Array.isArray(allocationsData) && allocationsData.length > 0) {
          setLastAllocation(allocationsData[0]);
        } else {
          setLastAllocation(null);
        }

        setBackendStatus(`Connected to Backend${API_BASE ? ` (${API_BASE})` : ''}`);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching dashboard metrics:', err);
        setBackendStatus('Could not connect to backend. Please ensure server is running.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete ALL data?\n\n' +
      'This will permanently delete all Students, Rooms, Invigilators, Exams, and Seating Allocations.\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE}/api/setup/clear`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to clear data');
      }

      setCounts({ students: 0, rooms: 0, invigilators: 0, exams: 0 });
      setLastAllocation(null);
      setNotification({ type: 'success', message: 'All database records were cleared successfully.' });
      await refreshData();
    } catch (err) {
      console.error('Error deleting all data:', err);
      setNotification({ type: 'error', message: err.message || 'Failed to delete data.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="dashboard-view">
      <div className="page-header dashboard-header-row">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Monitor your examination halls, registered students, and real-time allocation health.</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDeleteAllData}
            disabled={deleting || loading}
          >
            {deleting ? 'Clearing Data...' : 'Delete All Data'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`alert-box alert-${notification.type}`}>
          <div className="alert-icon">{notification.type === 'success' ? '✓' : '⚠️'}</div>
          <div className="alert-content">
            <p>{notification.message}</p>
          </div>
          <button type="button" className="alert-close" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="dashboard-grid">
        <div className="summary-card card-students">
          <div className="card-top">
            <span className="card-badge">Capacity Pool</span>
            <span className="card-icon">🎓</span>
          </div>
          <h3>Total Students</h3>
          <div className="card-count">{loading ? '...' : counts.students}</div>
        </div>

        <div className="summary-card card-rooms">
          <div className="card-top">
            <span className="card-badge">Venues</span>
            <span className="card-icon">🏫</span>
          </div>
          <h3>Total Rooms</h3>
          <div className="card-count">{loading ? '...' : counts.rooms}</div>
        </div>

        <div className="summary-card card-invigilators">
          <div className="card-top">
            <span className="card-badge">Staff</span>
            <span className="card-icon">👤</span>
          </div>
          <h3>Total Invigilators</h3>
          <div className="card-count">{loading ? '...' : counts.invigilators}</div>
        </div>

        <div className="summary-card card-exams">
          <div className="card-top">
            <span className="card-badge">Schedules</span>
            <span className="card-icon">📝</span>
          </div>
          <h3>Total Exams</h3>
          <div className="card-count">{loading ? '...' : counts.exams}</div>
        </div>
      </div>

      {/* Last Allocation Summary Card & Warnings */}
      <div className="panel-card last-allocation-card">
        <div className="card-header-flex">
          <div>
            <h2 className="panel-title">Last Allocation Run</h2>
            <p className="panel-subtitle">Summary of the most recently executed seating allocation run.</p>
          </div>
          {lastAllocation && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate && onNavigate('Allocation')}
            >
              View Seating Chart →
            </button>
          )}
        </div>

        {lastAllocation ? (
          <div className="allocation-details-grid">
            <div className="alloc-meta-group">
              <div className="alloc-meta-item">
                <span className="meta-label">Exam Name:</span>
                <strong className="meta-val">{lastAllocation.examName || 'Scheduled Exam'}</strong>
              </div>
              <div className="alloc-meta-item">
                <span className="meta-label">Date & Slot:</span>
                <span className="meta-val">{lastAllocation.examDate} [{lastAllocation.examSlot}]</span>
              </div>
              <div className="alloc-meta-item">
                <span className="meta-label">Generated At:</span>
                <span className="meta-val">
                  {lastAllocation.generatedAt ? new Date(lastAllocation.generatedAt).toLocaleString() : 'Recent'}
                </span>
              </div>
            </div>

            <div className="alloc-stats-row">
              <div className="alloc-metric-pill">
                <span className="pill-title">Allocated Students</span>
                <strong className="pill-val val-green">
                  {lastAllocation.allocatedStudents} / {lastAllocation.totalStudents}
                </strong>
              </div>

              <div className="alloc-metric-pill">
                <span className="pill-title">Unallocated</span>
                <strong className={`pill-val ${lastAllocation.unallocatedStudents > 0 ? 'val-red' : 'val-neutral'}`}>
                  {lastAllocation.unallocatedStudents}
                </strong>
              </div>

              <div className="alloc-metric-pill">
                <span className="pill-title">Halls Utilized</span>
                <strong className="pill-val val-blue">
                  {lastAllocation.rooms?.length || 0}
                </strong>
              </div>

              <div className="alloc-metric-pill">
                <span className="pill-title">Warnings Count</span>
                <strong className={`pill-val ${lastAllocation.warnings?.length > 0 ? 'val-amber' : 'val-green'}`}>
                  {lastAllocation.warnings?.length || 0}
                </strong>
              </div>
            </div>

            {/* Warnings Alert list */}
            {lastAllocation.warnings && lastAllocation.warnings.length > 0 && (
              <div className="warnings-container">
                <h4>Notices & Warnings ({lastAllocation.warnings.length}):</h4>
                <ul className="warnings-list">
                  {lastAllocation.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-allocation-state">
            <div className="empty-icon">⚡</div>
            <p>No seating allocations have been recorded yet.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate && onNavigate('Quick Setup')}
            >
              Go to Quick Setup
            </button>
          </div>
        )}
      </div>

      {/* Backend connection status */}
      <div className="status-banner panel-card">
        <div className="status-indicator">
          <span className={`status-dot ${backendStatus.includes('Connected') ? '' : 'error'}`} />
          <span>{backendStatus}</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
