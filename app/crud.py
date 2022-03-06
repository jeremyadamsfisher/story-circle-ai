from typing import Optional

from sqlmodel import Session, select

from .models import Story, User, UserStoriesRead

SINGLE_PLAYER_NAME = "single-player"
AI_PLAYER_NAME = "ai-player"


class DbIssue(Exception):
    ...


class DbNotFound(Exception):
    ...


def get_single_player_user(session) -> User:
    statement = select(User).where(User.name == SINGLE_PLAYER_NAME)
    try:
        (user,) = session.exec(statement)
    except ValueError:
        user = User(name=SINGLE_PLAYER_NAME, single_player=True)
        session.add(user)
        session.commit()
    return user


def get_ai_player_user(session) -> User:
    statement = select(User).where(User.name == AI_PLAYER_NAME)
    try:
        (user,) = session.exec(statement)
    except ValueError:
        user = User(name=AI_PLAYER_NAME, ai_player=True)
        session.add(user)
        session.commit()
    return user


def get_user_by_name(
    name: str, session: Session, create_if_not_present: bool = True
) -> Optional[User]:
    statement = select(User).where(User.name == name)
    try:
        (user,) = session.exec(statement)
    except ValueError:
        if not create_if_not_present:
            return
        user = User(name=name)
        session.add(user)
        session.commit()
    return user


def get_user_by_id(id_: int, session: Session) -> User:
    statement = select(User).where(User.id == id_)
    try:
        (user,) = session.exec(statement)
    except ValueError:
        raise DbNotFound
    return user


def get_stories_originated_by_user(user_id: int, session: Session):
    user = get_user_by_id(user_id, session)
    stories_originated = [story.id for story in user.stories_originated]
    stories_participated_in = list(
        {segment.story.id for segment in user.story_segments}
    )
    u = UserStoriesRead(
        stories_originated=stories_originated,
        stories_participated_in=stories_participated_in,
    )
    return u


def get_story(story_uuid: str, session: Session) -> Optional[Story]:
    statement = select(Story).where(Story.story_uuid == story_uuid)
    try:
        (story,) = session.exec(statement)
    except ValueError:
        raise DbNotFound
    return story
