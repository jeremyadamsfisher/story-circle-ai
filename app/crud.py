from typing import Optional
from uuid import UUID
from .models import User, Story
from sqlmodel import Session, select


def get_user(name: str, session: Session) -> User:
    statement = select(User).where(User.name == name)
    try:
        (user,) = session.exec(statement)
    except ValueError:
        user = User(name=name)
        session.add(user)
        session.commit()
    return user


def get_story(id_: UUID, session: Session) -> Optional[Story]:
    statement = select(Story).where(Story.id == id_)
    try:
        (story,) = session.exec(statement)
    except ValueError:
        return
    return story
