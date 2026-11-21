import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

/**
 * Invigilators Management Component
 * 
 * Allows listing, adding, and deleting invigilator records.
 */
function Invigilators() {
  const [invigilators, setInvigilators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
  });
  const [error, setError] = useState(null);

  const fetchInvigilators = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/invigilators`);
      if (!res.ok) throw new Error('Failed to fetch invigilators');
      const data = await res.json();
      setInvigilators(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching invigilators:', err);
      setError('Could not load invigilators. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all invigilators from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await fetch(`${API_BASE}/api/invigilators`);
        if (!res.ok) throw new Error('Failed to fetch invigilators');
        const data = await res.json();
        if (isMounted) {
          setInvigilators(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching invigilators:', err);
          setError('Could not load invigilators. Ensure the backend server is running.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle invigilator creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/invigilators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create invigilator');
      }

      const newInvigilator = await res.json();
      // Instantly update the state array
      setInvigilators((prev) => [...prev, newInvigilator]);

      // Reset form fields
      setFormData({
        name: '',
        department: '',
      });
      setError(null);
    } catch (err) {
      console.error('Error adding invigilator:', err);
      setError(err.message);
    }
  };

  // Handle invigilator deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invigilator?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/invigilators/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete invigilator');

      // Filter out deleted invigilator from state array
      setInvigilators((prev) => prev.filter((item) => item._id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting invigilator:', err);
      setError('Failed to delete invigilator.');
    }
  };

  return (
    <div className="management-view">
      <div className="page-header">
        <h1>Invigilators Management</h1>
        <p>Register faculty supervisors, track department affiliations, and view invigilator pools.</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Add Invigilator Form */}
      <div className="panel-card form-panel">
        <h2 className="panel-title">Add New Invigilator</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name / Title</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="e.g. Dr. Alan Turing"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                type="text"
                name="department"
                placeholder="e.g. Computer Science, Mathematics"
                value={formData.department}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            + Add Invigilator
          </button>
        </form>
      </div>

      {/* Invigilators Data Table */}
      <div className="panel-card table-panel">
        <div className="table-header-flex">
          <h2 className="panel-title">Registered Invigilators ({invigilators.length})</h2>
          <button onClick={fetchInvigilators} className="btn-secondary-sm">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Loading invigilators...</div>
        ) : invigilators.length === 0 ? (
          <div className="table-empty">No invigilators found. Add one above!</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invigilators.map((invigilator) => (
                  <tr key={invigilator._id}>
                    <td className="font-semibold text-primary">{invigilator.name}</td>
                    <td>{invigilator.department}</td>
                    <td>
                      <span className="status-badge-active">Available</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(invigilator._id)}
                        className="btn-danger-sm"
                        title="Delete Invigilator"
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

export default Invigilators;
