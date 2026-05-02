from fastapi import APIRouter, HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token
from pydantic import BaseModel

from app.config import settings

router = APIRouter()


class GoogleAuthRequest(BaseModel):
    credential: str


class AuthenticatedUser(BaseModel):
    email: str
    name: str | None = None
    picture: str | None = None
    google_sub: str


@router.post("/google", response_model=AuthenticatedUser)
def login_with_google(payload: GoogleAuthRequest):
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_CLIENT_ID is not configured",
        )

    try:
        claims = id_token.verify_oauth2_token(
            payload.credential,
            requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        ) from exc

    if not claims.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account email is not verified",
        )

    return AuthenticatedUser(
        email=claims["email"],
        name=claims.get("name"),
        picture=claims.get("picture"),
        google_sub=claims["sub"],
    )
