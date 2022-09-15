import os
import random
import re
import time

import requests
import spacy
import unidecode
from loguru import logger
from sqlmodel import Session

from . import crud
from .db import get_engine
from .models import StorySegment

logger.info("loading spacy...")
nlp = spacy.load("en_core_web_sm")
logger.info("...done loading spacy")

N_FAILURES_ALLOWED = 10
WORDS_THAT_CAN_HAVE_A_PERIOD = ["mr" "ms" "mrs" "jr" "sr"]
MODEL_ID = "EleutherAI/gpt-j-6B"
ALT_MODEL_IDS = ["gpt2", "gpt2-large", "EleutherAI/gpt-neo-125M"]

DOCSTRING_ARGS = """
    Args:
        model_id_override (str, optional): if present, use instead

    Returns:
        List[Dict[str, str]]: generated output
    """


def text_gen(f):
    def inner(*args, **kwargs):
        res, = f(*args, **kwargs)
        return res["generated_text"]
    return inner
    


@text_gen
def text_generator_testing(prompt, model_id_override=None):
    r"""Generate a simple story continuation for quick tests.
    {}""".format(
        DOCSTRING_ARGS
    )
    EXAMPLE = "So we beat on, boats against the current, borne back ceaselessly into the past."
    return [{"generated_text": prompt + EXAMPLE}]


@text_gen
def text_generator_hosted(prompt, model_id_override=None):
    r"""Generate text using 🤗 inference
    {}""".format(
        DOCSTRING_ARGS
    )
    api_token = os.environ["HUGGINGFACE_API_TOKEN"]
    model_id = model_id_override if model_id_override else MODEL_ID
    r = requests.post(
        f"https://api-inference.huggingface.co/models/{model_id}",
        headers={"Authorization": f"Bearer {api_token}"},
        json={
            "inputs": prompt,
            "parameters": {
                "temperature": 1.1,
                "max_new_tokens": 50,
            },
            "options": {
                "use_cache": False,
            },
        },
    )
    r.raise_for_status()
    return r.json()


@text_gen
def text_generator_local(prompt, model_id_override=None):
    r"""Generate text using 🤗 pipelines
    {}""".format(
        DOCSTRING_ARGS
    )
    from transformers import pipeline

    model_id = model_id_override if model_id_override else MODEL_ID
    return pipeline("text-generation", model_id)(prompt)


text_generator = {
    "TESTING": text_generator_testing,
    "LOCAL": text_generator_local,
    "PROD": text_generator_hosted,
}[os.environ["APP_ENV"]]


class InferenceProblem(Exception):
    ...


class InferenceProblemNotASentence(Exception):
    ...


class InferenceProblemEmptyPrediction(Exception):
    ...


class InferenceGrammaticalWonkiness(Exception):
    ...


def is_balanced(text: str) -> bool:
    """Make sure there is no imbalanced punctuation

    Example:
        >>> assert is_balanced('Steve said, "Woah."') is True
        >>> assert is_balanced('Then Fabiola said, "This is great.') is False
    """
    for open_, close in ["''", '""', "()", "[]", "<>"]:
        if open_ == close and text.count(open_) % 2 != 0:
            return False
        elif text.count(open_) != text.count(close):
            return False
    return True


def next_segment_prediction(prompt: str, model_id_override=None) -> str:
    prompt = (
        # Try to sample from high-quality/literary/SFW, parts of the distribution
        "This is a excerpt from a well-written, hilarious, audacious, "
        "lyrical, poetic, profound, high-quality, age-apropriate, young "
        "adult novel:"
        "\n\n"
        # Indicate a change in style, i.e.: "Start the story here" -> previous segment -> new segment
        "Chapter 1:"
        "\n\n"
        "{}".format(prompt.strip() + " ")
    )
    prompt = unidecode.unidecode(prompt)

    text_gen = text_generator(prompt, model_id_override)
    text_gen = text_gen[len(prompt) :]
    text_gen = unidecode.unidecode(text_gen)

    # Fix white-space wonkiness
    while "  " in text_gen:
        text_gen = text_gen.replace("  ", " ")

    # Remove partial sentences
    doc = nlp(text_gen)
    sents = []
    for sent in doc.sents:
        sent = sent.text.strip()
        # sentence ends with a punctuation mark, or a punctuation mark followed by a quotation mark
        valid_sentence_pattern = r"""^.*[\.!]|([\.!]["'])?$"""
        if re.match(valid_sentence_pattern, sent) and is_balanced(sent):
            sents.append(sent)
        else:
            break
    text_gen = " ".join(sents)

    if len(text_gen) < 10:
        raise InferenceProblemEmptyPrediction(
            f"generated text is too short from prompt: `{prompt}` generated text: `{text_gen}`"
        )
    elif not is_balanced(text_gen):
        raise InferenceGrammaticalWonkiness(
            f"generated text is grammatically weird: `{prompt}`, generated text: `{text_gen}`"
        )

    return text_gen


def perform_ai_turn(story_id):
    engine = get_engine()
    with Session(engine) as session:
        try:
            story = crud.get_story(story_id, session)
            if story is None:
                raise crud.DbNotFound
        except crud.DbNotFound:
            raise crud.DbIssue(f"could not find {story_id}")
        prompt = " ".join([s.content for s in story.segments])
        model_id = None
        for _ in range(N_FAILURES_ALLOWED):
            try:
                next_segment_content = next_segment_prediction(
                    prompt, model_id_override=model_id
                )
            except (
                InferenceProblemNotASentence,
                InferenceProblemEmptyPrediction,
                InferenceGrammaticalWonkiness,
            ) as e:
                logger.error(e)
                continue
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 503:
                    # sometimes, there is an error with a particular model
                    model_id = random.choice(ALT_MODEL_IDS)
                logger.error(e)
                time.sleep(2)
                continue
            else:
                segment = StorySegment(
                    author=crud.get_ai_player_user(session),
                    story=story,
                    content=next_segment_content,
                    ai_generated=True,
                    order=len(story.segments),
                )
                break
        else:  # if the loop concludes without breaking
            segment = StorySegment(
                author=crud.get_ai_player_user(session),
                story=story,
                content="And then, something interesting happened.",
                ai_generated=True,
                order=len(story.segments),
            )
        story.segments.append(segment)
        session.add(story)
        session.commit()
