import os

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from loguru import logger
from sqlmodel import Session

from . import crud
from .db import get_session


def verify_token(token):
    jwks_client = jwt.PyJWKClient(
        f'https://{os.environ["DOMAIN"]}/.well-known/jwks.json'
    )
    signing_key = jwks_client.get_signing_key_from_jwt(token).key
    return jwt.decode(
        token,
        signing_key,
        algorithms=os.environ["ALGORITHMS"],
        audience=os.environ["API_AUDIENCE"],
        issuer=os.environ["ISSUER"],
    )


token_auth_scheme = HTTPBearer()


def get_user_from_request(
    session: Session = Depends(get_session),
    token: HTTPAuthorizationCredentials = Depends(token_auth_scheme),
):
    try:
        payload = verify_token(token.credentials)
    except Exception as e:
        logger.error(e)
        raise HTTPException(401, "could not verify token")

    (email_key,) = [k for k in payload.keys() if "email" in k]
    email = payload[email_key]

    return crud.get_user_by_name(email, session)
