import React, { useState, useEffect } from 'react';

/**
 * Exams Management Component
 * 
 * Allows listing, creating, and deleting exam schedules and courses.
 */
function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    examName: '',
    courseCode: '',
    examDate: '',
    examSlot: 'MORNING',
  });
  const [error, setError] = useState(null);

  // Fetch all exams from backend on mount
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5001/api/exams');
      if (!res.ok) throw new Error('Failed to fetch exams');
      const data = await res.json();
      setExams(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Could not load exams. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle exam creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5001/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create exam');
      }

      const newExam = await res.json();
      // Instantly update the state array
      setExams((prev) => [...prev, newExam]);

      // Reset form fields
      setFormData({
        examName: '',
        courseCode: '',
        examDate: '',
        examSlot: 'MORNING',
      });
      setError(null);
    } catch (err) {
      console.error('Error adding exam:', err);
      setError(err.message);
    }
  };

  // Handle exam deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;

    try {
      const res = await fetch(`http://localhost:5001/api/exams/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete exam');

      // Filter out deleted exam from state array
      setExams((prev) => prev.filter((exam) => exam._id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting exam:', err);
      setError('Failed to delete exam.');
    }
  };

  return (
    <div className="management-view">
      <div className="page-header">
        <h1>Exams Management</h1>
        <p>Schedule new examinations, track courses, and review enrolled candidates.</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Add Exam Form */}
      <div className="panel-card form-panel">
        <h2 className="panel-title">Schedule New Exam</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="examName">Exam Name</label>
              <input
                id="examName"
                type="text"
                name="examName"
                placeholder="e.g. Data Structures"
                value={formData.examName}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="courseCode">Course Code</label>
              <input
                id="courseCode"
                type="text"
                name="courseCode"
                placeholder="e.g. CS201"
                value={formData.courseCode}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="examDate">Exam Date</label>
              <input
                id="examDate"
                type="date"
                name="examDate"
                value={formData.examDate}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="examSlot">Exam Slot</label>
              <select
                id="examSlot"
                name="examSlot"
                value={formData.examSlot}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="MORNING">MORNING (09:30 AM - 12:30 PM)</option>
                <option value="AFTERNOON">AFTERNOON (02:00 PM - 05:00 PM)</option>
                <option value="EVENING">EVENING (05:30 PM - 08:30 PM)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            + Schedule Exam
          </button>
        </form>
      </div>

      {/* Exams Data Table */}
      <div className="panel-card table-panel">
        <div className="table-header-flex">
          <h2 className="panel-title">Scheduled Exams ({exams.length})</h2>
          <button onClick={fetchExams} className="btn-secondary-sm">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="table-empty">No exams scheduled yet. Schedule one above!</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Course Code</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Registered Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => {
                  const studentCount = (exam.students && exam.students.length) || 0;
                  return (
                    <tr key={exam._id}>
                      <td className="font-semibold text-primary">{exam.examName}</td>
                      <td>{exam.courseCode}</td>
                      <td>{exam.examDate}</td>
                      <td>
                        <span className="badge badge-section">{exam.examSlot}</span>
                      </td>
                      <td>
                        <span className="badge badge-capacity">{studentCount} Students</span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(exam._id)}
                          className="btn-danger-sm"
                          title="Delete Exam"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Exams;
