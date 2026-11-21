import React, { useState, useEffect } from 'react';
import SeatingChart from './SeatingChart';

/**
 * Allocation Component
 * 
 * Allows selecting an exam and executing the graph-coloring & bin-packing
 * seating allocation solver, visualizing the generated seating charts.
 */
function Allocation() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [allocationResult, setAllocationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all exams on mount to populate the dropdown
  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch('http://localhost:5001/api/exams');
        if (!res.ok) throw new Error('Failed to fetch exams');
        const data = await res.json();
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0]._id);
        }
      } catch (err) {
        console.error('Error loading exams for allocation:', err);
        setError('Could not load exams. Ensure the backend server is running.');
      }
    }

    loadExams();
  }, []);

  // Trigger solver execution
  const handleGenerate = async () => {
    if (!selectedExamId) {
      setError('Please select an exam first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`http://localhost:5001/api/allocations/generate/${selectedExamId}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.message || 'Failed to generate allocation');
      }

      const data = await res.json();
      setAllocationResult(data);
    } catch (err) {
      console.error('Error generating allocation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="allocation-view">
      <div className="page-header">
        <h1>Seating Allocation Engine</h1>
        <p>Run graph-coloring and first-fit bin-packing algorithms to generate optimal seating plans.</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Control Card to Trigger Allocation */}
      <div className="panel-card allocation-controls-card">
        <h2 className="panel-title">Select Exam to Allocate</h2>
        <div className="allocation-form-flex">
          <div className="select-wrapper">
            <label htmlFor="examSelect">Choose Examination:</label>
            <select
              id="examSelect"
              className="form-input select-exam"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={loading || exams.length === 0}
            >
              {exams.length === 0 && <option value="">No exams available</option>}
              {exams.map((exam) => {
                const count = (exam.students && exam.students.length) || 0;
                return (
                  <option key={exam._id} value={exam._id}>
                    {exam.examName} ({exam.courseCode}) - {exam.examDate} [{exam.examSlot}] ({count} students)
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-generate"
            onClick={handleGenerate}
            disabled={loading || !selectedExamId}
          >
            {loading ? 'Processing Algorithm...' : '⚡ Generate Seating Plan'}
          </button>
        </div>
      </div>

      {/* Loading State Banner */}
      {loading && (
        <div className="loading-solver-banner">
          <div className="spinner" />
          <div>
            <h3>Processing Algorithm...</h3>
            <p>Distributing students into rooms and applying adjacency constraint checks.</p>
          </div>
        </div>
      )}

      {/* Allocation Summary and Seating Charts */}
      {allocationResult && !loading && (
        <div className="allocation-results-section">
          {/* Summary Stat Banner */}
          <div className="allocation-summary-banner panel-card">
            <h2 className="panel-title">Allocation Summary: {allocationResult.examName}</h2>
            <div className="summary-stats-grid">
              <div className="summary-stat-box">
                <span className="stat-label">Total Registered</span>
                <span className="stat-value">{allocationResult.totalStudents}</span>
              </div>

              <div className="summary-stat-box stat-allocated">
                <span className="stat-label">Allocated</span>
                <span className="stat-value">{allocationResult.allocatedStudents}</span>
              </div>

              <div className="summary-stat-box stat-unallocated">
                <span className="stat-label">Unallocated</span>
                <span className="stat-value">{allocationResult.unallocatedStudents}</span>
              </div>

              <div className="summary-stat-box stat-rooms">
                <span className="stat-label">Halls Used</span>
                <span className="stat-value">{allocationResult.rooms?.length || 0}</span>
              </div>
            </div>

            {/* Warnings Alert Box */}
            {allocationResult.warnings && allocationResult.warnings.length > 0 && (
              <div className="warnings-container">
                <h4>Constraint Notices & Warnings ({allocationResult.warnings.length}):</h4>
                <ul className="warnings-list">
                  {allocationResult.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Section Legend */}
          <div className="section-legend panel-card">
            <span className="legend-title">Section Legend:</span>
            <span className="legend-item"><span className="legend-swatch swatch-a" /> Section A</span>
            <span className="legend-item"><span className="legend-swatch swatch-b" /> Section B</span>
            <span className="legend-item"><span className="legend-swatch swatch-c" /> Section C</span>
            <span className="legend-item"><span className="legend-swatch swatch-d" /> Section D</span>
            <span className="legend-item"><span className="legend-swatch swatch-empty" /> Empty Seat</span>
          </div>

          {/* Render Seating Charts for Each Room */}
          <div className="charts-list">
            {allocationResult.rooms && allocationResult.rooms.length > 0 ? (
              allocationResult.rooms.map((room, index) => (
                <SeatingChart key={room.roomId || index} room={room} />
              ))
            ) : (
              <div className="panel-card placeholder-container">
                <p>No rooms were utilized in this allocation run.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Allocation;
