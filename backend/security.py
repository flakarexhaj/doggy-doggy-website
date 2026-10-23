
import os
import jwt

from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pwdlib import PasswordHash

load_dotenv()

password_hash = PasswordHash.recommended()
security = HTTPBearer()

ALGORITHM = "HS256"


def create_access_token(email: str) -> str:
    secret = os.getenv("JWT_SECRET_KEY")

    if not secret:
        raise RuntimeError("JWT_SECRET_KEY mungon ne .env")

    payload = {
        "sub": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=2),
    }

    return jwt.encode(payload, secret, algorithm=ALGORITHM)


def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    secret = os.getenv("JWT_SECRET_KEY")

    if not secret:
        raise HTTPException(
            status_code=500,
            detail="Server authentication is not configured",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            secret,
            algorithms=[ALGORITHM],
        )
        email = payload.get("sub")

        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        return email

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )
