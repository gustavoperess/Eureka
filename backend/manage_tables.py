import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import List, Optional

load_dotenv()

class TableManager:
    def __init__(self):
        self.supabase = self._get_supabase_client()
    
    def _get_supabase_client(self) -> Client:
        """Get the Supabase client"""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase credentials in environment variables")
        
        return create_client(supabase_url, supabase_key)
    
    def create_tables(self, sql: str) -> None:
        """Create tables using the provided SQL"""
        try:
            result = self.supabase.rpc('exec_sql', {'sql': sql}).execute()
            print("✅ Tables created successfully!")
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            raise
    
    def list_tables(self) -> List[str]:
        """List all tables in the database"""
        try:
            # This is a simple query to get table names
            sql = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            """
            result = self.supabase.rpc('exec_sql', {'sql': sql}).execute()
            tables = [row['table_name'] for row in result.data]
            print("\nCurrent tables in database:")
            for table in tables:
                print(f"  - {table}")
            return tables
        except Exception as e:
            print(f"❌ Error listing tables: {e}")
            raise
    
    def check_table_exists(self, table_name: str) -> bool:
        """Check if a specific table exists"""
        try:
            tables = self.list_tables()
            exists = table_name in tables
            print(f"\nTable '{table_name}' exists: {exists}")
            return exists
        except Exception as e:
            print(f"❌ Error checking table existence: {e}")
            raise

def example_usage():
    """Example of how to use the TableManager"""
    manager = TableManager()
    
    # Example SQL for creating tables
    example_sql = """
    -- Example table creation SQL
    CREATE TABLE IF NOT EXISTS example_table (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
    """
    
    # List current tables
    manager.list_tables()
    
    # Check if a specific table exists
    manager.check_table_exists("example_table")
    
    # Create new tables (uncomment to use)
    # manager.create_tables(example_sql)

if __name__ == "__main__":
    print("\n=== Supabase Table Manager ===\n")
    example_usage() 