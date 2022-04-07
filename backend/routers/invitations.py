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
from ..models import InvitationNew, InvitationRead

router = APIRouter()

INVITE_SUBJECT = "You've been invited to contribute to an AI story!"
INVITE_HTML = """
<html>
    <body>
        <p>You've been invited to work on a story with AI agents!</p>
        <a id="email-link" href="{}">Click here!</a>
    <body>
</html>
"""


@router.post("/send", response_model=InvitationRead)
async def send_invitation(
    *,
    session: Session = Depends(get_session),
    user=Depends(get_user_from_request),
    background_tasks: BackgroundTasks,
    invitation_: InvitationNew,
):
    if not any(
        story.story_uuid == invitation_.story_uuid for story in user.stories_originated
    ):
        raise HTTPException(
            403, "can only invite other users to stories user originated"
        )

    invitation = crud.add_invitation(invitation_, session)

    story_url = reduce(
        urljoin,
        [os.environ["APP_ORIGIN"], "/invitations/respond", str(invitation.id)],
    )

    msg = MessageSchema(
        subject=INVITE_SUBJECT,
        recipients=[invitation.invitee_email],
        body=INVITE_HTML.format(story_url),
    )

    background_tasks.add_task(email_client.send_message, msg)

    return invitation


@router.get("/respond/{invitation_id}")
def respond_to_invitation(
    *,
    invitation_id: int,
    session: Session = Depends(get_session),
    user=Depends(get_user_from_request),
):
    crud.respond_to_invitation(invitation_id, user, session)
