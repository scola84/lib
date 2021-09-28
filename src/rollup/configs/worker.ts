import type { Plugin, RollupOptions } from 'rollup'
// import { CacheableResponsePlugin } from 'workbox-cacheable-response'
// import { ExpirationPlugin } from 'workbox-expiration'
// import { RangeRequestsPlugin } from 'workbox-range-requests'
import commonjs from '@rollup/plugin-commonjs'
import { generateSW } from 'rollup-plugin-workbox'
import gzip from 'rollup-plugin-gzip'
import minify from 'rollup-plugin-minify-html-literals'
import { parseArgs } from '../helpers'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'

const args = parseArgs()

function workbox (): Plugin {
  return generateSW({
    globDirectory: 'dist/client',
    globIgnores: [
      'media/cordova/**/*'
    ],
    globPatterns: [
      '*.{css,js,html}',
      'media/**/*.{gif,png,jpg,ogg,svg,weba,webm,webp}'
    ],
    importScripts: [
      'worker.js'
    ],
    inlineWorkboxRuntime: true,
    runtimeCaching: [{
      handler: 'StaleWhileRevalidate',
      options: {
        plugins: [
          // Waiting for https://github.com/GoogleChrome/workbox/issues/2897
          // new CacheableResponsePlugin({
          //   statuses: [0, 200]
          // }),
          // new ExpirationPlugin({
          //   maxAgeSeconds: 30 * 24 * 60 * 60
          // }),
          // new RangeRequestsPlugin()
        ]
      },
      urlPattern: /\.(?:gif|png|jpg|ogg|svg|weba|webm|webp)$/u
    }],
    sourcemap: false,
    swDest: './dist/client/service-worker.js'
  }, () => {})
}

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
      resolve(),
      typescript({
        declaration: true,
        declarationDir: 'types',
        tsconfig: 'src/worker/tsconfig.json'
      }),
      workbox(),
      args.watch !== true && gzip(),
      args.watch !== true && terser()
    ]
  }
}
