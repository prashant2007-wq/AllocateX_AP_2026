-- AllocateX schema (PostgreSQL 15+). Runs top-to-bottom on an empty database.
DROP TABLE IF EXISTS constraint_violations, invigilator_assignments, seat_allocations,
  allocation_runs, exam_registrations, invigilators, rooms, exams, students CASCADE;

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  roll_no VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  section VARCHAR(10) NOT NULL,
  semester SMALLINT NOT NULL,
  CONSTRAINT chk_students_semester CHECK (semester BETWEEN 1 AND 8),
  CONSTRAINT chk_students_roll CHECK (roll_no ~ '^[A-Za-z0-9]+$')
);

CREATE TABLE exams (
  id SERIAL PRIMARY KEY,
  course_code VARCHAR(15) NOT NULL,
  exam_date DATE NOT NULL,
  exam_slot VARCHAR(10) NOT NULL,
  duration_min SMALLINT NOT NULL,
  CONSTRAINT uq_exam UNIQUE (course_code, exam_date, exam_slot),
  CONSTRAINT chk_exams_slot CHECK (exam_slot IN ('MORNING','AFTERNOON')),
  CONSTRAINT chk_exams_duration CHECK (duration_min BETWEEN 30 AND 300)
);

CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  capacity SMALLINT NOT NULL,
  num_rows SMALLINT NOT NULL,
  num_cols SMALLINT NOT NULL,
  building VARCHAR(50) NOT NULL,
  CONSTRAINT chk_rooms_dims CHECK (num_rows > 0 AND num_cols > 0),
  CONSTRAINT chk_rooms_capacity CHECK (capacity > 0 AND capacity <= num_rows * num_cols)
);

CREATE TABLE invigilators (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  max_exams_per_day SMALLINT NOT NULL DEFAULT 2,
  CONSTRAINT chk_inv_max CHECK (max_exams_per_day BETWEEN 1 AND 5)
);

CREATE TABLE exam_registrations (
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (exam_id, student_id)
);

CREATE TABLE allocation_runs (
  id SERIAL PRIMARY KEY,
  exam_date DATE NOT NULL,
  exam_slot VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(12) NOT NULL DEFAULT 'DRAFT',
  created_by VARCHAR(50) NOT NULL,
  CONSTRAINT chk_runs_slot CHECK (exam_slot IN ('MORNING','AFTERNOON')),
  CONSTRAINT chk_runs_status CHECK (status IN ('DRAFT','COMPLETED','PARTIAL','FAILED','LOCKED'))
);

CREATE TABLE seat_allocations (
  id SERIAL PRIMARY KEY,
  run_id INTEGER NOT NULL REFERENCES allocation_runs(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  seat_row SMALLINT NOT NULL,
  seat_col SMALLINT NOT NULL,
  CONSTRAINT fk_seat_registration FOREIGN KEY (exam_id, student_id)
    REFERENCES exam_registrations(exam_id, student_id) ON DELETE CASCADE,
  CONSTRAINT uq_seat_student_per_run UNIQUE (run_id, student_id, exam_id),
  CONSTRAINT uq_seat_position_per_run UNIQUE (run_id, room_id, seat_row, seat_col),
  CONSTRAINT chk_seat_pos CHECK (seat_row >= 1 AND seat_col >= 1)
);

CREATE TABLE invigilator_assignments (
  id SERIAL PRIMARY KEY,
  run_id INTEGER NOT NULL REFERENCES allocation_runs(id) ON DELETE CASCADE,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  invigilator_id INTEGER NOT NULL REFERENCES invigilators(id) ON DELETE RESTRICT,
  CONSTRAINT uq_assign_room_inv UNIQUE (run_id, room_id, invigilator_id),
  CONSTRAINT uq_assign_inv_per_run UNIQUE (run_id, invigilator_id)
);

CREATE TABLE constraint_violations (
  id SERIAL PRIMARY KEY,
  run_id INTEGER NOT NULL REFERENCES allocation_runs(id) ON DELETE CASCADE,
  violation_type VARCHAR(40) NOT NULL,
  details_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_violation_type CHECK (violation_type IN
    ('ROOM_OVERCAPACITY','ADJACENT_SAME_SECTION','NO_INVIGILATOR','INVIGILATOR_OVERLOAD','ROOM_UNAVAILABLE','UNPLACED_STUDENT'))
);
