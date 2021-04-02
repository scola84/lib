import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import gzip from 'rollup-plugin-gzip'
import livereload from 'rollup-plugin-livereload'
import minify from 'rollup-plugin-minify-html-literals'
import pkg from './package.json'
import resolve from '@rollup/plugin-node-resolve'
import svg from 'rollup-plugin-svgo'
import terser from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'

export default [{
  input: 'src/client/index.ts',
  output: {
    dir: '.',
    entryFileNames: 'dist/client/umd.js',
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
    process.argv.includes('-w') ? {} : gzip(),
    process.argv.includes('-w') ? {} : terser.terser(),
    process.argv.includes('-l') ? livereload('dist/client/umd.js') : {}
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
    entryFileNames: 'dist/server/cjs.js',
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
