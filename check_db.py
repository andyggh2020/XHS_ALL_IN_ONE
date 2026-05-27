import sqlite3
conn = sqlite3.connect(r'e:\AI编程\XHS_ALL_IN_ONE\data\spider_xhs.db')
cur = conn.cursor()

# Notes
cur.execute("SELECT COUNT(*) FROM notes")
print("Saved notes:", cur.fetchone()[0])

# Recent notes
cur.execute("SELECT id, title FROM notes ORDER BY id DESC LIMIT 3")
for r in cur.fetchall():
    print(f"  Note {r[0]}: {r[1] or 'N/A'}")

# Tasks
cur.execute("SELECT COUNT(*) FROM tasks")
print("Tasks:", cur.fetchone()[0])

# Tasks columns
cur.execute("PRAGMA table_info(tasks)")
cols = [c[1] for c in cur.fetchall()]
print("Task columns:", cols)

cur.execute("SELECT * FROM tasks ORDER BY id DESC LIMIT 3")
for r in cur.fetchall():
    print(f"  Task: {dict(zip(cols, r))}")

conn.close()
