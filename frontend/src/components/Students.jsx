import React, { useState, useEffect } from 'react';

/**
 * Students Management Component
 * 
 * Allows listing, adding, and deleting student records.
 */
function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    section: '',
    semester: '',
  });
  const [error, setError] = useState(null);

  // Fetch all students from backend on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5001/api/students');
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      setStudents(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Could not load students. Ensure the backend server is running.');
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

  // Handle student creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5001/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          semester: Number(formData.semester),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create student');
      }

      const newStudent = await res.json();
      // Instantly update the state array
      setStudents((prev) => [...prev, newStudent]);

      // Reset form fields
      setFormData({
        name: '',
        rollNumber: '',
        section: '',
        semester: '',
      });
      setError(null);
    } catch (err) {
      console.error('Error adding student:', err);
      setError(err.message);
    }
  };

  // Handle student deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      const res = await fetch(`http://localhost:5001/api/students/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete student');

      // Filter out deleted student from state array
      setStudents((prev) => prev.filter((student) => student._id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student.');
    }
  };

  return (
    <div className="management-view">
      <div className="page-header">
        <h1>Students Management</h1>
        <p>Register new candidates, manage sections, and view current enrollments.</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Add Student Form */}
      <div className="panel-card form-panel">
        <h2 className="panel-title">Add New Student</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="e.g. Aarav Sharma"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="rollNumber">Roll Number</label>
              <input
                id="rollNumber"
                type="text"
                name="rollNumber"
                placeholder="e.g. CS24001"
                value={formData.rollNumber}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="section">Section</label>
              <input
                id="section"
                type="text"
                name="section"
                placeholder="e.g. A, B, C"
                value={formData.section}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="semester">Semester</label>
              <input
                id="semester"
                type="number"
                name="semester"
                placeholder="e.g. 3"
                value={formData.semester}
                onChange={handleChange}
                required
                min="1"
                max="8"
                className="form-input"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            + Add Student
          </button>
        </form>
      </div>

      {/* Students Data Table */}
      <div className="panel-card table-panel">
        <div className="table-header-flex">
          <h2 className="panel-title">Enrolled Students ({students.length})</h2>
          <button onClick={fetchStudents} className="btn-secondary-sm">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="table-empty">No students found. Add one above!</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Full Name</th>
                  <th>Section</th>
                  <th>Semester</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td className="font-semibold text-primary">{student.rollNumber}</td>
                    <td>{student.name}</td>
                    <td>
                      <span className="badge badge-section">{student.section}</span>
                    </td>
                    <td>Sem {student.semester}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(student._id)}
                        className="btn-danger-sm"
                        title="Delete Student"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Students;
