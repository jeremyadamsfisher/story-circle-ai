import os
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

INVITE_SUBJECT = "{} invited to contribute to an AI story!"
INVITE_HTML = """<div>
    <span>{} invited you to work on a story with AI agents!</span>
    <a id="email-link" href="{}">Click here!</a>
</div>"""


@router.post("/send", response_model=InvitationRead)
async def send_invitation(
    *,
    session: Session = Depends(get_session),
    user=Depends(get_user_from_request),
    background_tasks: BackgroundTasks,
    model: InvitationNew,
):
    try:
        story = crud.get_story(model.story_uuid, session)
    except crud.DbNotFound:
        raise HTTPException(404, "story to which user is inviting not found")

    if not any(
        story.story_uuid == model.story_uuid for story in user.stories_originated
    ):
        logger.warning(
            "{} attempted to invite a user to a story they did not originate",
            user.name,
        )
        raise HTTPException(
            403, "can only invite other users to stories user originated"
        )

    if any(model.invitee_email == player.name for player in story.players):
        raise HTTPException(
            403, "cannot invite a player that has already accepted an invitation"
        )

    invitation = crud.add_invitation(model, session)

    story_url = urljoin(
        os.environ.get("FRONTEND_URL", "localhost:3000"),
        f"/invitation?id={invitation.id}",
    )

    msg = MessageSchema(
        subject=INVITE_SUBJECT.format(user.name),
        recipients=[invitation.invitee_email],
        html=INVITE_HTML.format(user.name, story_url),
        subtype="html",
    )

    logger.info(
        "inviting {} to {}", invitation.invitee_email, invitation.story.story_uuid
    )

    background_tasks.add_task(email_client.send_message, msg)

    return invitation


@router.post("/respond/{invitation_id}", response_model=InvitationRead)
def respond_to_invitation(
    *,
    invitation_id: int,
    session: Session = Depends(get_session),
    user=Depends(get_user_from_request),
):
    invitation = session.get(Invitation, invitation_id)
    if invitation is None:
        raise HTTPException(404, "invitation not found")
    if invitation.invitee_email != user.name:
        logger.warning(
            "{} attempted to respond to invitation for {}",
            invitation.invitee_email,
            user.name,
        )
        raise HTTPException(422, "invitation email does not match the JWT email")
    if invitation.responded:
        raise HTTPException(409, "invitation has already been redeemed")

    return crud.respond_to_invitation(invitation, user, session)
