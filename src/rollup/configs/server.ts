import type { RollupOptions } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import { isExternal } from '../helpers'
import minify from 'rollup-plugin-minify-html-literals'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

export function server (): RollupOptions {
  return {
    external: isExternal,
    input: 'src/server/index.ts',
    output: {
      dir: '.',
      entryFileNames: 'dist/server/index.js',
      format: 'cjs'
    },
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
      resolve({
        mainFields: ['main', 'module']
      }),
      typescript({
        declaration: true,
        declarationDir: 'types',
        tsconfig: 'src/server/tsconfig.json'
      })
    ]
  }
}
