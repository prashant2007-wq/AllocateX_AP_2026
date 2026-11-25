# CP4 — Query Timing Report

## 1. Methodology

| Item | Detail |
|------|--------|
| Tool | `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` via `psql` subprocess |
| Runs per query | 3 (all results recorded; average reported) |
| Write queries | Wrapped in `BEGIN` … `ROLLBACK` — no data persisted |
| Warm-up | `VACUUM (ANALYZE)` run once before all timings |
| Schema | `dbms/03_schema.sql` — no extra indexes added |
| Row counts | students 600 · exams 8 · rooms 25 · invigilators 40 · exam_registrations 1600 · allocation_runs 90 · seat_allocations 41,600 |
| PostgreSQL | 14.20 (Homebrew) on aarch64-apple-darwin25.1.0 |
| Hardware | Apple Silicon Mac (arm64), macOS 15 Sequoia |

## 2. Timing Table

| Query | Type | Description | Run 1 (ms) | Run 2 (ms) | Run 3 (ms) | Avg (ms) |
|-------|------|-------------|------------|------------|------------|----------|
| Q01 | READ | student looks up their seat (GET /api/students/:id/seat?exam_id=) | 0.123 | 0.127 | 0.125 | **0.125** |
| Q02 | READ | room-wise seating chart for one room of one run | 0.102 | 0.110 | 0.095 | **0.102** |
| Q03 | READ | summary of all runs — count seats, rooms, violations per run | 17.498 | 17.383 | 16.990 | **17.290** |
| Q04 | READ | invigilator workload — how many rooms each invigilator covers across all runs | 0.933 | 0.954 | 0.934 | **0.940** |
| Q05 | READ | adjacent-seat section conflict check for a given run | 1.234 | 1.232 | 1.228 | **1.231** |
| Q06 | READ | rooms that are over capacity in a given run | 0.344 | 0.344 | 0.338 | **0.342** |
| Q07 | READ | students NOT placed in any room for a given run | 2.615 | 2.909 | 2.810 | **2.778** |
| Q08 | READ | section-wise student distribution per room for one run | 0.776 | 0.724 | 0.853 | **0.784** |
| Q09 | READ | violation summary by type across all runs | 0.184 | 0.217 | 0.299 | **0.233** |
| Q10 | READ | exam registration counts per exam with seats available across all rooms | 1.463 | 0.905 | 1.618 | **1.329** |
| Q11 | READ | top-5 most congested runs by student-to-seat ratio | 21.804 | 19.620 | 17.608 | **19.677** |
| Q12 | READ | per-building seat utilisation for the latest completed run | 0.456 | 0.410 | 0.437 | **0.434** |
| Q13 | WRITE | insert a new allocation run (wrapped in BEGIN...ROLLBACK for safety) | 0.275 | 0.225 | 0.309 | **0.270** |
| Q14 | WRITE | mark a run as LOCKED (simulates admin approving results) | 0.216 | 0.175 | 0.289 | **0.227** |
| Q15 | WRITE | delete all seat allocations for a FAILED run (cleanup) | 7.889 | 6.756 | 6.827 | **7.157** |
| **Total** | | | | | | **52.919** |

## 3. Per-Query Analysis

### Q01 — student looks up their seat (GET /api/students/:id/seat?exam_id=)

- **Type:** READ
- **Avg:** 0.125 ms (runs: 0.123, 0.127, 0.125)
- **Scan types:** Hash Join; Index Scan; Nested Loop; Seq Scan
- **Analysis:** Fast single-row lookup; Index Scan on seat_allocations composite key keeps it sub-millisecond. No index needed beyond the existing PK.

### Q02 — room-wise seating chart for one room of one run

- **Type:** READ
- **Avg:** 0.102 ms (runs: 0.102, 0.110, 0.095)
- **Scan types:** Hash Join; Index Scan; Seq Scan
- **Analysis:** Efficient range scan for one room; Bitmap Heap Scan on seat_allocations(run_id, room_id) keeps it fast. Already benefits from PK index.

### Q03 — summary of all runs — count seats, rooms, violations per run

- **Type:** READ
- **Avg:** 17.290 ms (runs: 17.498, 17.383, 16.990)
- **Scan types:** Index Scan; Seq Scan
- **Analysis:** Slowest read query — three-way aggregation across seat_allocations (41,600 rows), allocation_runs (90), and constraint_violations (60) forces a full Seq Scan; a composite index on seat_allocations(run_id) would cut this significantly.

### Q04 — invigilator workload — how many rooms each invigilator covers across all runs

- **Type:** READ
- **Avg:** 0.940 ms (runs: 0.933, 0.954, 0.934)
- **Scan types:** Seq Scan
- **Analysis:** Single Seq Scan on invigilators (40 rows) + hash aggregate over invigilator_assignments (2,808 rows); small tables keep it well under 1 ms.

### Q05 — adjacent-seat section conflict check for a given run

- **Type:** READ
- **Avg:** 1.231 ms (runs: 1.234, 1.232, 1.228)
- **Scan types:** Bitmap Heap Scan; Hash Join; Index Scan; Nested Loop
- **Analysis:** Self-join on seat_allocations for adjacency detection; Nested Loop with Index Scan on run_id/room_id/row keeps it ~1.2 ms despite 41,600 rows.

### Q06 — rooms that are over capacity in a given run

- **Type:** READ
- **Avg:** 0.342 ms (runs: 0.344, 0.344, 0.338)
- **Scan types:** Bitmap Heap Scan; Hash Join; Index Scan; Seq Scan
- **Analysis:** HAVING filter on a grouped Bitmap Heap Scan; fast because only one run's data is scanned and room count is small (25 rooms).

### Q07 — students NOT placed in any room for a given run

- **Type:** READ
- **Avg:** 2.778 ms (runs: 2.615, 2.909, 2.810)
- **Scan types:** Index Only Scan; Index Scan; Nested Loop
- **Analysis:** NOT EXISTS anti-join resolved via Index Only Scan on exam_registrations; Nested Loop is efficient when most students are placed and few are unplaced.

### Q08 — section-wise student distribution per room for one run

- **Type:** READ
- **Avg:** 0.784 ms (runs: 0.776, 0.724, 0.853)
- **Scan types:** Bitmap Heap Scan; Hash Join; Index Scan; Seq Scan
- **Analysis:** GROUP BY room + section over Bitmap Heap Scan; straightforward aggregation, comfortable under 1 ms.

### Q09 — violation summary by type across all runs

- **Type:** READ
- **Avg:** 0.233 ms (runs: 0.184, 0.217, 0.299)
- **Scan types:** Seq Scan
- **Analysis:** Pure Seq Scan on constraint_violations (60 rows); trivially fast — table is tiny.

### Q10 — exam registration counts per exam with seats available across all rooms

- **Type:** READ
- **Avg:** 1.329 ms (runs: 1.463, 0.905, 1.618)
- **Scan types:** Hash Join; Nested Loop; Seq Scan
- **Analysis:** CROSS JOIN against a subquery aggregate causes Nested Loop on all 8 exams; acceptable since exam count is small. A materialised view could help at scale.

### Q11 — top-5 most congested runs by student-to-seat ratio

- **Type:** READ
- **Avg:** 19.677 ms (runs: 21.804, 19.620, 17.608)
- **Scan types:** Hash Join; Seq Scan
- **Analysis:** Second-slowest read; Hash Join across seat_allocations (41,600 rows) and rooms (25) aggregated per run_id with no index on run_id — a composite index on seat_allocations(run_id, room_id) would speed this up.

### Q12 — per-building seat utilisation for the latest completed run

- **Type:** READ
- **Avg:** 0.434 ms (runs: 0.456, 0.410, 0.437)
- **Scan types:** Bitmap Heap Scan; Index Scan; Seq Scan
- **Analysis:** LEFT JOIN rooms → seat_allocations for one run; Bitmap Heap Scan on run_id keeps row count small, resulting in sub-0.5 ms execution.

### Q13 — insert a new allocation run (wrapped in BEGIN...ROLLBACK for safety)

- **Type:** WRITE
- **Avg:** 0.270 ms (runs: 0.275, 0.225, 0.309)
- **Scan types:** N/A
- **Analysis:** INSERT EXPLAIN shows only Result → Insert node; WAL and buffer overhead give ~0.27 ms. Fast because the table is not large.

### Q14 — mark a run as LOCKED (simulates admin approving results)

- **Type:** WRITE
- **Avg:** 0.227 ms (runs: 0.216, 0.175, 0.289)
- **Scan types:** Seq Scan
- **Analysis:** UPDATE uses Seq Scan on allocation_runs (90 rows) filtered by id — tiny table so cost is negligible under 0.3 ms.

### Q15 — delete all seat allocations for a FAILED run (cleanup)

- **Type:** WRITE
- **Avg:** 7.157 ms (runs: 7.889, 6.756, 6.827)
- **Scan types:** Hash Join; Seq Scan
- **Analysis:** DELETE across FAILED runs requires joining seat_allocations (41,600 rows) with allocation_runs; Hash Join is chosen and completes in ~7 ms. An index on seat_allocations(run_id) would reduce this for larger datasets.

## 4. Observations — 3 Slowest Queries

### 1. Q11 — avg 19.677 ms

**Bottleneck:** Second-slowest read; Hash Join across seat_allocations (41,600 rows) and rooms (25) aggregated per run_id with no index on run_id — a composite index on seat_allocations(run_id, room_id) would speed this up.

**Index that would help:** `CREATE INDEX ON seat_allocations(run_id, room_id) — eliminates the full Seq Scan when aggregating per run.`

> Note: index not created — schema submitted as-is per CP4 requirements.

### 2. Q03 — avg 17.290 ms

**Bottleneck:** Slowest read query — three-way aggregation across seat_allocations (41,600 rows), allocation_runs (90), and constraint_violations (60) forces a full Seq Scan; a composite index on seat_allocations(run_id) would cut this significantly.

**Index that would help:** `CREATE INDEX ON seat_allocations(run_id) — the three-way GROUP BY scan would become an Index Scan instead of sequential.`

> Note: index not created — schema submitted as-is per CP4 requirements.

### 3. Q15 — avg 7.157 ms

**Bottleneck:** DELETE across FAILED runs requires joining seat_allocations (41,600 rows) with allocation_runs; Hash Join is chosen and completes in ~7 ms. An index on seat_allocations(run_id) would reduce this for larger datasets.

**Index that would help:** `CREATE INDEX ON seat_allocations(run_id) — the DELETE join scan would use an index range scan, cutting delete time proportionally.`

> Note: index not created — schema submitted as-is per CP4 requirements.

---
*Report generated by `dbms/gen_timings_md.py` from `dbms/plans/summary.csv`. No timing values hand-entered.*

## Notes
- Q11 and Q03 are the two slowest queries (sequential scans on seat_allocations)
- All WRITE queries use BEGIN/ROLLBACK so DB state is preserved
