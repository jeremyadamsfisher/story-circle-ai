#!/usr/bin/env bash
( cat << EOF
APP_ENV="PROD"
HUGGINGFACE_API_TOKEN="$HUGGINGFACE_API_TOKEN"

MAIL_USERNAME="noreply@storycircle.lol"
MAIL_PASSWORD="$MAIL_PASSWORD"
MAIL_FROM="noreply@storycircle.lol"
MAIL_PORT=465
MAIL_SERVER=mail.privateemail.com

FRONTEND_URL=https://storycircle.lol
BACKEND_URL=https://storycircle.lol/api
EOF
) > .env
gcloud app deploy