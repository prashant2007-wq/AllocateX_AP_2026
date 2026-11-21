import React, { useState, useEffect } from 'react';

/**
 * Dashboard Component
 * 
 * Displays 4 summary cards with live counts from the AllocateX backend:
 * - Total Students
 * - Total Rooms
 * - Total Invigilators
 * - Total Exams
 */
function Dashboard() {
  const [counts, setCounts] = useState({
    students: 0,
    rooms: 0,
    invigilators: 0,
    exams: 0,
  });
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('Checking connection...');

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // Fetch counts in parallel from the backend endpoints
        const [studentsRes, roomsRes, invigilatorsRes, examsRes] = await Promise.allSettled([
          fetch('http://localhost:5001/api/students').then((r) => r.ok ? r.json() : []),
          fetch('http://localhost:5001/api/rooms').then((r) => r.ok ? r.json() : []),
          fetch('http://localhost:5001/api/invigilators').then((r) => r.ok ? r.json() : []),
          fetch('http://localhost:5001/api/exams').then((r) => r.ok ? r.json() : []),
        ]);

        const studentsData = studentsRes.status === 'fulfilled' ? studentsRes.value : [];
        const roomsData = roomsRes.status === 'fulfilled' ? roomsRes.value : [];
        const invigilatorsData = invigilatorsRes.status === 'fulfilled' ? invigilatorsRes.value : [];
        const examsData = examsRes.status === 'fulfilled' ? examsRes.value : [];

        setCounts({
          students: Array.isArray(studentsData) ? studentsData.length : 0,
          rooms: Array.isArray(roomsData) ? roomsData.length : 0,
          invigilators: Array.isArray(invigilatorsData) ? invigilatorsData.length : 0,
          exams: Array.isArray(examsData) ? examsData.length : 0,
        });

        setBackendStatus('Connected to Backend (http://localhost:5001)');
      } catch (err) {
        console.error('Error fetching dashboard counts:', err);
        setBackendStatus('Could not connect to backend. Please ensure server is running.');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="dashboard-view">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Monitor your exam rooms, invigilators, and student allocation metrics.</p>
      </div>

      <div className="dashboard-grid">
        <div className="summary-card card-students">
          <h3>Total Students</h3>
          <div className="card-count">{loading ? '...' : counts.students}</div>
        </div>

        <div className="summary-card card-rooms">
          <h3>Total Rooms</h3>
          <div className="card-count">{loading ? '...' : counts.rooms}</div>
        </div>

        <div className="summary-card card-invigilators">
          <h3>Total Invigilators</h3>
          <div className="card-count">{loading ? '...' : counts.invigilators}</div>
        </div>

        <div className="summary-card card-exams">
          <h3>Total Exams</h3>
          <div className="card-count">{loading ? '...' : counts.exams}</div>
        </div>
      </div>

      <div className="status-banner">
        <div className="status-indicator">
          <span className={`status-dot ${backendStatus.includes('Connected') ? '' : 'error'}`} />
          <span>{backendStatus}</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
