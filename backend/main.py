import logging
import os
import warnings
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


from .routers.invitations import router as invitations_router
from .routers.story import router as story_router
from .routers.users import router as user_router

warnings.filterwarnings(
    "ignore", ".*Class SelectOfScalar will not make use of SQL compilation caching.*"
)


app = FastAPI(title="Story Circle")


app_env = os.environ["APP_ENV"]


logger.info(f"booting into {app_env} mode")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
