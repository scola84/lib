#!/bin/sh

if [ -d "/docker-entrypoint-initdb.d/schema" ]; then
  for file in /docker-entrypoint-initdb.d/schema/*.sql; do
    mysql --user root --password=root --database mysql <$file
  done
fi

if [ -d "/docker-entrypoint-initdb.d/data" ]; then
  for file in /docker-entrypoint-initdb.d/data/*.sql; do
    mysql --user root --password=root --database $(basename ${file%.*}) <$file
  done
fi
