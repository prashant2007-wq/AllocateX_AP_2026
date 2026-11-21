import React, { useState, useEffect } from 'react';
import SeatingChart from './SeatingChart';
import { API_BASE } from '../config';

/**
 * Allocation Component
 * 
 * Allows selecting an exam and executing the graph-coloring & bin-packing
 * seating allocation solver, visualizing the generated seating charts.
 */
function Allocation({ initialAllocation = null, initialExamId = '' }) {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId || '');
  const [allocationResult, setAllocationResult] = useState(initialAllocation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const res = await fetch(`${API_BASE}/api/exams`);
        if (!res.ok) throw new Error('Failed to fetch exams');
        const data = await res.json();
        if (!isMounted) return;
        setExams(data);
        if (data.length > 0 && !initialExamId) {
          setSelectedExamId((prev) => prev || data[0]._id);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading exams for allocation:', err);
        setError('Could not load exams. Ensure the backend server is running.');
      }

      if (!initialAllocation) {
        try {
          const res = await fetch(`${API_BASE}/api/allocations`);
          if (res.ok) {
            const list = await res.json();
            if (isMounted && Array.isArray(list) && list.length > 0) {
              setAllocationResult(list[0]);
              if (list[0].exam) {
                const examVal = typeof list[0].exam === 'string' ? list[0].exam : list[0].exam._id;
                setSelectedExamId((prev) => prev || examVal);
              }
            }
          }
        } catch (err) {
          console.error('Error fetching latest allocation:', err);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [initialAllocation, initialExamId]);

  // Trigger solver execution
  const handleGenerate = async () => {
    if (!selectedExamId) {
      setError('Please select an exam first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/allocations/generate/${selectedExamId}`, {
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
      setError(err.message || 'An error occurred while generating seating chart.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="allocation-view">
      <div className="page-header">
        <h1>Seating Allocation Chart</h1>
        <p>
          Constraint satisfaction solver ensures no two students from the same academic section sit adjacently.
        </p>
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="alert-box alert-error">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h4>Allocation Notice</h4>
            <p>{error}</p>
          </div>
          <button type="button" className="alert-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Exam selection and solver trigger panel */}
      <div className="allocation-control-panel panel-card">
        <h2 className="panel-title">Select Scheduled Exam</h2>
        <div className="control-row">
          <div className="form-group select-exam-group">
            <select
              className="form-control"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={loading || exams.length === 0}
            >
              {exams.length === 0 ? (
                <option value="">No exams found. Use Quick Setup or create an exam first.</option>
              ) : (
                exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.examName} ({exam.courseCode}) - {exam.examDate} [{exam.examSlot}] - {exam.students?.length || 0} Students
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading || !selectedExamId}
          >
            {loading ? (
              <>
                <span className="spinner-small" />
                Solving Constraints...
              </>
            ) : (
              'Re-Run Allocation Solver'
            )}
          </button>
        </div>
      </div>

      {/* Loading State Banner */}
      {loading && (
        <div className="loading-solver-banner panel-card">
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

          {/* Section Legend above the grid */}
          <div className="section-legend panel-card">
            <span className="legend-title">Section Legend:</span>
            <div className="legend-swatches-wrap">
              <span className="legend-item"><span className="legend-swatch swatch-a" /> Section A</span>
              <span className="legend-item"><span className="legend-swatch swatch-b" /> Section B</span>
              <span className="legend-item"><span className="legend-swatch swatch-c" /> Section C</span>
              <span className="legend-item"><span className="legend-swatch swatch-d" /> Section D</span>
              <span className="legend-item"><span className="legend-swatch swatch-e" /> Section E</span>
              <span className="legend-item"><span className="legend-swatch swatch-f" /> Section F</span>
              <span className="legend-item"><span className="legend-swatch swatch-empty" /> Empty Seat</span>
            </div>
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
