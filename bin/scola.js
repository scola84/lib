#!/usr/bin/env node

try {
  require('commander')
    .command('dc-reload', 'reloads a Docker Compose service')
    .command('sql-diff', 'dumps the diff of a SQL database and a DDL file')
    .command('sql-schema', 'dumps the schema of a SQL database')
    .command('sql-ts', 'creates TypeScript interfaces from a SQL database')
    .exitOverride()
    .parse()
} catch (error) {
  // discard error
}
