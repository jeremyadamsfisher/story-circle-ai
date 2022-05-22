import uuid


def test_fixture_crashes_if_accessing_multiplayer_route_without_setting_user(
    client, test_exceptions
):
    try:
        client.post(f"/story/{uuid.uuid4()}/multiPlayer")
    except test_exceptions["need_to_set_a_user"]:
        pass
    else:
        raise Exception
