import os
from functools import reduce
from urllib.parse import urljoin

from fastapi import BackgroundTasks, Depends, HTTPException
from fastapi_mail import MessageSchema
from loguru import logger
from sqlmodel import Session

from .. import crud
from ..auth import get_user_from_request
from ..db import get_session
from ..lib.email import email_client
from ..lib.shims import APIRouter
from ..models import Invitation, InvitationNew, InvitationRead

router = APIRouter()

INVITE_SUBJECT = "You've been invited to contribute to an AI story!"
INVITE_HTML = """<span>
    <span>You've been invited to work on a story with AI agents!</span>
    <a id="email-link" href="{}">Click here!</a>
</span>"""


@router.post("/send", response_model=InvitationRead)
async def send_invitation(
    *,
    session: Session = Depends(get_session),
    user=Depends(get_user_from_request),
    background_tasks: BackgroundTasks,
    model: InvitationNew,
):
    if not any(
        story.story_uuid == model.story_uuid for story in user.stories_originated
    ):
        logger.warn(
            "{} attempted to invite a user to a story they did not originate",
            user.email,
        )
        raise HTTPException(
            403, "can only invite other users to stories user originated"
        )

    invitation = crud.add_invitation(model, session)

    story_url = urljoin(os.environ["FRONTEND_URL"], f"/invitation?id={invitation.id}")

    msg = MessageSchema(
        subject=INVITE_SUBJECT,
        recipients=[invitation.invitee_email],
        body=INVITE_HTML.format(story_url),
        subtype="html",
    )

    background_tasks.add_task(email_client.send_message, msg)

    return invitation


@router.get("/respond/{invitation_id}", response_model=InvitationRead)
def respond_to_invitation(
    *,
    invitation_id: int,
    session: Session = Depends(get_session),
    user=Depends(get_user_from_request),
):
    invitation = session.get(Invitation, invitation_id)
    if invitation is None:
        raise HTTPException(404, "invitation not found")
    if invitation.invitee_email != user.email:
        logger.warn(
            "{} attempted to respond to invitation for",
            invitation.invitee_email,
            user.email,
        )
        raise HTTPException(403, "invitation email does not match the JWT email")
    return crud.respond_to_invitation(invitation, user, session)
