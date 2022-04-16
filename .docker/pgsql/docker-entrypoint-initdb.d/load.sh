#!/bin/bash

shopt -s globstar
shopt -s nullglob

for file in /docker-entrypoint-initdb.d/**/*.sql; do
  psql --username root --dbname postgres <$file
done
