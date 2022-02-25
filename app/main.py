from typing import Optional
from uuid import UUID
from fastapi import FastAPI, Depends, Header, HTTPException
from sqlmodel import Session
from .db import init_db, get_session
from .models import Story, StoryRead, StorySegment
from . import crud

app = FastAPI(title="Faboo")


@app.on_event("startup")
def on_startup():
    init_db()


@app.put("/", response_model=StoryRead)
def new_story(
    *,
    session: Session = Depends(get_session),
    x_user: Optional[str] = Header(None, description="whomever the user claims to be"),
):
    if x_user:
        user = crud.get_user(x_user, session)
        story = Story(original_author=user)
    else:
        story = Story()
    session.add(story)
    session.commit()
    return story


@app.get("/{story_id}", response_model=StoryRead)
def get_story(
    *,
    story_id: UUID,
    session: Session = Depends(get_session),
):
    if story := crud.get_story(story_id, session):
        return story
    raise HTTPException(404, detail="story not found")


@app.put("/{story_id}", response_model=StoryRead)
def append_to_story(
    *,
    story_id: UUID,
    x_user: Optional[str] = Header(None, description="whomever the user claims to be"),
    session: Session = Depends(get_session),
    content: str,
):
    if story := crud.get_story(story_id, session):
        segment = StorySegment(
            author=crud.get_user(x_user, session),
            story=crud.get_story(story_id, session),
            content=content,
        )
        story.segments.append(segment)
        session.add(story)
        session.commit()
        return story
    raise HTTPException(404)
