from jose import jwt
import httpx
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SUPABASE_PROJECT_URL = "https://uxbxcgdlltyfpilmrkst.supabase.co"
JWKS_URL = f"{SUPABASE_PROJECT_URL}/auth/v1/keys"
ALGORITHMS = ["RS256"]
AUDIENCE = None  # Set to your Supabase project ID if strict checking needed
ISSUER = f"{SUPABASE_PROJECT_URL}/auth/v1"

# Cache JWKS
jwks = None

async def get_jwks():
    global jwks
    if not jwks:
        async with httpx.AsyncClient() as client:
            res = await client.get(JWKS_URL)
            jwks = res.json()
    return jwks

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    jwks_data = await get_jwks()
    unverified_header = jwt.get_unverified_header(token)

    key = next(
        (k for k in jwks_data["keys"] if k["kid"] == unverified_header["kid"]),
        None
    )
    if not key:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    try:
        payload = jwt.decode(
            token,
            key,
            algorithms=ALGORITHMS,
            audience=AUDIENCE,
            issuer=ISSUER
        )
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token verification failed")
