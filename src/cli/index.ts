import commander from 'commander'

try {
  commander.program
    .command('barrel', 'creates a barrel file', {
      executableFile: 'barrel'
    })
    .command('html-sql', 'creates DDL files from HTML files', {
      executableFile: 'html-sql'
    })
    .command('html-ts', 'creates TypeScript CRUD handlers from HTML files', {
      executableFile: 'html-ts'
    })
    .command('password', 'generates a derived password with scrypt', {
      executableFile: 'password'
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
    .exitOverride()
    .parse()
} catch (error: unknown) {
  // discard error
}
