#!/bin/bash

shopt -s nullglob

for file in /docker-entrypoint-initdb.d/**/schema/*.sql; do
  mysql --user root --password=root --database mysql <$file
done

for file in /docker-entrypoint-initdb.d/**/data/*.sql; do
  mysql --user root --password=root --database $(basename ${file%.*}) <$file
done
