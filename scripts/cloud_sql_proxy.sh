#!/usr/bin/env bash

cloud_sql_proxy \
  -enable_iam_login \
  -instances=$PGCONNSTR=tcp:5558
