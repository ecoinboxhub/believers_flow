"""
Database migration helper for BelieversFlow.

Usage:
    python migrate.py stamp    — Mark current DB state as up-to-date (no changes)
    python migrate.py upgrade  — Apply all pending migrations
    python migrate.py downgrade — Roll back last migration
    python migrate.py history  — Show migration history
"""
import os
import sys
import subprocess

os.chdir(os.path.dirname(os.path.abspath(__file__)))

def run(cmd: list[str]) -> int:
    result = subprocess.run(["python", "-m", "alembic"] + cmd, cwd=".")
    return result.returncode

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    action = sys.argv[1].lower()

    if action == "stamp":
        rc = run(["stamp", "head"])
    elif action == "upgrade":
        rc = run(["upgrade", "head"])
    elif action == "downgrade":
        rc = run(["downgrade", "-1"])
    elif action == "history":
        rc = run(["history"])
    elif action == "make":
        msg = sys.argv[2] if len(sys.argv) > 2 else "auto_migration"
        rc = run(["revision", "--autogenerate", "-m", msg])
    else:
        print(f"Unknown action: {action}")
        print(__doc__)
        sys.exit(1)

    sys.exit(rc)

if __name__ == "__main__":
    main()
