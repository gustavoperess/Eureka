from jose import jwt
import httpx
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import json

SUPABASE_PROJECT_URL = "https://uxbxcgdlltyfpilmrkst.supabase.co"
JWKS_URL = f"{SUPABASE_PROJECT_URL}/auth/v1/keys"
ALGORITHMS = ["RS256"]
AUDIENCE = None  # Set to your Supabase project ID if strict checking needed
ISSUER = f"{SUPABASE_PROJECT_URL}/auth/v1"

# Cache JWKS
jwks = None

# Force enable development mode
os.environ["DEV_MODE"] = "true"

# Mock user for development purposes
DEV_MODE = True  # Force dev mode to be true
MOCK_USER = {
    "id": "00000000-0000-0000-0000-000000000000",
    "email": "mock@example.com",
    "name": "Mock User"
}

async def get_jwks():
    global jwks
    try:
        if not jwks:
            async with httpx.AsyncClient() as client:
                res = await client.get(JWKS_URL, timeout=5.0)
                if res.status_code != 200:
                    # If we can't get the JWKS, return an empty dict with keys
                    print(f"Warning: Could not fetch JWKS. Status: {res.status_code}")
                    return {"keys": []}
                
                jwks_data = res.json()
                # Make sure it has a "keys" property
                if "keys" not in jwks_data:
                    jwks_data = {"keys": []}
                jwks = jwks_data
        return jwks
    except Exception as e:
        print(f"Error fetching JWKS: {e}")
        return {"keys": []}

security = HTTPBearer(auto_error=False)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Always return the mock user to bypass authentication completely
    print("Warning: Authentication disabled, using mock user")
    return MOCK_USER
