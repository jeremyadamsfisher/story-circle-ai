import os
import pytest
from fastapi.testclient import TestClient

os.environ["APP_ENV"] = "TESTING"

from sqlmodel import SQLModel, create_engine, Session
from sqlmodel.pool import StaticPool
from app.models import *
from app.main import app
from app.db import get_session

SQLALCHEMY_DATABASE_URL = "sqlite://"


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    # for background tasks, which don't use dependency injection
    with Session(engine) as session:
        yield session


@pytest.fixture
def client_context(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override

    client = TestClient(app)
    yield client, session
    app.dependency_overrides.clear()


@pytest.fixture
def client(client_context):
    client, _ = client_context
    yield client
