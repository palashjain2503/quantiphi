import sqlite3
import os

# Path to the SQLite database file
DB_PATH = os.path.join(os.path.dirname(__file__), "calorie_tracker.db")


def get_connection():
    """Create and return a new database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Rows behave like dicts
    return conn


def init_db():
    """Create tables if they don't already exist."""
    conn = get_connection()
    cursor = conn.cursor()

    # Meals table – stores every food item the user logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meals (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            food_name   TEXT    NOT NULL,
            portion_grams REAL  NOT NULL,
            calories    REAL    NOT NULL,
            protein     REAL    NOT NULL,
            carbs       REAL    NOT NULL,
            fats        REAL    NOT NULL,
            date        TEXT    NOT NULL   -- stored as 'YYYY-MM-DD'
        )
    """)

    # Settings table – stores a single row for the user's current fitness goal
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id   INTEGER PRIMARY KEY,
            goal TEXT NOT NULL DEFAULT 'maintenance'
        )
    """)

    # Seed the settings row if it doesn't exist yet
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO settings (id, goal) VALUES (1, 'maintenance')")

    conn.commit()
    conn.close()
