import contextlib
import os
from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient

os.environ["APP_ENV"] = "TESTING"
for env_var in ["MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_SERVER"]:
    os.environ[env_var] = "example"
os.environ["MAIL_FROM"] = "foo@bar.com"
os.environ["MAIL_PORT"] = "42"

from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from backend import crud
from backend.auth import get_user_from_request
from backend.db import get_session
from backend.lib.email import email_client
from backend.main import app
from backend.models import *
from backend.routers import story

SQLALCHEMY_DATABASE_URL = "sqlite://"

EXAMPLE_USER_EMAILS = [f"player{i}@foo.com" for i in range(1, 3)]


@dataclass
class Context:
    client: TestClient
    session: Session
    active_user: Optional[str]


class NeedToSetAUser(Exception):
    ...


@pytest.fixture
def test_exceptions():
    return {"need_to_set_a_user": NeedToSetAUser}


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def context(session: Session, monkeypatch):
    os.environ["APP_ORIGIN"] = "http://localhost"

    os.environ["SUPPRESS_EMAIL"] = "1"
    email_client.config.SUPPRESS_SEND = 1

    def test_perform_ai_turn(story_uuid):
        story = crud.get_story(story_uuid, session)
        if story is None:
            raise crud.DbNotFound
        segment = StorySegment(
            author=crud.get_ai_player_user(session),
            story=story,
            content="foo",
            ai_generated=True,
            order=len(story.segments),
        )
        story.segments.append(segment)
        session.add(story)
        session.commit()

    monkeypatch.setattr(story, "perform_ai_turn", test_perform_ai_turn)

    def get_session_override():
        return session

    user_override = None

    @contextlib.contextmanager
    def active_user(email):
        nonlocal user_override
        user_override = email
        yield
        user_override = None

    def get_user_override():
        nonlocal user_override
        if user_override is None:
            raise NeedToSetAUser("set a user")
        return crud.get_user_by_name(user_override, session)

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_user_from_request] = get_user_override

    client = TestClient(app)
    yield Context(client=client, session=session, active_user=active_user)
    app.dependency_overrides.clear()


@pytest.fixture
def client(context):
    return context.client
