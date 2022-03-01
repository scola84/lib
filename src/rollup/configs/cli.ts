import type { RollupOptions } from 'rollup'
import { chmod } from '../plugins'
import commonjs from '@rollup/plugin-commonjs'
import { isExternal } from '../helpers'
import minify from 'rollup-plugin-minify-html-literals'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const options: RollupOptions = {
  external: isExternal,
  input: {
    'index': 'src/cli/index.ts',
    'sql-diff': 'src/cli/commands/sql-diff.ts',
    'sql-schema': 'src/cli/commands/sql-schema.ts',
    'sql-ts': 'src/cli/commands/sql-ts.ts',
    'ts-barrel': 'src/cli/commands/ts-barrel.ts'
  },
  output: {
    banner: '#!/usr/bin/env node',
    dir: '.',
    entryFileNames: 'dist/cli/[name].js',
    format: 'cjs'
  },
  plugins: [
    commonjs(),
    chmod({
      include: 'dist/cli/index.js'
    }),
    minify(),
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
