import commander from 'commander'

try {
  commander.program
    .command('html-ts', 'creates TypeScript route handlers from an HTML file', {
      executableFile: 'html-ts'
    })
    .command('sql-diff', 'dumps the diff of a SQL database and a DDL file', {
      executableFile: 'sql-diff'
    })
    .command('sql-schema', 'dumps the schema of a SQL database', {
      executableFile: 'sql-schema'
    })
    .command('sql-ts', 'creates TypeScript interfaces from a SQL database', {
      executableFile: 'sql-ts'
    })
    .command('ts-barrel', 'creates a TypeScript barrel', {
      executableFile: 'ts-barrel'
    })
    .exitOverride()
    .parse()
} catch (error: unknown) {
  // discard error
}
