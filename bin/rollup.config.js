import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import gzip from 'rollup-plugin-gzip'
import minify from 'rollup-plugin-minify-html-literals'
import minimist from 'minimist'
import resolve from '@rollup/plugin-node-resolve'
import svg from 'rollup-plugin-svgo'
import terser from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'

const arg = minimist(process.argv.slice(2))
const pkg = require(`${process.cwd()}/package.json`)

module.exports = [{
  input: 'src/client/index.ts',
  output: {
    dir: '.',
    entryFileNames: 'dist/client.js',
    format: 'umd',
    name: pkg.name.replace(/\W+/gu, '')
  },
  plugins: [
    commonjs(),
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
    entryFileNames: 'dist/server.js',
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

if (pkg.name === '@scola/lib') {
  module.exports.push({
    input: 'src/worker/index.ts',
    output: {
      dir: '.',
      entryFileNames: 'dist/worker.js',
      format: 'umd',
      name: pkg.name.replace(/\W+/gu, '')
    },
    plugins: [
      commonjs(),
      minify(),
      resolve({
        mainFields: ['browser', 'main', 'module']
      }),
      typescript({
        declaration: true,
        declarationDir: 'types',
        tsconfig: 'src/worker/tsconfig.json'
      }),
      (!arg.w && !arg.watch) && gzip(),
      (!arg.w && !arg.watch) && terser.terser()
    ]
  })
}
