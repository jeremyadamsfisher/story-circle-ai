import logging
import re
import string

from sqlmodel import Session
from transformers import pipeline

from . import crud
from .db import engine
from .models import Story, StorySegment

logger = logging.getLogger(__name__)

N_FAILURES_ALLOWED = 10
MAX_PROMPT_LENGTH = 50
text_generator = pipeline("text-generation", "pranavpsv/gpt2-genre-story-generator")


class InferenceProblem(Exception):
    ...


class InferenceProblemNotASentence(Exception):
    ...


class InferenceProblemEmptyPrediction(Exception):
    ...


def next_segment_prediction(prompt: str) -> str:
    prompt_full = ("<BOS> <action> " + prompt)[-MAX_PROMPT_LENGTH:]
    (text_gen,) = text_generator(prompt_full)
    text_gen = text_gen["generated_text"]
    text_gen = "".join(c for c in text_gen if c in string.printable)
    try:
        (text_gen,) = re.match(r"^(.*?\.)", text_gen).groups()
    except (ValueError, AttributeError):
        raise InferenceProblemNotASentence(f"invalid sentence: {text_gen}")
    text_gen = text_gen[len(prompt_full) :]
    if len(text_gen) == 0:
        raise InferenceProblemEmptyPrediction(
            f"unable to generate from prompt: {prompt_full}"
        )
    return text_gen


def perform_ai_turn(story_id):
    with Session(engine) as session:
        try:
            story = crud.get_story(story_id, session)
        except crud.DbNotFound:
            raise crud.DbIssue(f"could not find {story_id}")
        prompt = " ".join([s.content for s in story.segments])
        for _ in range(N_FAILURES_ALLOWED):
            try:
                next_segment_content = next_segment_prediction(prompt)
            except (InferenceProblemNotASentence, InferenceProblemEmptyPrediction) as e:
                logger.error(e)
                continue
            else:
                segment = StorySegment(
                    author=crud.get_ai_player_user(session),
                    story=story,
                    content=next_segment_content,
                    ai_generated=True,
                )
                story.segments.append(segment)
                session.add(story)
                session.commit()
                break
        else:
            raise InferenceProblem("unable to advance story")
