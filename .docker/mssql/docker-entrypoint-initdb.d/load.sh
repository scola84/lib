#!/bin/bash
# see https://github.com/mcmoe/mssqldocker/blob/master/configure-db.sh

export STATUS=1
i=0

while [[ $STATUS -ne 0 ]] && [[ $i -lt 30 ]]; do
	i=$i+1
	/opt/mssql-tools/bin/sqlcmd -t 1 -U sa -P rootRoot1 -Q "select 1" >> /dev/null
	STATUS=$?
done

if [ $STATUS -ne 0 ]; then 
	echo "Error: MSSQL SERVER took more than thirty seconds to start up."
	exit 1
fi

shopt -s globstar
shopt -s nullglob

/opt/mssql-tools/bin/sqlcmd -l 0 -S localhost -U sa -P rootRoot1 -Q 'CREATE DATABASE [scola]'

for file in /docker-entrypoint-initdb.d/**/*.sql; do
  /opt/mssql-tools/bin/sqlcmd -l 0 -S localhost -U sa -P rootRoot1 -d scola -i $file
done
