import os

import jwt
from fastapi import Depends
from sqlmodel import Session

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
