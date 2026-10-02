#!/bin/sh
# Creates the Payload-owned website database alongside the portal database.
# Runs only when the Postgres volume is first initialised; existing volumes
# need the same statements applied once by hand (docs/production-deployment.md).
set -eu

: "${WEBSITE_DATABASE_NAME:=usstm_website}"
: "${WEBSITE_DATABASE_USER:=usstm_website}"
: "${WEBSITE_DATABASE_PASSWORD:?WEBSITE_DATABASE_PASSWORD is required}"

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set name="$WEBSITE_DATABASE_NAME" \
  --set user="$WEBSITE_DATABASE_USER" \
  --set password="$WEBSITE_DATABASE_PASSWORD" <<'SQL'
CREATE ROLE :"user" LOGIN PASSWORD :'password';
CREATE DATABASE :"name" OWNER :"user";
REVOKE ALL ON DATABASE :"name" FROM PUBLIC;
SQL
