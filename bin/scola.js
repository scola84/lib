#!/usr/bin/env node

require('commander')
  .command('dc-reload', 'Reloads a Docker Compose service')
  .command('sql-diff <container> <source-db> [target-path]', 'Dumps the diff of a SQL database and a DDL file')
  .command('sql-schema <container> <source-db> [target-path]', 'Dumps the schema of a SQL database')
  .command('sql-ts <source-db> <target-path>', 'Creates TypeScript interfaces based on the tables of a SQL database')
  .parse()
