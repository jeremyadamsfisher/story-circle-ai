FROM tiangolo/uvicorn-gunicorn-fastapi:python3.9

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

RUN python -m spacy download en_core_web_sm

COPY backend backend

CMD gunicorn backend.main:app  --bind 0.0.0.0:$PORT --worker-class uvicorn.workers.UvicornWorker 