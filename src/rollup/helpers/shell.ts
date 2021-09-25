import type { Plugin } from 'rollup'
import type { Result } from 'pwa-asset-generator/dist/models/result'
import child from 'child_process'
import cordova from 'cordova-res'
import fs from 'fs'
import path from 'path'
import pwa from 'pwa-asset-generator'

interface Base {
  output: string
  input: string
}

interface Options {
  dest: string
  origin?: string
  src: string
  title: string
  watch?: boolean
}

async function createCordovaIdentity (options: Options): Promise<void> {
  const iconFile = `${options.src}/cordova/icon.png`
  const splashFile = `${options.src}/cordova/splash.png`

  if (
    fs.existsSync(iconFile) ||
    fs.existsSync(splashFile)
  ) {
    await cordova.run({
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
}

function createIndex (options: Options, base: Base, identity: Result | null = null): string {
  const file = `${base.input}/index.html`
  const origin = determineOrigin(options.origin)

  const meta = [
    `<meta http-equiv="Content-Security-Policy" content="default-src ${origin} 'self'; img-src ${origin} blob: 'self'; media-src ${origin} blob: 'self'; object-src 'none'; style-src 'unsafe-inline'; worker-src blob:;" />`,
    identity?.htmlMeta.appleTouchIcon ?? '',
    identity?.htmlMeta.appleLaunchImage ?? '',
    identity?.htmlMeta.favicon ?? '',
    identity?.htmlMeta.msTileImage ?? ''
  ].join('')

  let index = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<link href="/index.webmanifest" rel="manifest" />',
    '<meta charset="utf-8" />',
    '<meta name="mobile-web-app-capable" content="yes" />',
    '<meta name="referrer" content="no-referrer">',
    '<meta name="viewport" content="width=device-width" />',
    `<title>${options.title}</title>`,
    '</head>',
    '<body>',
    '<script src="/index.js"></script>',
    '</body>',
    '</html>'
  ].join('')

  if (fs.existsSync(file)) {
    index = fs.readFileSync(file).toString()
  }

  return index
    .replace('</head>', `${meta}</head>`)
    .replace(/\r?\n/gu, '')
}

async function createPwaIdentity (options: Options, base: Base): Promise<Result | null> {
  const file = `${options.src}/pwa/index.html`

  let identity = null

  if (fs.existsSync(file)) {
    identity = await pwa.generateImages(file, `${options.dest}/pwa`, {
      favicon: true,
      log: false,
      maskable: false,
      mstile: true,
      pathOverride: `${options.dest.replace(base.output, '')}/pwa`,
      type: 'png',
      xhtml: true
    })
  }

  return identity
}

function createPwaManifest (options: Options, base: Base, identity?: Result): string {
  const file = `${base.input}/index.webmanifest`

  let manifest = {}

  if (fs.existsSync(file)) {
    manifest = JSON.parse(fs.readFileSync(file).toString()) as Record<string, unknown>
  }

  return JSON.stringify({
    display: 'standalone',
    icons: identity?.manifestJsonContent,
    name: options.title,
    short_name: options.title,
    start_url: '/',
    ...manifest
  })
}

function determineOrigin (origin?: string): string {
  switch (origin) {
    case 'true':
      return ((/src (?<ip>[^\s]+)/u).exec(child
        .execSync('ip route get 255.255.255.255')
        .toString()))?.groups?.ip ?? 'localhost'
    case undefined:
      return 'localhost'
    default:
      return origin
  }
}

export function shell (options: Options): Plugin {
  const base: Base = {
    input: '',
    output: ''
  }

  return {
    generateBundle: async function generateBundle () {
      let pwaIdentity = null

      if (options.watch !== true) {
        pwaIdentity = await createPwaIdentity(options, base)

        if (pwaIdentity !== null) {
          this.emitFile({
            fileName: `${base.output}/index.webmanifest`,
            source: createPwaManifest(options, base, pwaIdentity),
            type: 'asset'
          })
        }

        await createCordovaIdentity(options)
      }

      this.emitFile({
        fileName: `${base.output}/index.html`,
        source: createIndex(options, base, pwaIdentity),
        type: 'asset'
      })
    },
    name: 'shell',
    renderStart: (output, input) => {
      if (typeof output.entryFileNames === 'string') {
        base.output = path.dirname(output.entryFileNames)
      }

      if (Array.isArray(input.input)) {
        base.input = path.dirname(input.input.shift() ?? '')
      }
    }
  }
}
