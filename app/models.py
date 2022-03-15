from typing import List, Optional
from uuid import uuid4

from sqlalchemy_utils import UUIDType
from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    # email: Optional[str]
    story_segments: List["StorySegment"] = Relationship(back_populates="author")
    stories_originated: List["Story"] = Relationship(back_populates="original_author")
    player_ordering: List["PlayerOrder"] = Relationship(back_populates="user")
    single_player: bool = False
    ai_player: bool = False


class Story(SQLModel, table=True):
    __tablename__ = "stories"
    id: Optional[int] = Field(default=None, primary_key=True)
    story_uuid: str = Field(default_factory=lambda: str(uuid4()), index=True)
    original_author_id: Optional[int] = Field(default=None, foreign_key="users.id")
    original_author: Optional[User] = Relationship(back_populates="stories_originated")
    segments: List["StorySegment"] = Relationship(back_populates="story")
    player_ordering: List["PlayerOrder"] = Relationship(back_populates="story")
    single_player_mode: bool

    @property
    def whose_turn_is_it(self) -> User:
        users = [
            po.user for po in sorted(self.player_ordering, key=lambda po: po.order)
        ]
        return users[len(self.segments) % len(users)]

    @property
    def players(self) -> List[User]:
        return [po.user for po in self.player_ordering if po.user]


class StorySegment(SQLModel, table=True):
    __tablename__ = "story_segments"
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    author_id: Optional[int] = Field(default=None, foreign_key="users.id")
    author: Optional[User] = Relationship(back_populates="story_segments")
    story_id: Optional[int] = Field(default=None, foreign_key="stories.id")
    story: Optional[Story] = Relationship(back_populates="segments")
    ai_generated: bool


class PlayerOrder(SQLModel, table=True):
    __tablename__ = "player_orders"
    id: Optional[int] = Field(default=None, primary_key=True)
    order: int
    story_id: Optional[int] = Field(default=None, foreign_key="stories.id")
    story: Optional[Story] = Relationship(back_populates="player_ordering")
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    user: Optional[User] = Relationship(back_populates="player_ordering")


class UserRead(SQLModel):
    name: str


class UserReadWithPlayerType(UserRead):
    single_player: bool
    ai_player: bool


class StorySegmentRead(SQLModel):
    content: str
    author: UserReadWithPlayerType


class StoryRead(SQLModel):
    story_uuid: str
    segments: List[StorySegmentRead]
    players: List[UserReadWithPlayerType]
    whose_turn_is_it: UserReadWithPlayerType


class StorySegmentNew(SQLModel):
    content: str


class StoryNew(SQLModel):
    story_uuid: str
    original_author: UserRead
    single_player_mode: bool


class UserStoriesRead(SQLModel):
    """catalog of all stories (that is, the primary keys of all stories) that a
    user has begun or participated in"""

    stories_originated: List[int]
    stories_participated_in: List[int]
