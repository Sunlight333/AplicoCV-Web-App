# AplicoCV backend image. Used for the api, celery worker, and celery beat
# services (they differ only by command in docker-compose.yml).
FROM python:3.12-slim

# System deps: Poppler + Tesseract power the scanned-PDF OCR path; curl is used
# by the container healthcheck.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        poppler-utils \
        tesseract-ocr \
        curl \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    UPLOAD_DIR=/data/uploads

WORKDIR /app

# Install Python deps first for better layer caching.
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# App code (the .dockerignore keeps .libs/.env/db/caches out of the image).
COPY . .

RUN mkdir -p /data/uploads

EXPOSE 8000

# Multi-worker uvicorn; worker count is overridable via UVICORN_WORKERS.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${UVICORN_WORKERS:-2}"]
