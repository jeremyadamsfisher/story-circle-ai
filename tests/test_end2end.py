import base64
import time
from email.mime.multipart import MIMEMultipart
from typing import Optional, Tuple

import pytest
from bs4 import BeautifulSoup

from backend import crud
from backend.lib.email import email_client

EXAMPLE_USER_EMAILS = [f"player{i}@foo.com" for i in range(1, 4)]
P1, P2, P3 = EXAMPLE_USER_EMAILS


### utilities ###


def create_story(client, story_mode, expected_status_code=200):
    assert story_mode in {"single", "multi"}
    r_create_story = client.post(f"/story/{story_mode}Player")
    assert r_create_story.status_code == expected_status_code
    story_uuid = r_create_story.json()["story_uuid"]
    return story_uuid


def add_to_story(
    client, story_uuid, story_content, story_mode, expected_status_code=200
):
    assert story_mode in {"single", "multi"}
    r = client.post(
        f"/story/{story_uuid}/{story_mode}Player", json={"content": story_content}
    )
    assert r.status_code == expected_status_code


def get_story_status(client, story_uuid, story_mode, expected_status_code=200):
    r = client.get(f"/story/{story_uuid}/{story_mode}Player")
    assert r.status_code == expected_status_code
    return r.json()


def send_invite(
    client, story_uuid, email_address, expected_status_code=200
) -> Optional[Tuple[MIMEMultipart, int]]:
    """send an invitation, used with the `simple_email_payload` fixture

    Returns:
        str: url of the invitation response
    """
    with email_client.record_messages() as outbox:
        r = client.post(
            f"/invitations/send",
            json={"story_uuid": story_uuid, "invitee_email": email_address},
        )
        assert r.status_code == expected_status_code
        if r.status_code != 200:
            return
        invitation_id = r.json()["id"]
        email = outbox[0]
        return email, invitation_id


def respond_to_invite(client, invitation_id):
    r = client.get(f"/invitations/respond/{invitation_id}")
    assert r.status_code == 200


def decode_email_payload(email: MIMEMultipart) -> str:
    parts = []
    for part in email.get_payload():
        part = base64.b64decode(part.get_payload()).decode()
        parts.append(part)
    return "".join(parts)


def extract_invite_url_from_email_payload(email_payload: str) -> str:
    soup = BeautifulSoup(email_payload, "html.parser")
    url = soup.find(id="email-link")["href"]
    return url


### utilities ###


def test_health_check(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"msg": "ok"}


def test_single_player_can_create_story(client):
    """
    User creates a story and checks that its their turn first
    """
    story_uuid = create_story(client, "single")
    story = get_story_status(client, story_uuid, "single")
    assert story_uuid == story["story_uuid"]
    assert story["whose_turn_is_it"]["name"] == "single-player"
    assert story["whose_turn_is_it"]["single_player"] == True


def test_single_player_can_add_to_story(client):
    """
    User creates a story and adds to it
    """

    story_uuid = create_story(client, "single")

    segments = ["Once upon a time.", "There was a man."]
    s1, s2 = segments

    for segment in segments:
        add_to_story(client, story_uuid, segment, "single")
        for _ in range(10):
            story = get_story_status(client, story_uuid, "single")
            if story["whose_turn_is_it"]["single_player"]:
                break
            else:
                time.sleep(2)
        else:
            raise Exception("too many retries")

    story = get_story_status(client, story_uuid, "single")
    segments = [segment["content"] for segment in story["segments"]]
    assert segments == [s1, "foo", s2, "foo"]


def test_invitation_contains_invitation_id(client_context):
    """
    User creates a story and invites another player. Ensure email
    contains relevant information
    """
    client, _, active_user = client_context

    with active_user(P1):
        story_uuid = create_story(client, "multi")
        email, invitation_id = send_invite(client, story_uuid, email_address=P2)
        payload = decode_email_payload(email)
        invitation_url = extract_invite_url_from_email_payload(payload)
        assert email["to"] == P2
        assert str(invitation_id) == invitation_url[-len(str(invitation_id)) :]


def test_invited_player_can_add_to_story(client_context):
    """
    User starts a story and invites another player, allowing
    them to add to the story at the apropriate time
    """
    client, session, active_user = client_context

    with active_user(P1):
        story_uuid = create_story(client, "multi")
        add_to_story(client, story_uuid, "foo", "multi")
        _, invite_id = send_invite(client, story_uuid, email_address=P2)

    with active_user(P2):
        respond_to_invite(client, invite_id)
        add_to_story(client, story_uuid, "bar", "multi")

    story = crud.get_story(story_uuid, session)
    assert [s.content for s in story.segments] == ["foo", "foo", "bar"]


def test_user_cannot_interfere_when_its_not_their_turn(client_context):
    """
    User is rebuffed when trying to interfere with the story when it
    is not their turn
    """

    client, _, active_user = client_context

    with active_user(P1):
        story_uuid = create_story(client, "multi")
        add_to_story(client, story_uuid, "foo", "multi")
        _, invite_id = send_invite(client, story_uuid, email_address=P2)

    with active_user(P2):
        respond_to_invite(client, invite_id)

    with active_user(P1):
        # Here, the user tries to add to the story again __before__ the new player
        # has a chance to add anything
        add_to_story(client, story_uuid, "foo", "multi", expected_status_code=403)


def test_can_only_add_after_invited(client_context):
    """
    Another player tries to hijack a story, but is rebuffed and can
    only add when it is their turn
    """
    client, _, active_user = client_context

    # First, player 1 creates a story

    with active_user(P1):
        story_uuid = create_story(client, "multi")

    # Player 2 maliciously tries to add to the story when its not
    # their turn and before they are invited

    with active_user(P2):
        add_to_story(client, story_uuid, "foo", "multi", expected_status_code=403)

    # Player 1 takes their legal turn, followed by the AI

    with active_user(P1):
        add_to_story(client, story_uuid, "foo", "multi")
        _, invite_id = send_invite(client, story_uuid, email_address=P2)

    # Now player 2 can take their turn legally

    with active_user(P2):
        respond_to_invite(client, invite_id)
        add_to_story(client, story_uuid, "foo", "multi", expected_status_code=200)


def test_only_original_author_can_invite_people(client_context):
    client, _, active_user = client_context

    with active_user(P1):
        story_uuid = create_story(client, "multi")

    with active_user(P2):
        send_invite(client, story_uuid, email_address=P3, expected_status_code=403)


def test_viewing_a_single_player_game_logged_in_converts_to_multiplayer(client_context):
    client, session, active_user = client_context

    story_uuid = create_story(client, "single")

    story = crud.get_story(story_uuid, session)
    assert story.single_player_mode is True

    with active_user(P1):
        get_story_status(client, story_uuid, "multi")

    story = crud.get_story(story_uuid, session)
    assert story.original_author.name == P1
    assert story.player_ordering[0].user.name == P1
    assert story.single_player_mode is False


def test_cannot_add_to_owned_story_if_single_player(client_context):
    client, _, active_user = client_context
    with active_user(P1):
        story_uuid = create_story(client, "multi")
    add_to_story(client, story_uuid, "foo", "single", expected_status_code=403)


def test_user_can_start_a_story_and_continue_logged_in(client_context):
    client, session, active_user = client_context

    story_uuid = create_story(client, "single")
    story = crud.get_story(story_uuid, session)
    assert story.original_author.name == "single-player"
    assert story.single_player_mode is True

    SAMPLE = "foo"

    with active_user(P1):
        add_to_story(client, story_uuid, SAMPLE, "multi")

    story = crud.get_story(story_uuid, session)
    assert story.original_author.name == P1
    assert story.player_ordering[0].user.name == P1
    assert story.single_player_mode is False
    assert story.segments[0].content == SAMPLE
