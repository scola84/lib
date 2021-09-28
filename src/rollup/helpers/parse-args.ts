import type { ParsedArgs } from 'minimist'
import minimist from 'minimist'

interface Args extends ParsedArgs {
  watch?: boolean
}

export function parseArgs (): Args {
  return minimist(process.argv.slice(2), {
    alias: {
      watch: ['w']
    }
  })
}
