const alias = require('@rollup/plugin-alias')
const babel = require('rollup-plugin-babel')
const commonjs = require('@rollup/plugin-commonjs')
const copy = require('rollup-plugin-copy')
const css = require('rollup-plugin-postcss')
const fs = require('fs')
const gzip = require('rollup-plugin-gzip')
const json = require('@rollup/plugin-json')
const livereload = require('rollup-plugin-livereload')
const minimist = require('minimist')
const multi = require('@rollup/plugin-multi-entry')
const resolve = require('@rollup/plugin-node-resolve')
const uglify = require('rollup-plugin-uglify')

const pkg = JSON.parse(fs.readFileSync('./package.json'))
const { l: live, w: watch } = minimist(process.argv)

const external = [
  '@scola/lib',
  'busboy',
  'crypto',
  'csv',
  'fs-extra',
  'http',
  'ioredis',
  'jsdom',
  'libphonenumber-js',
  'memcached',
  'messagebird',
  'msgpack-lite',
  'mysql',
  'node-cron',
  'nodemailer',
  'parse5',
  'postal-codes-js',
  'pg',
  'pg-connection-string',
  'pg-escape',
  'pg-query-stream',
  'sqlstring',
  'twilio',
  'url',
  'util'
]

external.globals = {
  '@scola/lib': 'scola'
}

module.exports = {
  input: 'src/**/*gui.js',
  output: {
    globals: v => {
      return external.globals[v] || v.replace(/\W/g, '')
    },
    file: 'dist/js/gui.js',
    format: 'umd',
    name: 'scola',
    strict: false
  },
  external,
  plugins: [
    alias({
      entries: [{
        find: 'stream',
        replacement: 'readable-stream'
      }]
    }),
    commonjs(),
    css({
      extract: './dist/css/gui.css',
      minimize: watch === undefined
    }),
    copy({
      targets: [{
        src: './node_modules/ionicons/dist/fonts/*',
        dest: './dist/fonts/'
      }]
    }),
    json(),
    multi(),
    resolve({
      preferBuiltins: false,
      mainFields: ['browser', 'module', 'main']
    }),
    watch === undefined ? babel(pkg.babel) : {},
    watch === undefined ? uglify.uglify() : {},
    watch === undefined ? gzip.default(pkg.gzip) : {},
    live === undefined ? {} : livereload('dist')
  ]
}
