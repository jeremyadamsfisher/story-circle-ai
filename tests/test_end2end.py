import time
from app import crud
from app.models import StorySegment
from app import main


def test_health_check(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"msg": "ok"}


def test_single_player_can_create_story(client):
    r_create_story = client.post("/story/singlePlayer")
    assert r_create_story.status_code == 200
    story_uuid = r_create_story.json()["story_uuid"]
    r = client.get(f"/story/{story_uuid}")
    assert r.status_code == 200
    j = r.json()
    assert story_uuid == j["story_uuid"]
    assert j["whose_turn_is_it"]["name"] == "single-player"
    assert j["whose_turn_is_it"]["single_player"] == True


def test_single_player_can_add_to_story(client_context, monkeypatch):
    client, session = client_context

    r_create_story = client.post("/story/singlePlayer")
    assert r_create_story.status_code == 200
    story_uuid = r_create_story.json()["story_uuid"]

    def test_perform_ai_turn(story_uuid):
        story = crud.get_story(story_uuid, session)
        if story is None:
            raise crud.DbNotFound
        segment = StorySegment(
            author=crud.get_ai_player_user(session),
            story=story,
            content="foo",
            ai_generated=True,
        )
        story.segments.append(segment)
        session.add(story)
        session.commit()

    monkeypatch.setattr(main, "perform_ai_turn", test_perform_ai_turn)

    segments = ["Once upon a time.", "There was a man."]
    s1, s2 = segments

    for segment in segments:
        r = client.post(f"/story/{story_uuid}/singlePlayer", json={"content": segment})
        assert r.status_code == 200
        for _ in range(10):
            rx = client.get(f"/story/{story_uuid}")
            assert rx.status_code == 200
            if rx.json()["whose_turn_is_it"]["single_player"]:
                break
            else:
                time.sleep(2)
        else:
            raise Exception("too many retries")

    r = client.get(f"/story/{story_uuid}")
    assert r.status_code == 200
    res = r.json()
    segments = [segment["content"] for segment in res["segments"]]
    assert segments == [s1, "foo", s2, "foo"]


def test_user_can_invite_other_players():
    raise NotImplementedError


def test_user_cannot_interfere_when_its_not_their_turn():
    raise NotImplementedError


def test_no_one_can_move_while_invite_is_pending():
    raise NotImplementedError


def test_can_only_add_after_invited():
    raise NotImplementedError


def test_cannot_add_to_owned_story_if_not_invited():
    raise NotImplementedError


def test_cannot_add_to_owned_story_if_single_player():
    raise NotImplementedError


def test_single_player_can_add_to_single_player_game():
    raise NotImplementedError


def test_viewing_a_single_player_game_logged_in_converts_to_multiplayer():
    raise NotImplementedError


def test_user_can_start_a_story_and_continue_logged_in():
    raise NotImplementedError
