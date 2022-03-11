import type { Plugin } from 'rollup'
import { existsSync } from 'fs-extra'
import { run } from 'cordova-res'

interface Options {
  dest: string
  src: string
}

export function cordova (options: Options): Plugin {
  return {
    generateBundle: async function generateBundle () {
      const iconFile = `${options.src}/cordova/icon.png`
      const splashFile = `${options.src}/cordova/splash.png`

      if (
        existsSync(iconFile) ||
        existsSync(splashFile)
      ) {
        await run({
          logstream: null,
          platforms: {
            android: {
              icon: {
                sources: [iconFile]
              },
              splash: {
                sources: [splashFile]
              }
            },
            ios: {
              icon: {
                sources: [iconFile]
              },
              splash: {
                sources: [splashFile]
              }
            },
            windows: {
              icon: {
                sources: [iconFile]
              },
              splash: {
                sources: [splashFile]
              }
            }
          },
          resourcesDirectory: `${options.dest}/cordova`
        })
      }
    },
    name: 'cordova'
  }
}
