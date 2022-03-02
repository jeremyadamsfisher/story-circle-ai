#!/usr/bin/env bash

export DATABASE_URL="postgresql://jeremy.adams.fisher%40gmail.com@localhost:5557/$PGDATABASE"

cloud_sql_proxy \
  -enable_iam_login \
  -instances=$PGCONNSTR=tcp:5557 & 

sleep 3 \
&& alembic upgrade head

fuser -k 5557/tcp
