import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

/**
 * Rooms Management Component
 * 
 * Allows listing, adding, and deleting exam room/hall configurations.
 */
function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    roomName: '',
    building: '',
    rows: '',
    columns: '',
  });
  const [error, setError] = useState(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/rooms`);
      if (!res.ok) throw new Error('Failed to fetch rooms');
      const data = await res.json();
      setRooms(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Could not load rooms. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all rooms from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await fetch(`${API_BASE}/api/rooms`);
        if (!res.ok) throw new Error('Failed to fetch rooms');
        const data = await res.json();
        if (isMounted) {
          setRooms(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching rooms:', err);
          setError('Could not load rooms. Ensure the backend server is running.');
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

  // Handle room creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const rowsNum = Number(formData.rows);
      const colsNum = Number(formData.columns);

      const res = await fetch(`${API_BASE}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: formData.roomName,
          building: formData.building,
          rows: rowsNum,
          columns: colsNum,
          isActive: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create room');
      }

      const newRoom = await res.json();
      // Instantly update the state array
      setRooms((prev) => [...prev, newRoom]);

      // Reset form fields
      setFormData({
        roomName: '',
        building: '',
        rows: '',
        columns: '',
      });
      setError(null);
    } catch (err) {
      console.error('Error adding room:', err);
      setError(err.message);
    }
  };

  // Handle room deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/rooms/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete room');

      // Filter out deleted room from state array
      setRooms((prev) => prev.filter((room) => room._id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting room:', err);
      setError('Failed to delete room.');
    }
  };

  return (
    <div className="management-view">
      <div className="page-header">
        <h1>Rooms & Halls Management</h1>
        <p>Configure examination rooms, grid capacities, and seating layouts.</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Add Room Form */}
      <div className="panel-card form-panel">
        <h2 className="panel-title">Add New Room</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="roomName">Room / Hall Name</label>
              <input
                id="roomName"
                type="text"
                name="roomName"
                placeholder="e.g. LT-1, Room 101"
                value={formData.roomName}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="building">Building / Wing</label>
              <input
                id="building"
                type="text"
                name="building"
                placeholder="e.g. Main Block, CS Wing"
                value={formData.building}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="rows">Number of Rows</label>
              <input
                id="rows"
                type="number"
                name="rows"
                placeholder="e.g. 5"
                value={formData.rows}
                onChange={handleChange}
                required
                min="1"
                max="50"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="columns">Number of Columns</label>
              <input
                id="columns"
                type="number"
                name="columns"
                placeholder="e.g. 6"
                value={formData.columns}
                onChange={handleChange}
                required
                min="1"
                max="50"
                className="form-input"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            + Add Room
          </button>
        </form>
      </div>

      {/* Rooms Data Table */}
      <div className="panel-card table-panel">
        <div className="table-header-flex">
          <h2 className="panel-title">Configured Rooms ({rooms.length})</h2>
          <button onClick={fetchRooms} className="btn-secondary-sm">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="table-empty">No rooms configured yet. Add one above!</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room Name</th>
                  <th>Building</th>
                  <th>Grid Layout</th>
                  <th>Total Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const capacity = (room.rows || 0) * (room.columns || 0);
                  return (
                    <tr key={room._id}>
                      <td className="font-semibold text-primary">{room.roomName}</td>
                      <td>{room.building}</td>
                      <td>{room.rows} rows × {room.columns} cols</td>
                      <td>
                        <span className="badge badge-capacity">{capacity} seats</span>
                      </td>
                      <td>
                        <span className="status-badge-active">Active</span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(room._id)}
                          className="btn-danger-sm"
                          title="Delete Room"
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

export default Rooms;
