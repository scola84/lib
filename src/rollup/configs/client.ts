import { appShell, loadSvg, parseArgs } from '../helpers'
import type { RollupOptions } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import gzip from 'rollup-plugin-gzip'
import minify from 'rollup-plugin-minify-html-literals'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'

const args = parseArgs()
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pkg = require(`${process.cwd()}/package.json`) as Record<string, unknown>

export function client (): RollupOptions {
  return {
    input: 'src/client/index.ts',
    output: {
      dir: '.',
      entryFileNames: 'dist/client/index.js',
      format: 'umd',
      name: String(pkg.name).replace(/\W+/gu, '')
    },
    plugins: [
      appShell({
        dest: 'dist/client/media',
        origin: process.env.ORIGIN,
        src: 'src/client/media',
        title: String(pkg.description),
        watch: args.watch
      }),
      commonjs(),
      copy({
        copyOnce: true,
        targets: [{
          dest: 'dist/client/media',
          rename: (name, extension, path) => {
            return path.replace('src/client/media', '')
          },
          src: 'src/client/media/!({cordova,pwa})/*'
        }]
      }),
      loadSvg(),
      resolve({
        mainFields: [
          'browser',
          'main',
          'module'
        ]
      }),
      typescript({
        declaration: true,
        declarationDir: 'types',
        tsconfig: 'src/client/tsconfig.json'
      }),
      args.watch !== true && gzip(),
      args.watch !== true && minify(),
      args.watch !== true && terser()
    ]
  }
}
