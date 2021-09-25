import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import fs from 'fs'
import gzip from 'rollup-plugin-gzip'
import isBuiltinModule from 'is-builtin-module'
import minify from 'rollup-plugin-minify-html-literals'
import minimist from 'minimist'
import resolve from '@rollup/plugin-node-resolve'
import shell from './shell'
import svg from 'rollup-plugin-svgo'
import terser from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'
import workbox from 'rollup-plugin-workbox'

const arg = minimist(process.argv.slice(2))
const pkg = require(`${process.cwd()}/package.json`)

module.exports = []

if (fs.existsSync('src/cli/cli.ts')) {
  module.exports.push({
    external: (id) => {
      return (
        isBuiltinModule(id) ||
        Object
          .keys(pkg.dependencies)
          .some((dependency) => {
            return id.startsWith(dependency)
          })
      )
    },
    input: {
      'cli': 'src/cli/cli.ts',
      'reload': 'src/cli/reload.ts',
      'sql-diff': 'src/cli/sql-diff.ts',
      'sql-schema': 'src/cli/sql-schema.ts',
      'sql-ts': 'src/cli/sql-ts.ts'
    },
    output: {
      banner: '#!/usr/bin/env node',
      dir: '.',
      entryFileNames: 'dist/cli/scola-[name].js',
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
        tsconfig: 'src/cli/tsconfig.json'
      })
    ]
  })
}

if (fs.existsSync('src/client/index.ts')) {
  module.exports.push({
    input: 'src/client/index.ts',
    output: {
      dir: '.',
      entryFileNames: 'dist/client/index.js',
      format: 'umd',
      name: pkg.name.replace(/\W+/gu, '')
    },
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
        }]
      }),
      shell({
        dest: 'dist/client/media',
        origin: process.env.ORIGIN,
        src: 'src/client/media',
        title: pkg.description,
        watch: Boolean(arg.w || arg.watch)
      }),
      resolve({
        mainFields: ['browser', 'main', 'module']
      }),
      svg({
        plugins: [{
          removeDimensions: false,
          removeViewBox: false
        }]
      }),
      typescript({
        declaration: true,
        declarationDir: 'types',
        tsconfig: 'src/client/tsconfig.json'
      }),
      (!arg.w && !arg.watch) && gzip(),
      (!arg.w && !arg.watch) && minify(),
      (!arg.w && !arg.watch) && terser.terser()
    ]
  })
}

if (fs.existsSync('src/server/index.ts')) {
  module.exports.push({
    external: (id) => {
      return (
        isBuiltinModule(id) ||
        Object
          .keys(pkg.dependencies)
          .some((dependency) => {
            return id.startsWith(dependency)
          })
      )
    },
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
  })
}

if (fs.existsSync('src/worker/index.ts')) {
  module.exports.push({
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
      workbox.injectManifest({
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
      }, () => {}),
      (!arg.w && !arg.watch) && gzip(),
      (!arg.w && !arg.watch) && terser.terser()
    ]
  })
}
