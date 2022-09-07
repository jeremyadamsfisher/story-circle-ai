import os
import random
import re
import string
import time

import requests
from loguru import logger
from sqlmodel import Session

from . import crud
from .db import get_engine
from .models import StorySegment

N_FAILURES_ALLOWED = 10
MAX_PROMPT_LENGTH = 50
WORDS_THAT_CAN_HAVE_A_PERIOD = ["mr" "ms" "mrs" "jr" "sr"]
MODEL_ID = "gpt2-large"

SENTENCE_STARTERS = ["Then, ", "Suddenly, ", "And then, ", "So, ", "Granted, "]


def text_generator_testing(prompt):
    EXAMPLE = "So we beat on, boats against the current, borne back ceaselessly into the past."
    return [{"generated_text": prompt + EXAMPLE}]


def text_generator_hosted(prompt):
    api_token = os.environ["HUGGINGFACE_API_TOKEN"]
    r = requests.post(
        f"https://api-inference.huggingface.co/models/{MODEL_ID}",
        headers={"Authorization": f"Bearer {api_token}"},
        json={"inputs": prompt, "use_cache": False},
    )
    r.raise_for_status()
    return r.json()


def text_generator_local(prompt):
    from transformers import pipeline

    return pipeline("text-generation", MODEL_ID)(prompt)


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


def check_for_imbalance(text: str) -> bool:
    """Make sure there is no imbalanced punctuation

    Example:
        >>> assert check_for_imbalance('Steve said, "Woah."') is True
        >>> assert check_for_imbalance('Then Fabiola said, "This is great.') is False
    """
    for open_, close in ["''", '""', "()", "[]", "<>"]:
        if open_ == close and text.count(open_) % 2 != 0:
            return False
        elif text.count(open_) != text.count(close):
            return False
    return True


def next_segment_prediction(prompt: str) -> str:
    starter = "" if 0.0 <= random.random() < 0.05 else random.choice(SENTENCE_STARTERS)
    prompt = prompt.strip()
    prompt_full = (prompt + " " + starter)[-MAX_PROMPT_LENGTH:]
    (res,) = text_generator(prompt_full)
    text_gen_raw = res["generated_text"]
    text_gen = starter + text_gen_raw[len(prompt_full) :]
    text_gen = (
        "".join(c for c in text_gen if c in string.printable)
        .replace("\n", " ")
        # aesthetically and narratively, I find it more pleasing to collapse these dots
        .replace("…", ".")
        .replace("...", ".")
    )
    while "  " in text_gen:
        text_gen = text_gen.replace("  ", " ")

    logger.info(
        "\n"
        "STARTER:         {}\n"
        "PROMPT:          {}\n"
        "TEXT GEN'D:      {}\n"
        "TEXT CLEANED UP: {}",
        starter,
        prompt,
        text_gen_raw,
        text_gen,
    )

    try:
        # Regex explanation: find a word, then match few non-word characters until
        # a sentence terminating punctuation is unencoutered. If present,
        # the terminating quotation mark is captured as well.
        # TODO: the model likes quoted dialog, and it would be nice to be able
        #       to recover those model outputs
        (text_gen, _) = re.match(r"""\W*(.*?[\.!?](["'])?)""", text_gen).groups()
    except (ValueError, AttributeError):
        raise InferenceProblemNotASentence(f"invalid sentence: {text_gen}")
    if len(text_gen) == 0:
        raise InferenceProblemEmptyPrediction(
            f"unable to generate from prompt: {prompt_full}\n"
            f"generated text: {text_gen_raw}"
        )
    elif len(text_gen) < 10:
        raise InferenceProblemEmptyPrediction(
            f"generated text is too short from prompt: {prompt_full}\n"
            f"generated text: {text_gen_raw}"
        )
    elif check_for_imbalance(text_gen) is False:
        raise InferenceGrammaticalWonkiness(
            f"generated text is grammatically weird: {prompt_full}\n"
            f"generated text: {text_gen_raw}"
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
        for _ in range(N_FAILURES_ALLOWED):
            try:
                next_segment_content = next_segment_prediction(prompt)
            except (
                InferenceProblemNotASentence,
                InferenceProblemEmptyPrediction,
                InferenceGrammaticalWonkiness,
            ) as e:
                logger.error(e)
                continue
            except requests.exceptions.HTTPError:
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
