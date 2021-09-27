import { executable, isExternal } from '../helpers'
import type { RollupOptions } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import minify from 'rollup-plugin-minify-html-literals'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

export function cli (): RollupOptions {
  return {
    external: isExternal,
    input: {
      'index': 'src/cli/index.ts',
      'reload': 'src/cli/commands/reload.ts',
      'sql-diff': 'src/cli/commands/sql-diff.ts',
      'sql-schema': 'src/cli/commands/sql-schema.ts',
      'sql-ts': 'src/cli/commands/sql-ts.ts'
    },
    output: {
      banner: '#!/usr/bin/env node',
      dir: '.',
      entryFileNames: 'dist/cli/[name].js',
      format: 'cjs'
    },
    plugins: [
      commonjs(),
      executable({
        include: 'dist/cli/index.js'
      }),
      minify(),
      resolve({
        mainFields: ['main', 'module']
      }),
      typescript({
        declaration: true,
        declarationDir: 'types',
        tsconfig: 'src/cli/tsconfig.json'
      })
    ]
  }
}
