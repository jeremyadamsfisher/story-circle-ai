import os
import re
import string

import requests
from sqlmodel import Session
from loguru import logger

from . import crud
from .db import get_engine
from .models import StorySegment


N_FAILURES_ALLOWED = 10
MAX_PROMPT_LENGTH = 50
WORDS_THAT_CAN_HAVE_A_PERIOD = ["mr" "ms" "mrs" "jr" "sr"]


def text_generator_testing(prompt):
    EXAMPLE = "So we beat on, boats against the current, borne back ceaselessly into the past."
    return [{"generated_text": prompt + EXAMPLE}]


def text_generator_hosted(prompt):
    api_token = os.environ["HUGGINGFACE_API_TOKEN"]
    r = requests.post(
        "https://api-inference.huggingface.co/models/pranavpsv/gpt2-genre-story-generator",
        headers={"Authorization": f"Bearer {api_token}"},
        json={"inputs": prompt, "use_cache": False},
    )
    r.raise_for_status()
    return r.json()


def text_generator_local(prompt):
    from transformers import pipeline

    return pipeline("text-generation", "pranavpsv/gpt2-genre-story-generator")(prompt)


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


def next_segment_prediction(prompt: str) -> str:
    prompt = prompt.strip()
    prompt_full = (prompt + " ")[-MAX_PROMPT_LENGTH:]
    (text_gen_raw,) = text_generator(prompt_full)
    text_gen_raw = text_gen_raw["generated_text"]
    text_gen_raw = text_gen_raw[len(prompt_full) :]
    text_gen = "".join(c for c in text_gen_raw if c in string.printable)
    try:
        (text_gen,) = re.match(r"\W*(\w.*?\.)", text_gen).groups()
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
                requests.exceptions.HTTPError,
            ) as e:
                logger.error(e)
                continue
            else:
                segment = StorySegment(
                    author=crud.get_ai_player_user(session),
                    story=story,
                    content=next_segment_content,
                    ai_generated=True,
                    order=len(story.segments),
                )
                story.segments.append(segment)
                session.add(story)
                session.commit()
                break
        else:
            raise InferenceProblem("unable to advance story")
