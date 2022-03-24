import logging
import re
import string

from sqlmodel import Session
from transformers import pipeline

from . import crud
from .db import get_engine
from .models import Story, StorySegment

logger = logging.getLogger(__name__)

N_FAILURES_ALLOWED = 10
MAX_PROMPT_LENGTH = 50
WORDS_THAT_CAN_HAVE_A_PERIOD = ["mr" "ms" "mrs" "jr" "sr"]

# text_generator = pipeline("text-generation", "pranavpsv/gpt2-genre-story-generator")
text_generator = lambda s: (s,)


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
    return text_gen


def perform_ai_turn(story_id):
    engine = get_engine()
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
                    order=len(story.segments),
                )
                story.segments.append(segment)
                session.add(story)
                session.commit()
                break
        else:
            raise InferenceProblem("unable to advance story")
