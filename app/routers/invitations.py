import os
from functools import reduce
from urllib.parse import urljoin

from fastapi import BackgroundTasks, Depends, HTTPException
from fastapi_mail import MessageSchema
from pydantic import BaseModel
from sqlmodel import Session

from .. import crud
from ..auth import get_user_from_request
from ..db import get_session
from ..lib.email import email_client
from ..lib.shims import APIRouter
from ..models import PlayerOrder

invitations = APIRouter()

INVITE_HTML = """
<p>You've been invited to work on a story with AI agents!</p>
<p>Check it out: {}</p>
"""


class Invitation(BaseModel):
    story_uuid: str
    other_player_email: str


@invitations.post("/")
async def invite_user(
    *,
    session: Session = Depends(get_session),
    user=Depends(get_user_from_request),
    background_tasks: BackgroundTasks,
    invitation: Invitation
):
    if not any(
        story.story_uuid == invitation.story_uuid for story in user.stories_originated
    ):
        raise HTTPException(
            403, "can only invite other users to stories user originated"
        )

    story = crud.get_story(story_uuid=invitation.story_uuid, session=session)
    other_player = crud.get_user_by_name(invitation.other_player_email, session=session)
    player_order = PlayerOrder(
        order=len(story.player_ordering) + 1,
        user=other_player,
        story=story,
        invitation_accepted=False,
    )
    session.add(player_order)

    story_url = reduce(urljoin, [os.environ["APP_ORIGIN"], "/s", invitation.story_uuid])

    msg = MessageSchema(
        subject="You've been invited to contribute to an AI story!",
        recipients=[invitation.other_player_email],
        body=INVITE_HTML.format(story_url),
    )

    background_tasks.add_task(email_client.send_message, msg)
