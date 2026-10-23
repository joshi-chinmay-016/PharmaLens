import os
import sys
from urllib.parse import urlparse
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Load from project root .env or backend .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv()

def init_postgres_db():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not set.")
        sys.exit(1)

    # Standardize url for urlparse
    clean_url = db_url.replace("postgresql+psycopg2://", "postgresql://")
    parsed = urlparse(clean_url)
    
    user = parsed.username
    password = parsed.password
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432
    target_db = parsed.path.lstrip("/") or "pharmalens"

    print(f"Connecting to PostgreSQL on {host}:{port} to verify database '{target_db}'...")
    try:
        conn = psycopg2.connect(dbname="postgres", user=user, password=password, host=host, port=port)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (target_db,))
        exists = cur.fetchone()
        if not exists:
            cur.execute(f'CREATE DATABASE "{target_db}"')
            print(f"Database '{target_db}' created successfully on PostgreSQL.")
        else:
            print(f"Database '{target_db}' already exists on PostgreSQL.")
        cur.close()
        conn.close()

        # Verify direct connection
        target_conn = psycopg2.connect(dbname=target_db, user=user, password=password, host=host, port=port)
        print(f"Successfully verified direct connection to PostgreSQL database '{target_db}'.")
        target_conn.close()
        return True
    except Exception as e:
        print(f"PostgreSQL initialization error: {e}")
        return False

if __name__ == "__main__":
    success = init_postgres_db()
    if not success:
        sys.exit(1)
