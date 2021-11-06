import { cordova, html, pwa, svg } from '../plugins'
import type { RollupOptions } from 'rollup'
import autoprefixer from 'autoprefixer'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import gzip from 'rollup-plugin-gzip'
import minify from 'rollup-plugin-minify-html-literals'
import postcss from 'rollup-plugin-postcss'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pkg = require(`${process.cwd()}/package.json`) as Record<string, unknown>

const options: RollupOptions = {
  input: 'src/client/index.ts',
  output: [{
    dir: '.',
    entryFileNames: 'dist/client/index.mjs',
    format: 'esm',
    name: String(pkg.name).replace(/\W+/gu, '')
  }, {
    dir: '.',
    entryFileNames: 'dist/client/index.js',
    format: 'umd',
    name: String(pkg.name).replace(/\W+/gu, '')
  }],
  plugins: [
    commonjs(),
    copy({
      copyOnce: true,
      targets: [{
        dest: 'dist/client/media',
        rename: (name, extension, path) => {
          return path.replace('src/client/media', '')
        },
        src: 'src/client/media/!({cordova,pwa})/*'
      }, {
        dest: 'dist/client',
        src: 'src/client/*/*.scss'
      }]
    }),
    html({
      minify: process.env.ROLLUP_WATCH !== 'true'
    }),
    postcss({
      extract: 'dist/client/index.css',
      minimize: process.env.ROLLUP_WATCH !== 'true',
      plugins: [
        autoprefixer()
      ]
    }),
    pwa({
      dest: 'dist/client/media',
      identity: process.env.ROLLUP_WATCH !== 'true',
      origin: process.env.ORIGIN,
      reload: process.env.ROLLUP_WATCH === 'true',
      src: 'src/client/media',
      title: String(pkg.description)
    }),
    resolve({
      mainFields: [
        'browser',
        'main',
        'module'
      ]
    }),
    svg({
      minify: process.env.ROLLUP_WATCH !== 'true'
    }),
    process.env.ROLLUP_WATCH !== 'true' && cordova({
      dest: 'dist/client/media',
      src: 'src/client/media'
    }),
    process.env.ROLLUP_WATCH !== 'true' && gzip(),
    process.env.ROLLUP_WATCH !== 'true' && minify(),
    process.env.ROLLUP_WATCH !== 'true' && terser()
  ]
}

export function client (): RollupOptions {
  options.plugins?.push(typescript({
    declaration: true,
    declarationDir: 'types',
    tsconfig: 'src/client/tsconfig.json'
  }))

  return options
}
