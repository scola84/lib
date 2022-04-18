import { isExternal, onwarn } from '../helpers'
import type { RollupOptions } from 'rollup'
import { chmod } from '../plugins'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const options: RollupOptions = {
  external: isExternal,
  input: {
    'barrel': 'src/cli/commands/barrel.ts',
    'html-sql': 'src/cli/commands/html-sql.ts',
    'html-ts': 'src/cli/commands/html-ts.ts',
    'index': 'src/cli/index.ts',
    'secret': 'src/cli/commands/secret.ts',
    'sql-diff': 'src/cli/commands/sql-diff.ts',
    'sql-schema': 'src/cli/commands/sql-schema.ts',
    'sql-ts': 'src/cli/commands/sql-ts.ts'
  },
  onwarn: onwarn,
  output: {
    banner: '#!/usr/bin/env node',
    chunkFileNames: 'dist/cli/[name].js',
    dir: '.',
    entryFileNames: 'dist/cli/[name].js',
    format: 'cjs'
  },
  plugins: [
    commonjs(),
    chmod({
      include: 'dist/cli/index.js'
    }),
    resolve()
  ]
}

export function cli (): RollupOptions {
  options.plugins?.push(typescript({
    declaration: true,
    declarationDir: 'types',
    tsconfig: 'src/cli/tsconfig.json'
  }))

  return options
}
