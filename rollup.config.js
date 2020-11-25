import commonjs from '@rollup/plugin-commonjs'
import gzip from 'rollup-plugin-gzip'
import livereload from 'rollup-plugin-livereload'
import minify from 'rollup-plugin-minify-html-literals'
import resolve from '@rollup/plugin-node-resolve'
import svg from 'rollup-plugin-svgo'
import terser from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default [{
  input: './src/client/index.ts',
  output: {
    file: 'dist/client/umd.js',
    format: 'umd',
    name: pkg.name.replace(/\W+/g, '')
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
    typescript(),
    process.argv.includes('-w') ? {} : gzip(),
    process.argv.includes('-w') ? {} : terser.terser(),
    !process.argv.includes('-l') ? {} : livereload('./dist/client/umd.js')
  ]
}, {
  external: (id) => {
    return Object
      .keys(pkg.dependencies)
      .some((dependency) => {
        return id.includes(dependency)
      })
  },
  input: './src/server/index.ts',
  output: [{
    dir: './',
    entryFileNames: 'dist/server/cjs.js',
    format: 'cjs'
  }],
  plugins: [
    commonjs(),
    minify(),
    resolve({
      mainFields: ['main', 'module']
    }),
    typescript({
      declaration: true,
      declarationDir: './types'
    })
  ]
}]
