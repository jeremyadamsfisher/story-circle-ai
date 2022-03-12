import os

from loguru import logger
import jwt
from fastapi import Depends
from sqlmodel import Session
from fastapi import HTTPException
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials

from . import crud
from .db import get_session

CONFIG = {
    "DOMAIN": os.environ["DOMAIN"],
    "API_AUDIENCE": os.environ["API_AUDIENCE"],
    "ISSUER": os.environ["ISSUER"],
    "ALGORITHMS": os.environ["ALGORITHMS"],
}


JWKS_CLIENT = jwt.PyJWKClient(f'https://{CONFIG["DOMAIN"]}/.well-known/jwks.json')


def verify_token(token):
    signing_key = JWKS_CLIENT.get_signing_key_from_jwt(token).key
    return jwt.decode(
        token,
        signing_key,
        algorithms=CONFIG["ALGORITHMS"],
        audience=CONFIG["API_AUDIENCE"],
        issuer=CONFIG["ISSUER"],
    )


token_auth_scheme = HTTPBearer()


def get_user_from_request(
    session: Session = Depends(get_session),
    token: HTTPAuthorizationCredentials = Depends(token_auth_scheme),
):
    if token:
        try:
            payload = verify_token(token.credentials)
        except Exception as e:
            logger.error(e)
            raise HTTPException(401, "could not verify token")

        (email_key,) = [k for k in payload.keys() if "email" in k]
        email = payload[email_key]

        return crud.get_user_by_name(email, session)

    return crud.get_single_player_user(session)
