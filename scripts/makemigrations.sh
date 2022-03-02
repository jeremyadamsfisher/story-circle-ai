#!/usr/bin/env bash

fuser -k 5557/tcp

export DATABASE_URL="postgresql://jeremy.adams.fisher%40gmail.com@localhost:5557/$PGDATABASE"

read -p "Enter a one-word summary for the migrations: " NAME

cloud_sql_proxy \
  -enable_iam_login \
  -instances=$PGCONNSTR=tcp:5557 &

sleep 3 && alembic revision --autogenerate -m $NAME

fuser -k 5557/tcp
