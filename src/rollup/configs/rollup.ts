import { isExternal, onwarn } from '../helpers'
import type { RollupOptions } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import minify from 'rollup-plugin-minify-html-literals'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const options: RollupOptions = {
  external: isExternal,
  input: 'src/rollup/index.ts',
  onwarn: onwarn,
  output: {
    dir: '.',
    entryFileNames: 'dist/rollup/index.js',
    exports: 'default',
    format: 'cjs'
  },
  plugins: [
    commonjs(),
    minify(),
    resolve()
  ]
}

export function rollup (): RollupOptions {
  options.plugins?.push(typescript({
    declaration: true,
    declarationDir: 'types',
    tsconfig: 'src/rollup/tsconfig.json'
  }))

  return options
}
