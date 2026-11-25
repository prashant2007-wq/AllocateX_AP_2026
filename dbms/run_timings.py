#!/usr/bin/env python3
"""
dbms/run_timings.py
Run each query in 04_queries.sql 3 times with EXPLAIN (ANALYZE, BUFFERS),
save per-query plan files to dbms/plans/Qnn.txt, and write dbms/plans/summary.csv.
WRITE queries are wrapped in BEGIN ... ROLLBACK automatically.
"""

import subprocess, re, csv, os, sys

DBNAME   = "allocatex_dev"
SQL_FILE = os.path.join(os.path.dirname(__file__), "04_queries.sql")
PLANS_DIR = os.path.join(os.path.dirname(__file__), "plans")
CSV_OUT  = os.path.join(PLANS_DIR, "summary.csv")
RUNS     = 3

os.makedirs(PLANS_DIR, exist_ok=True)

def psql(sql: str) -> str:
    result = subprocess.run(
        ["psql", "-X", "-d", DBNAME, "-c", sql],
        capture_output=True, text=True
    )
    return result.stdout + result.stderr

def psql_explain_write(explain_sql: str) -> str:
    """Run EXPLAIN (ANALYZE) for a DML query inside a transaction using separate -c flags."""
    result = subprocess.run(
        ["psql", "-X", "-d", DBNAME,
         "-c", "BEGIN;",
         "-c", explain_sql,
         "-c", "ROLLBACK;"],
        capture_output=True, text=True
    )
    return result.stdout + result.stderr

# VACUUM ANALYZE first
print("Running VACUUM (ANALYZE)...")
psql("VACUUM (ANALYZE);")
print("Done.\n")

# Parse 04_queries.sql into blocks
with open(SQL_FILE) as f:
    raw = f.read()

# Split on -- @Qnn markers
blocks = re.split(r'(?=-- @Q\d{2})', raw)
queries = []
for block in blocks:
    block = block.strip()
    if not block.startswith("-- @Q"):
        continue
    lines = block.splitlines()
    tag   = re.search(r'@(Q\d{2})', lines[0]).group(1)
    rw    = "WRITE" if "-- WRITE:" in lines[1] else "READ"
    desc  = lines[1].replace("-- READ:", "").replace("-- WRITE:", "").strip()
    # Collect SQL (skip the two comment header lines)
    sql_lines = [l for l in lines[2:] if l.strip()]
    sql_body  = "\n".join(sql_lines).strip()

    # For WRITE queries, strip the outer BEGIN / ROLLBACK we already wrote
    # (we'll add our own around EXPLAIN)
    if rw == "WRITE":
        sql_body = re.sub(r'^\s*BEGIN\s*;', '', sql_body, flags=re.IGNORECASE).strip()
        sql_body = re.sub(r'\s*ROLLBACK\s*;?\s*$', '', sql_body, flags=re.IGNORECASE).strip()
        # Also strip RETURNING clauses for EXPLAIN (they still work but let's keep it clean)

    queries.append({"tag": tag, "rw": rw, "desc": desc, "sql": sql_body})

print(f"Found {len(queries)} queries.\n")

summary_rows = []

for q in queries:
    tag, rw, desc, sql = q["tag"], q["rw"], q["desc"], q["sql"]
    print(f"[{tag}] {rw}: {desc[:60]}")
    plan_lines = []
    times = []

    for run_idx in range(1, RUNS + 1):
        if rw == "WRITE":
            # Strip any stray BEGIN/ROLLBACK inside sql_body before wrapping
            inner = re.sub(r'^\s*BEGIN\s*;?\s*', '', sql, flags=re.IGNORECASE).strip()
            inner = re.sub(r'\s*ROLLBACK\s*;?\s*$', '', inner, flags=re.IGNORECASE).strip()
            # Also strip a trailing semicolon so we can add one cleanly
            inner = inner.rstrip(';').strip()
            explain_sql = f"EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)\n{inner};"
            out = psql_explain_write(explain_sql)
        else:
            explain_sql = f"EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)\n{sql};"
            out = psql(explain_sql)
        # Extract execution time
        m = re.search(r'Execution Time:\s*([\d.]+)\s*ms', out)
        t = float(m.group(1)) if m else -1.0
        times.append(t)
        plan_lines.append(f"=== Run {run_idx} ===\n{out}\n")
        print(f"  Run {run_idx}: {t:.3f} ms")

    # Extract scan types from first run plan
    scan_types = sorted(set(re.findall(
        r'(Seq Scan|Index Scan|Index Only Scan|Bitmap Heap Scan|Hash Join|Merge Join|Nested Loop)',
        plan_lines[0]
    )))
    scan_str = "; ".join(scan_types) if scan_types else "N/A"

    avg = round(sum(t for t in times if t >= 0) / max(len([t for t in times if t >= 0]), 1), 3)

    # Write plan file
    plan_path = os.path.join(PLANS_DIR, f"{tag}.txt")
    with open(plan_path, "w") as pf:
        pf.write(f"Query: {tag}  Type: {rw}\n")
        pf.write(f"Description: {desc}\n")
        pf.write("=" * 60 + "\n")
        pf.write("\n".join(plan_lines))
        pf.write(f"\nSummary: run1={times[0]:.3f}ms  run2={times[1]:.3f}ms  run3={times[2]:.3f}ms  avg={avg:.3f}ms\n")

    summary_rows.append({
        "query": tag,
        "type": rw,
        "description": desc,
        "run1_ms": f"{times[0]:.3f}",
        "run2_ms": f"{times[1]:.3f}",
        "run3_ms": f"{times[2]:.3f}",
        "avg_ms": f"{avg:.3f}",
        "scan_types": scan_str,
    })
    print(f"  avg={avg:.3f} ms  scans=[{scan_str}]\n")

# Write summary CSV
with open(CSV_OUT, "w", newline="") as cf:
    fieldnames = ["query","type","description","run1_ms","run2_ms","run3_ms","avg_ms","scan_types"]
    w = csv.DictWriter(cf, fieldnames=fieldnames)
    w.writeheader()
    w.writerows(summary_rows)

print(f"summary.csv written to {CSV_OUT}")
print("Done!")
