from typing import Optional

from sqlmodel import Session, select

from .models import Story, User

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


def get_user(name: str, session: Session) -> User:
    statement = select(User).where(User.name == name)
    try:
        (user,) = session.exec(statement)
    except ValueError:
        user = User(name=name)
        session.add(user)
        session.commit()
    return user


def get_story(story_uuid: str, session: Session) -> Optional[Story]:
    statement = select(Story).where(Story.story_uuid == story_uuid)
    try:
        (story,) = session.exec(statement)
    except ValueError:
        raise DbNotFound
    return story
