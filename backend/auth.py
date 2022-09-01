import os

import jwt
import firebase_admin
import firebase_admin.auth
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from loguru import logger
from sqlmodel import Session

from . import crud
from .db import get_session

firebase_admin.initialize_app()

def verify_token(token):
    return firebase_admin.auth.verify_id_token(token)

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

    email = payload["email"]

    return crud.get_user_by_name(email, session)
