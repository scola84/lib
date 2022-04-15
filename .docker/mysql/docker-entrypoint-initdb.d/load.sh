#!/bin/bash

shopt -s globstar
shopt -s nullglob

for file in /docker-entrypoint-initdb.d/**/*.sql; do
  mysql --user root --password=root --database mysql <$file
done
