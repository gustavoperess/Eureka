import os
from dotenv import load_dotenv
from supabase import create_client, Client
from models import CompanyRegistration, UserRegistration
import uuid
from datetime import datetime

# Load environment variables
load_dotenv()

def test_supabase_connection():
    try:
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase credentials in environment variables")
            
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Successfully connected to Supabase")
        return supabase
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {e}")
        raise

def test_company_operations(supabase: Client):
    try:
        # Generate unique test data with timestamp
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        test_email = f"test{timestamp}@company.com"
        
        # Test company creation
        company_data = CompanyRegistration(
            name=f"Test Company {timestamp}",
            email=test_email,
            password="testpassword123",
            registered_address=f"123 Test St {timestamp}"
        )
        
        # Insert company
        result = supabase.table("companies").insert({
            "name": company_data.name,
            "email": company_data.email,
            "password": company_data.password,
            "registered_address": company_data.registered_address
        }).execute()
        
        company_id = result.data[0]["id"]
        print("✅ Successfully created company")
        
        # Test company retrieval
        company = supabase.table("companies").select("*").eq("id", company_id).execute()
        print("✅ Successfully retrieved company")
        
        return company_id
    except Exception as e:
        print(f"❌ Error in company operations: {e}")
        raise

def test_user_operations(supabase: Client, company_id: uuid.UUID):
    try:
        # Generate unique test data with timestamp
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        test_email = f"test{timestamp}@user.com"
        
        # Test user creation
        user_data = UserRegistration(
            full_name=f"Test User {timestamp}",
            email=test_email,
            company_id=company_id,
            password_hash="hashedpassword123"  # In real app, this would be properly hashed
        )
        
        # Insert user - convert UUID to string
        result = supabase.table("users").insert({
            "full_name": user_data.full_name,
            "email": user_data.email,
            "company_id": str(user_data.company_id),  # Convert UUID to string
            "password_hash": user_data.password_hash
        }).execute()
        
        user_id = result.data[0]["id"]
        print("✅ Successfully created user")
        
        # Test user retrieval
        user = supabase.table("users").select("*").eq("id", user_id).execute()
        print("✅ Successfully retrieved user")
        
        return user_id
    except Exception as e:
        print(f"❌ Error in user operations: {e}")
        raise

def test_login_log_operations(supabase: Client, user_id: uuid.UUID):
    try:
        # Test login log creation
        result = supabase.table("login_log").insert({
            "user_id": str(user_id)  # Convert UUID to string
        }).execute()
        
        print("✅ Successfully created login log entry")
        
        # Test login log retrieval
        logs = supabase.table("login_log").select("*").eq("user_id", str(user_id)).execute()
        print("✅ Successfully retrieved login logs")
        
    except Exception as e:
        print(f"❌ Error in login log operations: {e}")
        raise

def cleanup_test_data(supabase: Client, company_id: uuid.UUID, user_id: uuid.UUID):
    try:
        # Delete login logs
        supabase.table("login_log").delete().eq("user_id", str(user_id)).execute()
        
        # Delete user
        supabase.table("users").delete().eq("id", str(user_id)).execute()
        
        # Delete company
        supabase.table("companies").delete().eq("id", str(company_id)).execute()
        
        print("✅ Successfully cleaned up test data")
    except Exception as e:
        print(f"❌ Error cleaning up test data: {e}")
        raise

if __name__ == "__main__":
    print("\n=== Starting Supabase Integration Tests ===\n")
    
    try:
        # Test connection
        supabase = test_supabase_connection()
        
        # Test company operations
        company_id = test_company_operations(supabase)
        
        # Test user operations
        user_id = test_user_operations(supabase, company_id)
        
        # Test login log operations
        test_login_log_operations(supabase, user_id)
        
        # Cleanup test data
        cleanup_test_data(supabase, company_id, user_id)
        
        print("\n=== All tests completed successfully! ===\n")
    except Exception as e:
        print(f"\n❌ Tests failed: {e}\n") 