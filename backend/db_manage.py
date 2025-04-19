import os
import subprocess
from dotenv import load_dotenv

load_dotenv()

def get_connection_string():
    """Get the PostgreSQL connection string from environment variables"""
    return os.getenv("DATABASE_URL")

def execute_sql_file(file_path):
    """Execute a SQL file using psql"""
    conn_string = get_connection_string()
    if not conn_string:
        print("Error: DATABASE_URL not found in environment variables")
        return False
    
    try:
        subprocess.run([
            "psql",
            conn_string,
            "-f", file_path
        ], check=True)
        print(f"Successfully executed {file_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error executing SQL file: {e}")
        return False

if __name__ == "__main__":
    # Execute the schema file
    schema_file = os.path.join(os.path.dirname(__file__), "sql", "schema.sql")
    execute_sql_file(schema_file) 