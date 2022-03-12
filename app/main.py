from dotenv import load_dotenv
from loguru import logger
from pathlib import Path

if Path("./.env").exists():
    logger.info(".env detected")
    load_dotenv()
else:
    logger.warning(".env file does not exists, falling down to environment variables")

import logging
import os
import warnings
from typing import Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    FastAPI,
    Header,
    HTTPException,
)
from fastapi.middleware.cors import CORSMiddleware

from sqlmodel import Session

from . import crud
from .auth import get_user_from_request
from .db import get_session
from .game import perform_ai_turn
from .models import (
    PlayerOrder,
    Story,
    StoryNew,
    StoryRead,
    StorySegment,
    UserStoriesRead,
)


logging.basicConfig(format="%(levelname)s:%(message)s", level=logging.INFO)

warnings.filterwarnings(
    "ignore", ".*Class SelectOfScalar will not make use of SQL compilation caching.*"
)

logger = logging.getLogger(__name__)


app = FastAPI(title="Story Circle")


origins = [
    "*",
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/oauth2-redirect")
def oauth2_redirect():
    """redirect to the story view from which the user came"""
    return {"message": "hello auth0!"}


story_router = APIRouter()


@story_router.put("/", response_model=StoryNew)
def new_story(
    *,
    session: Session = Depends(get_session),
    x_user: Optional[str] = Header(None, description="whoever the user claims to be"),
):
    if x_user:
        user = crud.get_user(x_user, session)
    else:
        user = crud.get_single_player_user(session)

    story = Story(original_author=user, single_player_mode=x_user is None)
    player_ordering_ = [
        PlayerOrder(order=0, user=user),
        PlayerOrder(order=1, user=crud.get_ai_player_user(session)),
    ]
    story.player_ordering.extend(player_ordering_)
    session.add(story)
    session.commit()

    return story


@story_router.get("/{story_id}", response_model=StoryRead)
def get_story(
    *,
    story_id: str,
    session: Session = Depends(get_session),
):
    if story := crud.get_story(story_id, session):
        return story
    raise HTTPException(404, detail="story not found")


@story_router.put("/{story_id}", response_model=StoryRead)
def append_to_story(
    *,
    story_id: str,
    x_user: Optional[str] = Header(None, description="whomever the user claims to be"),
    session: Session = Depends(get_session),
    content: str,
    background_tasks: BackgroundTasks,
):
    story = crud.get_story(story_id, session)
    if not story:
        raise HTTPException(404)

    if x_user:
        author = crud.get_user_by_name(x_user, session)
    else:
        author = crud.get_single_player_user(session)

    if author.ai_player:
        raise HTTPException(403, detail="AI player does not use this route")

    if author != story.whose_turn_is_it:
        raise HTTPException(405, detail="not player turn")

    segment = StorySegment(
        author=author,
        content=content.rstrip(),
        ai_generated=False,
    )
    story.segments.append(segment)

    session.add(story)
    session.commit()
    session.refresh(story)

    if story.whose_turn_is_it.ai_player:
        background_tasks.add_task(perform_ai_turn, story.story_uuid)

    return story


app.include_router(story_router, prefix="/story", tags=["story"])


user = APIRouter()


@user.get(
    "/",
    # response_model=UserStoriesRead,
)
def get_user_stories(
    session: Session = Depends(get_session), user=Depends(get_user_from_request)
):
    try:
        return crud.get_stories_originated_by_user(user.id, session)
    except crud.DbNotFound:
        raise HTTPException(404, "user not found")


app.include_router(user, prefix="/user", tags=["user"])
