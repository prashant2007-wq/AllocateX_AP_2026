# DBMS Module — AllocateX AP 2026

## Checkpoint Files

| CP | File(s) | Status |
|----|---------|--------|
| CP1 | `01_normalization.md` | ✅ Submitted |
| CP2 | `02_er_diagram.*`, `03_schema.sql` | ✅ Submitted |
| CP3 | `04_queries.sql` | ✅ Submitted |
| CP4 | `05_query_timings.md`, `plans/` | ✅ Submitted |

## How to Reproduce

```bash
# 1. Rebuild DB from schema
dropdb --if-exists allocatex_dev && createdb allocatex_dev
psql -d allocatex_dev -v ON_ERROR_STOP=1 -f dbms/03_schema.sql

# 2. Load seed data
psql -d allocatex_dev -v ON_ERROR_STOP=1 -f dbms/seed.sql

# 3. Run all queries
psql -d allocatex_dev -f dbms/04_queries.sql

# 4. Re-run timings (regenerates plans/ and summary.csv)
python3 dbms/run_timings.py

# 5. Regenerate 05_query_timings.md from CSV
python3 dbms/gen_timings_md.py
```

## Seed Data Summary

| Table | Rows |
|-------|------|
| students | 600 |
| exams | 8 |
| rooms | 25 |
| invigilators | 40 |
| exam_registrations | 1,600 |
| allocation_runs | 90 |
| seat_allocations | 41,600 |
| invigilator_assignments | 2,808 |
| constraint_violations | 60 |
