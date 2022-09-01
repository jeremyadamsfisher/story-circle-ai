import os

from fastapi import BackgroundTasks, Depends, HTTPException
from sqlmodel import Session

from .. import crud
from ..auth import get_user_from_request
from ..db import get_session
from ..game import perform_ai_turn
from ..lib.shims import APIRouter
from ..models import PlayerOrder, Story, StoryRead, StorySegment, StorySegmentNew, User

router = APIRouter()


@router.get("/{story_uuid}/singlePlayer", response_model=StoryRead)
def get_story_single_player(
    *,
    story_uuid: str,
    session: Session = Depends(get_session),
):
    return get_story(story_uuid, crud.get_single_player_user(session), session)


@router.get("/{story_uuid}/multiPlayer", response_model=StoryRead)
def get_story_multiplayer(
    *,
    story_uuid: str,
    user=Depends(get_user_from_request),
    session: Session = Depends(get_session),
):
    story = get_story(story_uuid, user, session)
    crud.convert_story_to_multiplayer_if_needed(story, user, session)
    return story


def get_story(story_uuid: str, user: User, session: Session):
    try:
        story = crud.get_story(story_uuid, session)
    except crud.DbNotFound:
        story = Story(
            story_uuid=story_uuid,
            original_author=user,
            single_player_mode=user.single_player,
        )
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


@router.post("/{story_id}/singlePlayer", response_model=StoryRead)
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


@router.post("/{story_id}/multiPlayer", response_model=StoryRead)
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
    try:
        story = crud.get_story(story_id, session)
    except crud.DbNotFound:
        raise HTTPException(
            404, f"tried to add to story that does not exist: {story_id}"
        )

    crud.convert_story_to_multiplayer_if_needed(story, author, session)

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
        if os.environ["APP_ENV"] == "LOCAL":
            background_tasks.add_task(perform_ai_turn, story.story_uuid)
        elif os.environ["APP_ENV"] == "PROD":
            perform_ai_turn(story.story_uuid)

    return story
