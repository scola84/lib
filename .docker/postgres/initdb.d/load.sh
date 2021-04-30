#!/bin/bash

shopt -s nullglob

for file in /docker-entrypoint-initdb.d/**/schema/*.sql; do
  psql --username root --dbname postgres <$file
done

for file in /docker-entrypoint-initdb.d/**/data/*.sql; do
  psql --username root --dbname $(basename ${file%.*}) <$file
done
