import os

from sqlmodel import create_engine, SQLModel, Session


dsn = "postgresql+pg8000://{}:{}@{}:{}/{}".format(
    os.environ["PGUSER"],
    os.environ["PGPASSWORD"],
    "database" if os.environ["APP_STAGE"] == "dev" else os.environ["PGHOST"],
    os.environ["PGPORT"],
    os.environ["PGDATABASE"],
)
engine = create_engine(dsn, echo=True)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
