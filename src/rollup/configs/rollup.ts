import type { RollupOptions } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import { isExternal } from '../helpers'
import minify from 'rollup-plugin-minify-html-literals'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

export function rollup (): RollupOptions {
  return {
    external: isExternal,
    input: 'src/rollup/index.ts',
    output: {
      dir: '.',
      entryFileNames: 'dist/rollup/index.js',
      exports: 'default',
      format: 'cjs'
    },
    plugins: [
      commonjs(),
      minify(),
      resolve({
        mainFields: ['main', 'module']
      }),
      typescript({
        declaration: true,
        declarationDir: 'types',
        tsconfig: 'src/rollup/tsconfig.json'
      })
    ]
  }
}
