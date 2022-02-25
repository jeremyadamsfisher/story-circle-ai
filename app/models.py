import uuid as uuid_pkg
from uuid import UUID, uuid4
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: UUID = Field(
        default_factory=uuid4, index=True, primary_key=True, nullable=False
    )
    name: str
    story_segments: List["StorySegment"] = Relationship(back_populates="author")
    stories_originated: List["Story"] = Relationship(back_populates="original_author")


class Story(SQLModel, table=True):
    __tablename__ = "stories"
    id: UUID = Field(
        default_factory=uuid4, index=True, primary_key=True, nullable=False
    )
    original_author_id: Optional[UUID] = Field(default=None, foreign_key="users.id")
    original_author: Optional[User] = Relationship(back_populates="stories_originated")
    segments: List["StorySegment"] = Relationship(back_populates="story")


class StorySegment(SQLModel, table=True):
    __tablename__ = "story_segments"
    id: UUID = Field(
        default_factory=uuid4, index=True, primary_key=True, nullable=False
    )
    content: str
    author_id: Optional[UUID] = Field(default=None, foreign_key="users.id")
    author: Optional[User] = Relationship(back_populates="story_segments")
    story_id: Optional[UUID] = Field(default=None, foreign_key="stories.id")
    story: Optional[Story] = Relationship(back_populates="segments")


class UserRead(SQLModel):
    id: UUID
    name: str


class StorySegmentRead(SQLModel):
    id: UUID
    content: str
    author: UserRead


class StoryRead(SQLModel):
    id: UUID
    segments: List[StorySegmentRead]
