#!/usr/bin/env node

require('commander')
  .command('dc-reload <container>', 'Reloads a Docker service')
  .command('sql-clean', 'Cleans up data and diff dumps')
  .command('sql-data <container> <source-db> [target-path]', 'Dumps the data of a containerized SQL database')
  .command('sql-diff <source-db> [target-path]', 'Dumps the diff between a database and a schema dump')
  .command('sql-schema <container> <source-db> [target-path]', 'Dumps the schema of a containerized SQL database')
  .command('sql-ts <source-db> <target-path>', 'Generate TS types from SQL tables')
  .parse()
