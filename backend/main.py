import os
import warnings
import logging
from pathlib import Path

logging.basicConfig(format="%(levelname)s:%(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

if Path("./.env").exists():
    logger.info(".env detected")
    load_dotenv()
else:
    logger.warning(".env file does not exists, falling down to environment variables")


from .routers.story import router as story_router
from .routers.users import router as user_router
from .routers.invitations import router as invitations_router


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


app.include_router(story_router, prefix="/story", tags=["story"])
app.include_router(user_router, prefix="/user", tags=["user"])
app.include_router(invitations_router, prefix="/invitations", tags=["invitations"])
