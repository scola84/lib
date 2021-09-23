import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import gzip from 'rollup-plugin-gzip'
import html from '@rollup/plugin-html'
import minify from 'rollup-plugin-minify-html-literals'
import minimist from 'minimist'
import os from 'os'
import resolve from '@rollup/plugin-node-resolve'
import svg from 'rollup-plugin-svgo'
import terser from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'

const arg = minimist(process.argv.slice(2))
const pkg = require(`${process.cwd()}/package.json`)

function createTemplate () {
  let origin = 'https://localhost'

  if (process.env.ORIGIN === 'true') {
    origin = `https://${Object
    .entries(os.networkInterfaces())
    .filter(([name]) => {
      return name.match(/^en|wl/u) !== null
    })
    .map(([, interfaces]) => {
      return interfaces
        .filter((info) => {
          return (
            info.family === 'IPv4' &&
            info.internal === false
          )
        })
        .pop()
    })
    .shift()
    .address}`
  } else if (typeof process.env.ORIGIN === 'string') {
    origin = `https://${process.env.ORIGIN}`
  }

  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8" />',
    `<meta http-equiv="Content-Security-Policy" content="default-src ${origin} 'self'; img-src ${origin} blob: 'self'; media-src ${origin} blob: 'self'; object-src 'none'; style-src 'unsafe-inline'; worker-src blob:;" />`,
    '<meta name="mobile-web-app-capable" content="yes" />',
    '<meta name="referrer" content="no-referrer">',
    '<meta name="viewport" content="width=device-width" />',
    `<title>${pkg.description}</title>`,
    '</head>',
    '<body>',
    '<script src="/index.js"></script>',
    '</body>',
    '</html>'
  ].join('')
}

module.exports = [{
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
        dest: 'dist/client',
        src: 'src/client/media'
      }]
    }),
    html({
      fileName: 'dist/client/index.html',
      template: createTemplate
    }),
    minify(),
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
    (!arg.w && !arg.watch) && terser.terser()
  ]
}, {
  external: (id) => {
    return Object
      .keys(pkg.dependencies)
      .some((dependency) => {
        return id.startsWith(dependency)
      })
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
}]
