import { isExternal, onwarn } from '../helpers'
import type { RollupOptions } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import minify from 'rollup-plugin-minify-html-literals'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const options: RollupOptions = {
  external: isExternal,
  input: 'src/server/index.ts',
  onwarn,
  output: [{
    dir: '.',
    entryFileNames: 'dist/server/index.js',
    format: 'cjs'
  }, {
    dir: '.',
    entryFileNames: 'dist/server/index.mjs',
    format: 'esm'
  }],
  plugins: [
    commonjs(),
    copy({
      targets: [{
        dest: 'types',
        rename: 'index.d.ts',
        src: 'src/index.ts'
      }]
    }),
    minify(),
    resolve()
  ]
}

export function server (): RollupOptions {
  options.plugins?.push(typescript({
    declaration: true,
    declarationDir: 'types',
    tsconfig: 'src/server/tsconfig.json'
  }))

  return options
}
