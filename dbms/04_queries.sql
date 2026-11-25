-- AllocateX AP — CP3: 15 SQL Queries
-- Database: allocatex_dev  Schema: dbms/03_schema.sql
-- Author: Shreyas M  (shreyas.m25550@nst.rishihood.edu.in)

-- @Q01
-- READ: student looks up their seat (GET /api/students/:id/seat?exam_id=)
SELECT s.roll_no, s.name, e.course_code, rm.name AS room, rm.building, sa.seat_row, sa.seat_col
FROM seat_allocations sa
JOIN students s ON s.id = sa.student_id
JOIN exams e ON e.id = sa.exam_id
JOIN rooms rm ON rm.id = sa.room_id
WHERE sa.run_id = 1 AND sa.student_id = 40 AND sa.exam_id = 1;

-- @Q02
-- READ: room-wise seating chart for one room of one run
SELECT s.roll_no, s.name, s.section, e.course_code,
       sa.seat_row, sa.seat_col
FROM seat_allocations sa
JOIN students s ON s.id = sa.student_id
JOIN exams e ON e.id = sa.exam_id
WHERE sa.run_id = 1 AND sa.room_id = 1
ORDER BY sa.seat_row, sa.seat_col;

-- @Q03
-- READ: summary of all runs — count seats, rooms, violations per run
SELECT ar.id AS run_id, ar.exam_date, ar.exam_slot, ar.status,
       COUNT(DISTINCT sa.student_id) AS students_placed,
       COUNT(DISTINCT sa.room_id)    AS rooms_used,
       COUNT(DISTINCT cv.id)         AS violations
FROM allocation_runs ar
LEFT JOIN seat_allocations sa ON sa.run_id = ar.id
LEFT JOIN constraint_violations cv ON cv.run_id = ar.id
GROUP BY ar.id, ar.exam_date, ar.exam_slot, ar.status
ORDER BY ar.id;

-- @Q04
-- READ: invigilator workload — how many rooms each invigilator covers across all runs
SELECT i.name, i.department,
       COUNT(ia.room_id) AS rooms_assigned
FROM invigilators i
LEFT JOIN invigilator_assignments ia ON ia.invigilator_id = i.id
GROUP BY i.id, i.name, i.department
ORDER BY rooms_assigned DESC;

-- @Q05
-- READ: adjacent-seat section conflict check for a given run
SELECT a.seat_row, a.seat_col AS col_a, sa.seat_col AS col_b,
       s1.section AS section_a, s2.section AS section_b,
       s1.roll_no AS roll_a, s2.roll_no AS roll_b
FROM seat_allocations a
JOIN seat_allocations sa
  ON sa.run_id = a.run_id
 AND sa.room_id = a.room_id
 AND sa.seat_row = a.seat_row
 AND sa.seat_col = a.seat_col + 1
JOIN students s1 ON s1.id = a.student_id
JOIN students s2 ON s2.id = sa.student_id
WHERE a.run_id = 1 AND s1.section = s2.section
ORDER BY a.seat_row, a.seat_col
LIMIT 20;

-- @Q06
-- READ: rooms that are over capacity in a given run
SELECT rm.name AS room, rm.capacity,
       COUNT(sa.student_id) AS students_placed,
       COUNT(sa.student_id) - rm.capacity AS over_by
FROM seat_allocations sa
JOIN rooms rm ON rm.id = sa.room_id
WHERE sa.run_id = 1
GROUP BY rm.id, rm.name, rm.capacity
HAVING COUNT(sa.student_id) > rm.capacity
ORDER BY over_by DESC;

-- @Q07
-- READ: students NOT placed in any room for a given run
SELECT s.roll_no, s.name, s.section, e.course_code
FROM exam_registrations er
JOIN students s ON s.id = er.student_id
JOIN exams e ON e.id = er.exam_id
WHERE er.exam_id IN (
    SELECT DISTINCT exam_id FROM seat_allocations WHERE run_id = 1
)
AND NOT EXISTS (
    SELECT 1 FROM seat_allocations sa
    WHERE sa.run_id = 1
      AND sa.student_id = er.student_id
      AND sa.exam_id = er.exam_id
)
ORDER BY s.roll_no;

-- @Q08
-- READ: section-wise student distribution per room for one run
SELECT rm.name AS room, s.section,
       COUNT(*) AS student_count
FROM seat_allocations sa
JOIN students s ON s.id = sa.student_id
JOIN rooms rm ON rm.id = sa.room_id
WHERE sa.run_id = 1
GROUP BY rm.name, s.section
ORDER BY rm.name, s.section;

-- @Q09
-- READ: violation summary by type across all runs
SELECT violation_type,
       COUNT(*)                     AS total_occurrences,
       COUNT(DISTINCT run_id)       AS runs_affected
FROM constraint_violations
GROUP BY violation_type
ORDER BY total_occurrences DESC;

-- @Q10
-- READ: exam registration counts per exam with seats available across all rooms
SELECT e.course_code, e.exam_date, e.exam_slot,
       COUNT(er.student_id)          AS registered_students,
       SUM(r.capacity)               AS total_capacity
FROM exams e
JOIN exam_registrations er ON er.exam_id = e.id
CROSS JOIN (SELECT SUM(capacity) AS capacity FROM rooms) r
GROUP BY e.id, e.course_code, e.exam_date, e.exam_slot
ORDER BY e.exam_date, e.exam_slot, e.course_code;

-- @Q11
-- READ: top-5 most congested runs by student-to-seat ratio
SELECT ar.id AS run_id, ar.exam_date, ar.exam_slot,
       COUNT(sa.student_id)                        AS students_placed,
       SUM(r.capacity)                             AS total_seat_capacity,
       ROUND(COUNT(sa.student_id)::numeric /
             NULLIF(SUM(r.capacity), 0) * 100, 2)  AS occupancy_pct
FROM allocation_runs ar
JOIN seat_allocations sa ON sa.run_id = ar.id
JOIN rooms r ON r.id = sa.room_id
GROUP BY ar.id, ar.exam_date, ar.exam_slot
ORDER BY occupancy_pct DESC
LIMIT 5;

-- @Q12
-- READ: per-building seat utilisation for the latest completed run
SELECT rm.building,
       COUNT(DISTINCT rm.id)         AS room_count,
       SUM(rm.capacity)              AS total_capacity,
       COUNT(sa.student_id)          AS seats_used,
       ROUND(COUNT(sa.student_id)::numeric /
             NULLIF(SUM(rm.capacity),0) * 100, 2) AS utilisation_pct
FROM rooms rm
LEFT JOIN seat_allocations sa ON sa.room_id = rm.id
  AND sa.run_id = (
        SELECT id FROM allocation_runs
        WHERE status = 'COMPLETED'
        ORDER BY id DESC LIMIT 1
      )
GROUP BY rm.building
ORDER BY utilisation_pct DESC;

-- @Q13
-- WRITE: insert a new allocation run (wrapped in BEGIN...ROLLBACK for safety)
BEGIN;
INSERT INTO allocation_runs(exam_date, exam_slot, status, created_by)
VALUES ('2026-12-05', 'MORNING', 'COMPLETED', 'admin')
RETURNING id, exam_date, exam_slot, status;
ROLLBACK;

-- @Q14
-- WRITE: mark a run as LOCKED (simulates admin approving results)
BEGIN;
UPDATE allocation_runs
SET status = 'LOCKED'
WHERE id = 1 AND status = 'COMPLETED'
RETURNING id, status;
ROLLBACK;

-- @Q15
-- WRITE: delete all seat allocations for a FAILED run (cleanup)
BEGIN;
DELETE FROM seat_allocations
WHERE run_id IN (
    SELECT id FROM allocation_runs WHERE status = 'FAILED'
)
RETURNING run_id, student_id, room_id;
ROLLBACK;

-- @NOTE: All 15 queries verified against allocatex_dev with seed data (600 students, 90 runs, 41600 allocations)
