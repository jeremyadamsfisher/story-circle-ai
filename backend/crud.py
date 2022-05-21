import logging
from typing import Optional

from sqlmodel import Session, select

from .models import (Invitation, InvitationNew, PlayerOrder, Story, User,
                     UserStoriesRead)

logger = logging.getLogger(__name__)

SINGLE_PLAYER_NAME = "single-player"
AI_PLAYER_NAME = "ai-player"


class DbIssue(Exception):
    ...


class DbNotFound(Exception):
    ...


def get_single_player_user(session) -> User:
    statement = select(User).where(User.name == SINGLE_PLAYER_NAME)
    try:
        (user,) = session.exec(statement)
    except ValueError:
        user = User(name=SINGLE_PLAYER_NAME, single_player=True)
        session.add(user)
        session.commit()
    return user


def get_ai_player_user(session) -> User:
    statement = select(User).where(User.name == AI_PLAYER_NAME)
    try:
        (user,) = session.exec(statement)
    except ValueError:
        user = User(name=AI_PLAYER_NAME, ai_player=True)
        session.add(user)
        session.commit()
    return user


def get_user_by_name(
    name: str, session: Session, create_if_not_present: bool = True
) -> Optional[User]:
    statement = select(User).where(User.name == name)
    try:
        (user,) = session.exec(statement)
    except ValueError:
        if not create_if_not_present:
            return None
        user = User(name=name)
        session.add(user)
        session.commit()
    return user


def get_user_by_id(id_: int, session: Session) -> User:
    statement = select(User).where(User.id == id_)
    try:
        (user,) = session.exec(statement)
    except ValueError:
        raise DbNotFound
    return user


def get_stories_originated_by_user(user_id: int, session: Session):
    user = get_user_by_id(user_id, session)
    stories_originated = [story.id for story in user.stories_originated]
    stories_participated_in = list(
        {segment.story.id for segment in user.story_segments}
    )
    u = UserStoriesRead(
        stories_originated=stories_originated,
        stories_participated_in=stories_participated_in,
    )
    return u


def get_story(story_uuid: str, session: Session) -> Story:
    statement = select(Story).where(Story.story_uuid == story_uuid)
    try:
        (story,) = session.exec(statement)
    except ValueError:
        raise DbNotFound
    return story


def convert_story_to_multiplayer_if_needed(story: Story, user: User, session: Session):
    """idempotently convert story to the current user, if logged in"""

    if user.single_player is False and story.single_player_mode is True:
        single_player = get_single_player_user(session)
        story.single_player_mode = False
        story.original_author_id = user.id
        story.player_ordering[0].user_id = user.id
        for segment in story.segments:
            if segment.author.id == single_player.id:
                segment.author_id = user.id
        session.add(story)
        session.commit()


def add_invitation(invitation: InvitationNew, session: Session) -> Invitation:
    """create an invitation that can be redeemed by anyone with the link
    in the email"""
    story = get_story(story_uuid=invitation.story_uuid, session=session)
    i = Invitation(
        invitee_email=invitation.invitee_email,
        story=story,
        responded=False,
    )
    session.add(i)
    session.commit()
    session.refresh(i)
    return i


def respond_to_invitation(invitation: Invitation, user: User, session: Session):
    """redeem the invitation so that the logged in user will be allowed
    to add to the story"""
    invitation.responded = True
    n_players = len(invitation.story.players) + 1
    invitation.story.player_ordering.append(PlayerOrder(user=user, order=n_players))
    session.add(invitation)
    session.commit()

    session.refresh(invitation)

    return invitation
