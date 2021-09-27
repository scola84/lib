import type { Plugin, RollupOptions } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import gzip from 'rollup-plugin-gzip'
import { injectManifest } from 'rollup-plugin-workbox'
import minify from 'rollup-plugin-minify-html-literals'
import minimist from 'minimist'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'

const arg = minimist(process.argv.slice(2))

export function worker (): RollupOptions {
  return {
    input: 'src/worker/index.ts',
    output: {
      dir: '.',
      entryFileNames: 'dist/client/worker.js',
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
        tsconfig: 'src/worker/tsconfig.json'
      }),
      injectManifest({
        globDirectory: 'dist/client',
        globIgnores: [
          'media/cordova/**/*'
        ],
        globPatterns: [
          '*.{css,js,html}',
          'media/**/*.{gif,png,jpg,svg,webp}'
        ],
        swDest: './dist/client/worker.js',
        swSrc: './dist/client/worker.js'
      }, () => {}) as Plugin,
      !(arg.w === true || arg.watch === true) && gzip(),
      !(arg.w === true || arg.watch === true) && terser()
    ]
  }
}
