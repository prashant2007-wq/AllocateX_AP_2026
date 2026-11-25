TRUNCATE constraint_violations, invigilator_assignments, seat_allocations, allocation_runs,
         exam_registrations, invigilators, rooms, exams, students RESTART IDENTITY CASCADE;

INSERT INTO students(roll_no, name, section, semester)
SELECT 'R25' || lpad(g::text, 4, '0'), 'Student ' || g, (ARRAY['A','B','C','D','E'])[1 + (g % 5)], 1 + (g % 8)
FROM generate_series(1, 600) g;

INSERT INTO exams(course_code, exam_date, exam_slot, duration_min) VALUES
('CS201','2026-12-01','MORNING',180),('MA101','2026-12-01','MORNING',180),
('PH101','2026-12-01','MORNING',120),('EC101','2026-12-01','MORNING',180),
('CS301','2026-12-01','AFTERNOON',180),('ME101','2026-12-01','AFTERNOON',120),
('CS401','2026-12-02','MORNING',180),('HS101','2026-12-02','MORNING',90);

INSERT INTO rooms(name, capacity, num_rows, num_cols, building)
SELECT 'R' || (100 + g), 30, 6, 5, (ARRAY['Main','Science','Annex'])[1 + (g % 3)]
FROM generate_series(1, 25) g;

INSERT INTO invigilators(name, department, max_exams_per_day)
SELECT 'Dr. Invigilator ' || g, (ARRAY['CSE','MATH','PHY','ECE','ME','HUM'])[1 + (g % 6)], 2
FROM generate_series(1, 40) g;

INSERT INTO exam_registrations(exam_id, student_id)
SELECT 1 + (s.id % 4), s.id FROM students s
UNION ALL SELECT 5 + (s.id % 2), s.id FROM students s
UNION ALL SELECT 7 + (s.id % 2), s.id FROM students s WHERE s.id <= 400;

INSERT INTO allocation_runs(exam_date, exam_slot, created_at, status, created_by)
SELECT sl.d, sl.slot,
       timestamptz '2026-11-15 09:00:00+05:30' + (g * interval '1 hour') + (sl.ord * interval '1 minute'),
       CASE WHEN g % 10 = 0 THEN 'PARTIAL' WHEN g % 7 = 0 THEN 'FAILED' ELSE 'COMPLETED' END,
       'admin'
FROM (VALUES (1, DATE '2026-12-01', 'MORNING'), (2, DATE '2026-12-01', 'AFTERNOON'), (3, DATE '2026-12-02', 'MORNING')) AS sl(ord, d, slot)
CROSS JOIN generate_series(1, 30) g
ORDER BY sl.ord, g;

UPDATE allocation_runs SET status = 'LOCKED' WHERE id IN (29, 59, 89);

-- interleave exams so neighbouring seats belong to different exams; shift rooms per run so runs differ
INSERT INTO seat_allocations(run_id, exam_id, student_id, room_id, seat_row, seat_col)
SELECT r.id, x.exam_id, x.student_id,
       (((x.pos / 30) + r.id) % 25) + 1, ((x.pos % 30) / 5) + 1, (x.pos % 5) + 1
FROM allocation_runs r
CROSS JOIN LATERAL (
  SELECT t.exam_id, t.student_id, (row_number() OVER (ORDER BY t.k, t.exam_id) - 1)::int AS pos
  FROM (
    SELECT er.exam_id, er.student_id,
           row_number() OVER (PARTITION BY er.exam_id ORDER BY er.student_id) AS k
    FROM exam_registrations er JOIN exams e ON e.id = er.exam_id
    WHERE e.exam_date = r.exam_date AND e.exam_slot = r.exam_slot
  ) t
) x
WHERE r.status <> 'FAILED';

WITH used AS (
  SELECT run_id, room_id, row_number() OVER (PARTITION BY run_id ORDER BY room_id) AS n
  FROM (SELECT DISTINCT run_id, room_id FROM seat_allocations) u
)
INSERT INTO invigilator_assignments(run_id, room_id, invigilator_id)
SELECT run_id, room_id, n FROM used
UNION ALL
SELECT run_id, room_id, n + 20 FROM used;

INSERT INTO constraint_violations(run_id, violation_type, details_json)
SELECT r.id, 'ROOM_OVERCAPACITY', jsonb_build_object('room', 'R105', 'over_by', 1 + (r.id % 5))
FROM allocation_runs r WHERE r.status IN ('PARTIAL','FAILED')
UNION ALL
SELECT r.id, 'UNPLACED_STUDENT', jsonb_build_object('roll_no', 'R25' || lpad((1 + (r.id % 600))::text, 4, '0'))
FROM allocation_runs r WHERE r.status = 'FAILED'
UNION ALL
SELECT r.id, 'ADJACENT_SAME_SECTION', jsonb_build_object('seat_a', '1,1', 'seat_b', '1,2')
FROM allocation_runs r WHERE r.id % 5 = 0
UNION ALL
SELECT r.id, 'NO_INVIGILATOR', jsonb_build_object('room', 'R110')
FROM allocation_runs r WHERE r.status = 'PARTIAL';

VACUUM (ANALYZE);

-- Seed verified: students=600, exams=8, rooms=25, invigilators=40,
--   exam_registrations=1600, allocation_runs=90, seat_allocations=41600
