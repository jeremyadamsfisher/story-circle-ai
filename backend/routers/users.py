from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import crud
from ..auth import get_user_from_request
from ..db import get_session
from ..lib.shims import APIRouter
from ..models import UserStoriesRead


router = APIRouter()


@router.get("/", response_model=UserStoriesRead)
def get_user_stories(
    session: Session = Depends(get_session),
    user=Depends(get_user_from_request),
):
    try:
        return crud.get_stories_originated_by_user(user.id, session)
    except crud.DbNotFound:
        raise HTTPException(404, "user not found")
