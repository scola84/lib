const ignore = require('rollup-plugin-ignore')
const global = require('rollup-plugin-node-globals')
const plugins = require('./rollup.plugins')

const external = [
  'busboy',
  'fs-extra',
  'messagebird',
  'msgpack-lite',
  'mysql',
  'node-cron',
  'nodemailer',
  'parse5',
  'pg',
  'pg-query-stream',
  'postal-codes-js',
  'shortid',
  'sqlstring'
]

const globals = {
  busboy: 'busboy',
  'fs-extra': 'fsExtra',
  messagebird: 'messagebird',
  'msgpack-lite': 'msgpackLite',
  mysql: 'mysql',
  'node-cron': 'nodeCron',
  nodemailer: 'nodemailer',
  parse5: 'parse5',
  pg: 'pg',
  'pg-query-stream': 'pgQueryStream',
  'postal-codes-js': 'postalCodesJs',
  shortid: 'shortid',
  sqlstring: 'sqlstring'
}

const input = './index.js'

export default [{
  input,
  external: [
    ...external
  ],
  output: {
    file: 'dist/lib.umd.js',
    format: 'umd',
    globals,
    name: 'scola'
  },
  plugins: [
    ...plugins({
      format: 'umd'
    }),
    global()
  ]
}, {
  input,
  external: [
    ...external,
    'http',
    'superagent'
  ],
  output: {
    file: 'dist/lib.cjs.js',
    format: 'cjs',
    globals
  },
  plugins: [
    ignore([
      'fastclick'
    ]),
    ...plugins({
      format: 'cjs'
    })
  ]
}]
