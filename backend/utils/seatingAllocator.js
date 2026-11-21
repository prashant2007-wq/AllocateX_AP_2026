/**
 * Seating Allocator Utility
 * 
 * Implements the core constraint-satisfaction allocation algorithm for AllocateX:
 * 1. Bin Packing (First-Fit Decreasing): Sorts rooms by capacity in descending order.
 * 2. Seat Adjacency (Graph Coloring): Ensures no two students from the same section
 *    sit adjacent to each other (checks left and above neighbors).
 * 3. Invigilator Assignment: Pairs available invigilators with occupied rooms.
 */

/**
 * Generates room and seating allocations for an exam
 * 
 * @param {Object} exam - The exam object
 * @param {Array} students - Array of student objects registered for the exam
 * @param {Array} rooms - Array of active room objects
 * @param {Array} invigilators - Array of invigilator objects
 * @returns {Object} Allocation results including rooms, seat charts, and warnings
 */
export function generateAllocation(exam, students, rooms, invigilators) {
  // Tracking counters and result collections
  let allocated = 0;
  let unallocated = 0;
  const warnings = [];
  const roomAllocations = [];

  // Clone students array so we don't mutate the original input
  let remainingStudents = [...students];

  // Clone invigilators array for shifting as rooms are processed
  const availableInvigilators = [...invigilators];

  // Sort rooms by total capacity (rows * columns) in descending order (First-Fit Decreasing)
  const sortedRooms = [...rooms].sort((a, b) => {
    const capacityA = a.rows * a.columns;
    const capacityB = b.rows * b.columns;
    return capacityB - capacityA;
  });

  // Iterate through each room and allocate seats
  for (let i = 0; i < sortedRooms.length; i++) {
    const room = sortedRooms[i];

    // If all students have been placed, stop allocating more rooms
    if (remainingStudents.length === 0) {
      break;
    }

    // Assign the next available invigilator from the pool
    const assignedInvigilator = availableInvigilators.shift();
    let invigilatorId = null;
    let invigilatorName = "Unassigned";

    if (assignedInvigilator) {
      invigilatorId = assignedInvigilator._id;
      invigilatorName = assignedInvigilator.name;
    } else {
      warnings.push(`Not enough invigilators for room: ${room.roomName}`);
    }

    // Array to store seat allocations for this room
    const seats = [];

    // Lookup map to quickly check assigned students at (row, column)
    // Key format: `${row},${col}` -> student object
    const gridMap = {};

    // Fill seats row-by-row, column-by-column
    for (let r = 1; r <= room.rows; r++) {
      for (let c = 1; c <= room.columns; c++) {
        // If no more students left to seat, stop filling this room
        if (remainingStudents.length === 0) {
          break;
        }

        // Check the section of the neighbor to the left (r, c-1)
        const leftNeighbor = gridMap[`${r},${c - 1}`];
        const leftSection = leftNeighbor ? leftNeighbor.section : null;

        // Check the section of the neighbor above (r-1, c)
        const aboveNeighbor = gridMap[`${r - 1},${c}`];
        const aboveSection = aboveNeighbor ? aboveNeighbor.section : null;

        // Find the first student whose section does NOT match left or above neighbors
        let studentIndex = remainingStudents.findIndex((student) => {
          return student.section !== leftSection && student.section !== aboveSection;
        });

        let selectedStudent = null;

        if (studentIndex !== -1) {
          // Valid student found without adjacency conflict
          selectedStudent = remainingStudents.splice(studentIndex, 1)[0];
        } else {
          // Fallback: Adjacency conflict unavoidable, pick the first remaining student
          selectedStudent = remainingStudents.splice(0, 1)[0];
          warnings.push(`Adjacency rule violated in room ${room.roomName}`);
        }

        // Record the student in our grid map for subsequent neighbor lookups
        gridMap[`${r},${c}`] = selectedStudent;

        // Add the seat details to this room's seats array
        seats.push({
          row: r,
          column: c,
          studentId: selectedStudent._id,
          studentName: selectedStudent.name,
          rollNumber: selectedStudent.rollNumber,
          section: selectedStudent.section,
        });

        // Increment successfully allocated counter
        allocated++;
      }

      // If students ran out inside the column loop, exit the row loop as well
      if (remainingStudents.length === 0) {
        break;
      }
    }

    // Add this room and its seat allocations to our room results
    roomAllocations.push({
      roomId: room._id,
      roomName: room.roomName,
      capacity: room.rows * room.columns,
      rows: room.rows,
      columns: room.columns,
      invigilatorId: invigilatorId,
      invigilatorName: invigilatorName,
      seats: seats,
    });
  }

  // Count students who couldn't be placed due to room capacity shortages
  unallocated = remainingStudents.length;

  if (unallocated > 0) {
    warnings.push(`Insufficient capacity: ${unallocated} students could not be allocated seats.`);
  }

  // Return the complete allocation summary
  return {
    rooms: roomAllocations,
    totalStudents: students.length,
    allocatedStudents: allocated,
    unallocatedStudents: unallocated,
    warnings: warnings,
  };
}

export default generateAllocation;
