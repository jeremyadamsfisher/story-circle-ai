import os

from google.cloud.sql.connector import connector
from sqlmodel import Session, create_engine

engine = create_engine(
    "postgresql+pg8000://",
    creator=lambda: connector.connect(
        "story-circle-ai:us-east1:yakul",
        "pg8000",
        user="story-circle-app-sa@story-circle-ai.iam",
        db="faboo",
        enable_iam_auth=True,
    ),
)


if os.environ.get("IN_MEMORY_DB") == "1":
    from sqlmodel import SQLModel
    from sqlmodel.pool import StaticPool

    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
else:
    engine = create_engine(
        "postgresql+pg8000://",
        creator=lambda: connector.connect(
            "story-circle-ai:us-east1:yakul",
            "pg8000",
            user="story-circle-app-sa@story-circle-ai.iam",
            db="faboo",
            enable_iam_auth=True,
        ),
    )


def get_engine():
    return engine


def get_session():
    with Session(engine) as session:
        yield session
