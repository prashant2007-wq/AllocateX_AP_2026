import React, { useState } from 'react';
import { API_BASE } from '../config';

const STUDENT_OPTIONS = [30, 60, 100, 150, 200, 300];
const SECTION_OPTIONS = [2, 3, 4, 5, 6];
const ROOM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ROOM_SIZE_PRESETS = [
  { label: '5 x 6 (30 seats)', rows: 5, cols: 6 },
  { label: '6 x 8 (48 seats)', rows: 6, cols: 8 },
  { label: '8 x 10 (80 seats)', rows: 8, cols: 10 },
  { label: '10 x 10 (100 seats)', rows: 10, cols: 10 },
];
const INVIGILATOR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const EXAM_NAME_OPTIONS = [
  'Mid-Term Examination 2026',
  'End-Semester Examination 2026',
  'Internal Assessment 1 - 2026',
  'Internal Assessment 2 - 2026',
  'Practical Examination 2026',
];
const SLOT_OPTIONS = ['Morning', 'Afternoon', 'Evening'];

function QuickSetup({ onComplete }) {
  const [studentCount, setStudentCount] = useState(100);
  const [sectionCount, setSectionCount] = useState(4);
  const [roomCount, setRoomCount] = useState(3);
  const [roomSizeIndex, setRoomSizeIndex] = useState(1); // 6x8 default
  const [invigilatorCount, setInvigilatorCount] = useState(3);
  const [examName, setExamName] = useState(EXAM_NAME_OPTIONS[0]);
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [examSlot, setExamSlot] = useState(SLOT_OPTIONS[0]);
  const [clearOldData, setClearOldData] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Live Calculations
  const currentPreset = ROOM_SIZE_PRESETS[roomSizeIndex];
  const seatsPerRoom = currentPreset.rows * currentPreset.cols;
  const totalSeats = roomCount * seatsPerRoom;
  const seatsLeft = totalSeats - studentCount;
  const roomsNeeded = Math.ceil(studentCount / seatsPerRoom);

  // Status computation: red if totalSeats < studentCount, amber if invigilators < rooms, else green
  const isRed = totalSeats < studentCount;
  const isAmber = !isRed && invigilatorCount < roomCount;

  const statusType = isRed ? 'red' : isAmber ? 'amber' : 'green';
  const statusLabel = isRed ? 'Critical Shortage' : isAmber ? 'Needs Attention' : 'Optimal Setup';
  const statusDescription = isRed
    ? `Deficit of ${Math.abs(seatsLeft)} seat(s). Increase room count or choose a larger room size.`
    : isAmber
    ? `Shortage of ${roomCount - invigilatorCount} invigilator(s). Some halls will lack assigned supervisors.`
    : 'All students fit comfortably and every exam room has an assigned invigilator.';

  const handleGenerate = async () => {
    if (isRed) return;

    setLoading(true);
    setErrorAlert(null);
    setToastMessage(null);

    try {
      // Step 1: Call /api/setup/generate
      const setupRes = await fetch(`${API_BASE}/api/setup/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCount,
          sectionCount,
          roomCount,
          roomRows: currentPreset.rows,
          roomColumns: currentPreset.cols,
          invigilatorCount,
          examName,
          courseCode: 'CS301',
          examDate,
          examSlot,
          clearOldData,
        }),
      });

      const setupData = await setupRes.json();
      if (!setupRes.ok) {
        throw new Error(setupData.error || setupData.message || 'Failed to generate initial setup data');
      }

      const examId = setupData.examId;

      // Step 2: Call /api/allocations/generate/:examId
      const allocRes = await fetch(`${API_BASE}/api/allocations/generate/${examId}`, {
        method: 'POST',
      });

      const allocData = await allocRes.json();
      if (!allocRes.ok) {
        throw new Error(allocData.error || allocData.message || 'Failed to generate seating allocation');
      }

      setToastMessage('Generated data and allocated seats successfully!');

      // Switch to allocation tab with new data after a brief pause so user sees toast
      setTimeout(() => {
        if (onComplete) {
          onComplete(allocData, examId);
        }
      }, 700);
    } catch (err) {
      console.error('Quick Setup generation error:', err);
      setErrorAlert(err.message || 'An unexpected error occurred during setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quick-setup-view">
      <div className="page-header">
        <h1>Quick Setup & Automatic Allocation</h1>
        <p>Configure parameters below without typing any manual data. The system automatically creates students, rooms, invigilators, and resolves optimal seating charts.</p>
      </div>

      {/* Error Alert */}
      {errorAlert && (
        <div className="alert-box alert-error">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h4>Setup Error</h4>
            <p>{errorAlert}</p>
          </div>
          <button type="button" className="alert-close" onClick={() => setErrorAlert(null)}>✕</button>
        </div>
      )}

      {/* Success Toast */}
      {toastMessage && (
        <div className="toast-banner toast-success">
          <span className="toast-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="setup-container">
        {/* Left column: Setup Controls */}
        <div className="setup-form-panel panel-card">
          <h2 className="panel-title">Configuration Parameters</h2>
          <p className="panel-subtitle">Select your test dimensions using the structured inputs below.</p>

          <div className="form-grid">
            {/* Student Count */}
            <div className="form-group">
              <label htmlFor="studentCountSelect">Students Count</label>
              <select
                id="studentCountSelect"
                className="form-control"
                value={studentCount}
                onChange={(e) => setStudentCount(Number(e.target.value))}
                disabled={loading}
              >
                {STUDENT_OPTIONS.map((val) => (
                  <option key={val} value={val}>{val} Students</option>
                ))}
              </select>
            </div>

            {/* Section Count */}
            <div className="form-group">
              <label htmlFor="sectionCountSelect">Sections (Spread Evenly)</label>
              <select
                id="sectionCountSelect"
                className="form-control"
                value={sectionCount}
                onChange={(e) => setSectionCount(Number(e.target.value))}
                disabled={loading}
              >
                {SECTION_OPTIONS.map((val) => (
                  <option key={val} value={val}>{val} Sections ({val === 2 ? 'A, B' : val === 3 ? 'A, B, C' : val === 4 ? 'A, B, C, D' : val === 5 ? 'A, B, C, D, E' : 'A to F'})</option>
                ))}
              </select>
            </div>

            {/* Room Count */}
            <div className="form-group">
              <label htmlFor="roomCountSelect">Examination Rooms</label>
              <select
                id="roomCountSelect"
                className="form-control"
                value={roomCount}
                onChange={(e) => setRoomCount(Number(e.target.value))}
                disabled={loading}
              >
                {ROOM_OPTIONS.map((val) => (
                  <option key={val} value={val}>{val} {val === 1 ? 'Room' : 'Rooms'}</option>
                ))}
              </select>
            </div>

            {/* Room Size Presets */}
            <div className="form-group">
              <label htmlFor="roomSizeSelect">Room Size (Rows × Columns)</label>
              <select
                id="roomSizeSelect"
                className="form-control"
                value={roomSizeIndex}
                onChange={(e) => setRoomSizeIndex(Number(e.target.value))}
                disabled={loading}
              >
                {ROOM_SIZE_PRESETS.map((preset, idx) => (
                  <option key={preset.label} value={idx}>{preset.label}</option>
                ))}
              </select>
            </div>

            {/* Invigilators */}
            <div className="form-group">
              <label htmlFor="invigilatorCountSelect">Invigilators Available</label>
              <select
                id="invigilatorCountSelect"
                className="form-control"
                value={invigilatorCount}
                onChange={(e) => setInvigilatorCount(Number(e.target.value))}
                disabled={loading}
              >
                {INVIGILATOR_OPTIONS.map((val) => (
                  <option key={val} value={val}>{val} {val === 1 ? 'Invigilator' : 'Invigilators'}</option>
                ))}
              </select>
            </div>

            {/* Exam Name */}
            <div className="form-group">
              <label htmlFor="examNameSelect">Examination Name</label>
              <select
                id="examNameSelect"
                className="form-control"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                disabled={loading}
              >
                {EXAM_NAME_OPTIONS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Exam Date */}
            <div className="form-group">
              <label htmlFor="examDateInput">Exam Date</label>
              <input
                id="examDateInput"
                type="date"
                className="form-control"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Slot */}
            <div className="form-group">
              <label htmlFor="examSlotSelect">Exam Slot</label>
              <select
                id="examSlotSelect"
                className="form-control"
                value={examSlot}
                onChange={(e) => setExamSlot(e.target.value)}
                disabled={loading}
              >
                {SLOT_OPTIONS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Old Data Checkbox */}
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={clearOldData}
                onChange={(e) => setClearOldData(e.target.checked)}
                disabled={loading}
              />
              <span>Clear old data first (recommended for fresh isolated runs)</span>
            </label>
          </div>

          {/* Primary Action Button */}
          <div className="action-row">
            <button
              type="button"
              className="btn btn-primary btn-generate"
              onClick={handleGenerate}
              disabled={isRed || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small" />
                  Generating & Allocating...
                </>
              ) : (
                'Generate Data & Allocate Seats'
              )}
            </button>
            {isRed && (
              <span className="btn-hint hint-red">
                Cannot generate: Total seats are fewer than students.
              </span>
            )}
          </div>
        </div>

        {/* Right column: Live Preview Panel */}
        <div className="setup-preview-panel panel-card">
          <h2 className="panel-title">Capacity & Readiness Preview</h2>
          <p className="panel-subtitle">Calculated dynamically based on selected dimensions.</p>

          {/* Status Indicator Pill */}
          <div className={`status-badge-card status-${statusType}`}>
            <div className="badge-header">
              <span className={`status-pill pill-${statusType}`}>● {statusLabel}</span>
              <span className="badge-capacity">{totalSeats} Total Seats</span>
            </div>
            <p className="badge-description">{statusDescription}</p>
          </div>

          {/* Live Metric Cards Grid */}
          <div className="preview-metrics-grid">
            <div className="preview-metric-box">
              <span className="metric-label">Total Seats</span>
              <span className="metric-value">{totalSeats}</span>
              <span className="metric-sub">{roomCount} rooms × {seatsPerRoom} seats</span>
            </div>

            <div className="preview-metric-box">
              <span className="metric-label">Students</span>
              <span className="metric-value">{studentCount}</span>
              <span className="metric-sub">Across {sectionCount} sections</span>
            </div>

            <div className={`preview-metric-box ${seatsLeft < 0 ? 'metric-negative' : 'metric-positive'}`}>
              <span className="metric-label">Seats Left</span>
              <span className="metric-value">{seatsLeft >= 0 ? `+${seatsLeft}` : seatsLeft}</span>
              <span className="metric-sub">{seatsLeft >= 0 ? 'Surplus buffer' : 'Seat deficit'}</span>
            </div>

            <div className="preview-metric-box">
              <span className="metric-label">Rooms Needed</span>
              <span className="metric-value">{roomsNeeded}</span>
              <span className="metric-sub">Min halls for {studentCount} stds</span>
            </div>
          </div>

          {/* Summary Checklist */}
          <div className="preview-checklist">
            <h4>Allocation Readiness Checks:</h4>
            <div className={`checklist-item ${totalSeats >= studentCount ? 'check-pass' : 'check-fail'}`}>
              <span className="check-icon">{totalSeats >= studentCount ? '✓' : '✗'}</span>
              <span>
                <strong>Physical Capacity:</strong> {totalSeats >= studentCount ? `Sufficient (${totalSeats} seats for ${studentCount} students)` : `Insufficient (${totalSeats} seats for ${studentCount} students)`}
              </span>
            </div>

            <div className={`checklist-item ${invigilatorCount >= roomCount ? 'check-pass' : 'check-warn'}`}>
              <span className="check-icon">{invigilatorCount >= roomCount ? '✓' : '⚠️'}</span>
              <span>
                <strong>Invigilator Coverage:</strong> {invigilatorCount >= roomCount ? `${invigilatorCount} available for ${roomCount} room(s)` : `Only ${invigilatorCount} available for ${roomCount} room(s)`}
              </span>
            </div>

            <div className="checklist-item check-pass">
              <span className="check-icon">✓</span>
              <span>
                <strong>Section Distribution:</strong> ~{Math.round(studentCount / sectionCount)} students per section ({sectionCount} total)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickSetup;
