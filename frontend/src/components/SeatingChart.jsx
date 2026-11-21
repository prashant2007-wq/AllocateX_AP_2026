import React from 'react';

/**
 * SeatingChart Component
 * 
 * Renders a visual grid of an examination room with seat cards,
 * section color-coding, and occupancy information.
 * 
 * @param {Object} props.room - The room allocation object containing room details and seats array
 */
function SeatingChart({ room }) {
  if (!room) return null;

  // Determine grid dimensions
  const seatsList = room.seats || [];
  const maxRowFromSeats = seatsList.length > 0 ? Math.max(...seatsList.map((s) => s.row || 1)) : 1;
  const maxColFromSeats = seatsList.length > 0 ? Math.max(...seatsList.map((s) => s.column || 1)) : 1;

  const totalRows = room.rows || maxRowFromSeats;
  const totalCols = room.columns || maxColFromSeats;

  // Map seats by "row-col" key for fast lookup
  const seatMap = new Map();
  seatsList.forEach((seat) => {
    seatMap.set(`${seat.row}-${seat.column}`, seat);
  });

  // Build the complete 2D grid of seats
  const gridCells = [];
  for (let r = 1; r <= totalRows; r++) {
    for (let c = 1; c <= totalCols; c++) {
      const seat = seatMap.get(`${r}-${c}`);
      gridCells.push({
        row: r,
        col: c,
        seat: seat || null,
      });
    }
  }

  // Helper to determine seat color styling based on section (A to F supported)
  const getSectionClass = (section) => {
    if (!section) return 'seat-empty';
    const s = section.toUpperCase().trim();
    if (s === 'A') return 'seat-section-a';
    if (s === 'B') return 'seat-section-b';
    if (s === 'C') return 'seat-section-c';
    if (s === 'D') return 'seat-section-d';
    if (s === 'E') return 'seat-section-e';
    if (s === 'F') return 'seat-section-f';
    return 'seat-section-default';
  };

  const occupiedCount = seatsList.filter((s) => s.studentName || s.studentId).length;
  const roomCapacity = room.capacity || totalRows * totalCols;

  return (
    <div className="seating-chart-card panel-card">
      {/* Room Header Info */}
      <div className="room-header">
        <div className="room-title-block">
          <h3 className="room-name">{room.roomName}</h3>
          <span className="room-invigilator">
            Invigilator: <strong>{room.invigilatorName || 'Unassigned'}</strong>
          </span>
        </div>

        <div className="room-occupancy-badge">
          <span>Occupancy:</span>
          <strong>{occupiedCount} / {roomCapacity}</strong>
        </div>
      </div>

      {/* Blackboard / Front of Hall Indicator */}
      <div className="room-stage-indicator">
        <span>FRONT / BLACKBOARD</span>
      </div>

      {/* Visual Seat Grid */}
      <div
        className="seat-grid"
        style={{
          gridTemplateColumns: `repeat(${totalCols}, minmax(90px, 1fr))`,
        }}
      >
        {gridCells.map(({ row, col, seat }) => {
          const hasStudent = seat && (seat.studentName || seat.rollNumber);
          const sectionClass = hasStudent ? getSectionClass(seat.section) : 'seat-empty';

          return (
            <div
              key={`${row}-${col}`}
              className={`seat-box ${sectionClass}`}
              title={
                hasStudent
                  ? `${seat.studentName} (${seat.rollNumber}) - Section ${seat.section} [Row ${row}, Col ${col}]`
                  : `Empty Seat [Row ${row}, Col ${col}]`
              }
            >
              <div className="seat-coord">R{row}:C{col}</div>
              {hasStudent ? (
                <>
                  <div className="seat-roll">{seat.rollNumber}</div>
                  <div className="seat-name">{seat.studentName}</div>
                  <div className="seat-section">Sec {seat.section}</div>
                </>
              ) : (
                <div className="empty-seat-label">Empty Seat</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SeatingChart;
