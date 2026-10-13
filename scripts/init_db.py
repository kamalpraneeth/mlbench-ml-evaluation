"""Script to initialize MLBench database and seed baseline models and benchmarks."""

import os
import sys

# Ensure backend is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from app.db.base import Base
from app.db.session import engine
from app.main import seed_initial_demo_data


def main():
    db_file = os.path.join(BASE_DIR, "mlbench.db")
    if os.path.exists(db_file):
        os.remove(db_file)
        print(f"Removed previous database file: {db_file}")

    print("Creating database schema...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")

    print("Seeding initial sample datasets, baseline models, and benchmarks...")
    seed_initial_demo_data()
    print("Database initialization and benchmarking completed successfully!")


if __name__ == "__main__":
    main()
