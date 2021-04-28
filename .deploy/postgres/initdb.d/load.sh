#!/bin/sh

if [ -d "/docker-entrypoint-initdb.d/schema" ]; then
  for file in /docker-entrypoint-initdb.d/schema/*.sql; do
    psql --username root --dbname postgres <$file
  done
fi

if [ -d "/docker-entrypoint-initdb.d/data" ]; then
  for file in /docker-entrypoint-initdb.d/data/*.sql; do
    psql --username root --dbname $(basename ${file%.*}) <$file
  done
fi
