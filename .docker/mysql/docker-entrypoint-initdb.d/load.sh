#!/bin/bash

shopt -s globstar -s nullglob

for file in /docker-entrypoint-initdb.d/**/*.sql; do
  mysql --user root --password=root --database mysql <$file
done
