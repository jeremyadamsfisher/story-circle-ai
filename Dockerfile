FROM tiangolo/uvicorn-gunicorn-fastapi:python3.9
WORKDIR /app
RUN pip install --upgrade pip
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
# Bleeding-edge install for this bug fix: https://github.com/GoogleCloudPlatform/cloud-sql-python-connector/pull/273
RUN pip install "git+git://github.com/GoogleCloudPlatform/cloud-sql-python-connector"

# warm start
RUN python -c 'from transformers import pipeline; pipeline("text-generation", "pranavpsv/gpt2-genre-story-generator")'


COPY app app
