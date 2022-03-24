import logging
from pathlib import Path

logging.basicConfig(format="%(levelname)s:%(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

from dotenv import load_dotenv

if Path("./.env").exists():
    logger.info(".env detected")
    load_dotenv()
else:
    logger.warning(".env file does not exists, falling down to environment variables")

import os
import warnings

from fastapi import APIRouter, BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from . import crud
from .auth import get_user_from_request
from .db import get_session
from .game import perform_ai_turn
from .lib.shims import APIRouter
from .models import (
    PlayerOrder,
    Story,
    StoryNew,
    StoryRead,
    StorySegment,
    StorySegmentNew,
    User,
    UserStoriesRead,
)


warnings.filterwarnings(
    "ignore", ".*Class SelectOfScalar will not make use of SQL compilation caching.*"
)


app = FastAPI(title="Story Circle")


if os.environ["APP_ENV"] != "PRODUCTION":
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


@app.get("/health")
def health():
    return {"msg": "ok"}


story_router = APIRouter()


@story_router.post("/singlePlayer", response_model=StoryNew)
def new_story_single_player(session: Session = Depends(get_session)):
    user = crud.get_single_player_user(session)
    return new_story(session, user, True)


@story_router.post("/multiPlayer", response_model=StoryNew)
def new_story_multiplayer(
    session: Session = Depends(get_session),
    user=Depends(get_user_from_request),
):
    return new_story(session, user, False)


def new_story(session: Session, user: User, single_player: bool) -> Story:
    story = Story(original_author=user, single_player_mode=single_player)
    player_ordering_ = [
        PlayerOrder(order=0, user=user, invitation_accepted=True),
        PlayerOrder(
            order=1, user=crud.get_ai_player_user(session), invitation_accepted=True
        ),
    ]
    story.player_ordering.extend(player_ordering_)
    session.add(story)
    session.commit()

    return story


@story_router.get("/{story_id}/singlePlayer", response_model=StoryRead)
def get_story_single_player(
    *,
    story_id: str,
    session: Session = Depends(get_session),
):
    return get_story(story_id, session)


@story_router.get("/{story_id}/multiPlayer", response_model=StoryRead)
def get_story_multiplayer(
    *,
    story_id: str,
    user=Depends(get_user_from_request),
    session: Session = Depends(get_session),
):
    story = get_story(story_id, session)
    crud.convert_story_to_multiplayer_if_needed(story, user, session)
    return story


def get_story(story_id: str, session: Session):
    if story := crud.get_story(story_id, session):
        return story

    raise HTTPException(404, detail="story not found")


@story_router.post("/{story_id}/singlePlayer", response_model=StoryRead)
def append_to_story_single_player(
    *,
    story_id: str,
    session: Session = Depends(get_session),
    background_tasks: BackgroundTasks,
    model: StorySegmentNew,
):
    author = crud.get_single_player_user(session)
    return append_to_story(
        author=author,
        story_id=story_id,
        session=session,
        content=model.content,
        background_tasks=background_tasks,
    )


@story_router.post("/{story_id}/multiPlayer", response_model=StoryRead)
def append_to_story_multiplayer(
    *,
    story_id: str,
    session: Session = Depends(get_session),
    background_tasks: BackgroundTasks,
    user=Depends(get_user_from_request),
    model: StorySegmentNew,
):
    return append_to_story(
        author=user,
        story_id=story_id,
        session=session,
        content=model.content,
        background_tasks=background_tasks,
    )


def append_to_story(
    *,
    author: User,
    story_id: str,
    session: Session = Depends(get_session),
    content: str,
    background_tasks: BackgroundTasks,
):
    story = crud.get_story(story_id, session)

    crud.convert_story_to_multiplayer_if_needed(story, author, session)

    if not story:
        raise HTTPException(404)

    if author.ai_player:
        raise HTTPException(403, detail="AI player does not use this route")

    if author != story.whose_turn_is_it:
        raise HTTPException(403, detail="not player turn")

    segment = StorySegment(
        author=author,
        content=content.rstrip(),
        ai_generated=False,
        order=len(story.segments),
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


@user.get("/", response_model=UserStoriesRead)
def get_user_stories(
    session: Session = Depends(get_session),
    user=Depends(get_user_from_request),
):
    try:
        return crud.get_stories_originated_by_user(user.id, session)
    except crud.DbNotFound:
        raise HTTPException(404, "user not found")


app.include_router(user, prefix="/user", tags=["user"])

from .routers.invitations import invitations

app.include_router(invitations, prefix="/invitations", tags=["invitations"])
