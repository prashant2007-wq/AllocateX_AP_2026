# AllocateX: Database Normalization (1NF, 2NF, 3NF, BCNF)

This document normalizes the database tables of AllocateX, our exam seating, room and invigilator allocation system. It is a database design exercise on our own tables (1NF, 2NF, 3NF, with BCNF checked as a bonus). Every solver execution is stored as a versioned run.

## Starting point: unnormalized table (UNF)

An admin could keep everything in one flat seating sheet:

SEATING_SHEET(run_id, run_date, slot, status, created_by, roll_no, student_name, section, semester, course_code, duration_min, room_name, building, room_capacity, num_rows, num_cols, seat_row, seat_col, invigilators)

Sample rows (status, created_by, num_rows and num_cols are omitted here for width):

| run_id | run_date | slot | roll_no | student_name | section | semester | course_code | duration_min | room_name | building | room_capacity | seat_row | seat_col | invigilators |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-12-01 | MORNING | 25B101 | Aman | B | 3 | CS201 | 180 | R101 | Main | 30 | 1 | 1 | Dr. Rao (CSE, 2), Dr. Iyer (MATH, 3) |
| 1 | 2026-12-01 | MORNING | 25B102 | Riya | B | 3 | CS201 | 180 | R101 | Main | 30 | 1 | 3 | Dr. Rao (CSE, 2), Dr. Iyer (MATH, 3) |
| 1 | 2026-12-01 | MORNING | 25A201 | Kiran | A | 3 | MA101 | 120 | R102 | Main | 20 | 2 | 2 | Dr. Sen (MATH, 2) |

Problems: the invigilators cell holds several values, and student, room and exam facts are repeated on every row.

## Functional dependencies (FDs)

These FDs hold in the AllocateX domain:

- FD1: run_id -> run_date, slot, status, created_by
- FD2: roll_no -> student_name, section, semester
- FD3: course_code, exam_date, exam_slot -> duration_min (an exam is identified by its course, date and slot; a run covers one date and slot, so run_date and slot play the role of exam_date and exam_slot)
- FD4: room_name -> building, room_capacity, num_rows, num_cols
- FD5: invigilator_name -> department, max_exams_per_day
- FD6: run_id, roll_no, course_code -> room_name, seat_row, seat_col (one seat per student per exam per run)
- FD7: run_id, room_name, seat_row, seat_col -> roll_no, course_code (a seat holds one student per run)
- FD8: run_id, invigilator_name -> room_name (an invigilator is in one room per run)

## 1NF

Rule: every attribute is atomic and there are no repeating groups.
Violation: the invigilators column holds several invigilators in one cell.
Fix: one invigilator per row. Key of the relation: (run_id, roll_no, course_code, invigilator_name).

SEATING_1NF after unfolding (selected columns):

| run_id | roll_no | student_name | section | course_code | duration_min | room_name | building | room_capacity | seat_row | seat_col | invigilator_name | department | max_exams_per_day |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 25B101 | Aman | B | CS201 | 180 | R101 | Main | 30 | 1 | 1 | Dr. Rao | CSE | 2 |
| 1 | 25B101 | Aman | B | CS201 | 180 | R101 | Main | 30 | 1 | 1 | Dr. Iyer | MATH | 3 |
| 1 | 25B102 | Riya | B | CS201 | 180 | R101 | Main | 30 | 1 | 3 | Dr. Rao | CSE | 2 |
| 1 | 25B102 | Riya | B | CS201 | 180 | R101 | Main | 30 | 1 | 3 | Dr. Iyer | MATH | 3 |
| 1 | 25A201 | Kiran | A | MA101 | 120 | R102 | Main | 20 | 2 | 2 | Dr. Sen | MATH | 2 |

The table is now in 1NF, but it still has anomalies:
- Update anomaly: if Aman moves from section B to C, two rows must change (and every future run).
- Insert anomaly: a new room R103 or a new invigilator Dr. Das cannot be stored until they appear in a run, because key columns would be NULL.
- Delete anomaly: deleting Kiran's only row also deletes the facts about room R102 and Dr. Sen.

## 2NF

Rule: 1NF, and no non-key attribute depends on only part of the composite key.
Violations (partial dependencies on the key (run_id, roll_no, course_code, invigilator_name)):
- FD1: run_id -> run attributes (depends on run_id only)
- FD2: roll_no -> student attributes (depends on roll_no only)
- FD3: course_code (with the run's date and slot) -> duration_min
- FD5: invigilator_name -> department, max_exams_per_day
- FD6: room and seat depend on (run_id, roll_no, course_code) and do not need invigilator_name

Fix: decompose so each attribute depends on the whole key of its table.

RUN(**run_id**, run_date, slot, status, created_by)

| run_id | run_date | slot | status | created_by |
|---|---|---|---|---|
| 1 | 2026-12-01 | MORNING | COMPLETED | admin |

STUDENT(**roll_no**, student_name, section, semester)

| roll_no | student_name | section | semester |
|---|---|---|---|
| 25B101 | Aman | B | 3 |
| 25B102 | Riya | B | 3 |
| 25A201 | Kiran | A | 3 |

EXAM(**course_code, exam_date, exam_slot**, duration_min)

| course_code | exam_date | exam_slot | duration_min |
|---|---|---|---|
| CS201 | 2026-12-01 | MORNING | 180 |
| MA101 | 2026-12-01 | MORNING | 120 |

INVIGILATOR(**invigilator_name**, department, max_exams_per_day)

| invigilator_name | department | max_exams_per_day |
|---|---|---|
| Dr. Rao | CSE | 2 |
| Dr. Iyer | MATH | 3 |
| Dr. Sen | MATH | 2 |

EXAM_REGISTRATION(**roll_no, course_code**) (who is giving which exam; it exists before any run)

| roll_no | course_code |
|---|---|
| 25B101 | CS201 |
| 25B102 | CS201 |
| 25A201 | MA101 |

SEAT_ALLOCATION(**run_id, roll_no, course_code**, room_name, building, room_capacity, seat_row, seat_col)

| run_id | roll_no | course_code | room_name | building | room_capacity | seat_row | seat_col |
|---|---|---|---|---|---|---|---|
| 1 | 25B101 | CS201 | R101 | Main | 30 | 1 | 1 |
| 1 | 25B102 | CS201 | R101 | Main | 30 | 1 | 3 |
| 1 | 25A201 | MA101 | R102 | Main | 20 | 2 | 2 |

INVIGILATOR_ASSIGNMENT(**run_id, room_name, invigilator_name**)

| run_id | room_name | invigilator_name |
|---|---|---|
| 1 | R101 | Dr. Rao |
| 1 | R101 | Dr. Iyer |
| 1 | R102 | Dr. Sen |

Result: no partial dependencies remain, so the design is in 2NF. The anomalies for students and invigilators are gone, but SEAT_ALLOCATION still repeats room facts (building and capacity of R101 appear twice).

## 3NF

Rule: 2NF, and no transitive dependency (a non-key attribute depending on another non-key attribute).
Violation in SEAT_ALLOCATION: (run_id, roll_no, course_code) -> room_name, and room_name -> building, room_capacity, num_rows, num_cols (FD4). So building and capacity depend on the key only through room_name.
Fix: extract ROOM.

ROOM(**room_name**, building, capacity, num_rows, num_cols)

| room_name | building | capacity | num_rows | num_cols |
|---|---|---|---|---|
| R101 | Main | 30 | 6 | 5 |
| R102 | Main | 20 | 4 | 5 |

SEAT_ALLOCATION(**run_id, roll_no, course_code**, room_name, seat_row, seat_col)

| run_id | roll_no | course_code | room_name | seat_row | seat_col |
|---|---|---|---|---|---|
| 1 | 25B101 | CS201 | R101 | 1 | 1 |
| 1 | 25B102 | CS201 | R101 | 1 | 3 |
| 1 | 25A201 | MA101 | R102 | 2 | 2 |

Now a room's capacity is stored once. Changing R101's capacity is one update, and a new room can be inserted before it is ever used. We check each table: RUN, STUDENT, EXAM, INVIGILATOR, ROOM, EXAM_REGISTRATION, SEAT_ALLOCATION and INVIGILATOR_ASSIGNMENT have no transitive dependencies, so the design is in 3NF.

## Final physical design (surrogate keys)

For the application we add surrogate keys (id) and keep the natural keys as UNIQUE. We also add the constraint_violations audit table (violation_type and details per run). The final 9 tables:

| Final table | Primary key | Other candidate keys | Derived from |
|---|---|---|---|
| students | id | roll_no | STUDENT |
| exams | id | (course_code, exam_date, exam_slot) | EXAM |
| rooms | id | name | ROOM |
| invigilators | id | none | INVIGILATOR |
| exam_registrations | (exam_id, student_id) | none | EXAM_REGISTRATION |
| allocation_runs | id | none | RUN |
| seat_allocations | id | (run_id, student_id, exam_id), (run_id, room_id, seat_row, seat_col) | SEAT_ALLOCATION |
| invigilator_assignments | id | (run_id, room_id, invigilator_id), (run_id, invigilator_id) | INVIGILATOR_ASSIGNMENT |
| constraint_violations | id | none | audit trail |

## BCNF check (optional)

BCNF requires every determinant of a non-trivial FD to be a candidate key. Checking each final table: students (id, roll_no), exams (id, and (course_code, exam_date, exam_slot) for FD3), rooms (id, name for FD4), invigilators (id), seat_allocations (both candidate keys cover FD6 and FD7), invigilator_assignments ((run_id, invigilator_id) covers FD8), exam_registrations, allocation_runs and constraint_violations (the key is the only determinant). All 9 tables are in BCNF.

## Design notes

- allocation_runs stores exam_date and exam_slot because a run covers one date and slot for many exams; this is not a transitive dependency.
- rooms.capacity <= num_rows * num_cols allows for broken seats and odd room shapes.
- constraint_violations.details_json is a JSONB payload used only for display in the audit trail; we never filter on its inner keys, so we treat it as one atomic value.
- Every solver execution is a new allocation_runs row, which gives versioning (compare run 3 and run 5, or roll back).

## UNF anomaly summary

The unnormalized SEATING_SHEET violates 1NF because invigilators is a multi-valued attribute (comma-separated names and departments in one cell). This single violation cascades into update, insert and delete anomalies throughout the flat sheet, motivating the full normalization walk-through above.
