import pytest

ACTUAL_OUTPUT_FROM_MODEL = []


@pytest.mark.parametrize("model_output", ACTUAL_OUTPUT_FROM_MODEL)
def test_inference_postprocessing(model_output):
    raise NotImplementedError
