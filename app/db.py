from google.cloud.sql.connector import connector
from sqlalchemy import create_engine
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


def get_session():
    with Session(engine) as session:
        yield session
