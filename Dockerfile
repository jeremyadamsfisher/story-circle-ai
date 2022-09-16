FROM tiangolo/uvicorn-gunicorn-fastapi:python3.9

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

RUN python -m spacy download en_core_web_sm

COPY backend backend

CMD gunicorn --workers 1 --threads 8 --bind :8080 backend.main:app