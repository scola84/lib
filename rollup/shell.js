import child from 'child_process'
import cordova from 'cordova-res'
import fs from 'fs'
import path from 'path'
import pwa from 'pwa-asset-generator'

async function createCordovaIdentity () {
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

function createIndex (identity = null) {
  const file = `${inputBase}/index.html`
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

  return index.replace('</head>', `${meta.replace(/\n/gu, '')}</head>`)
}

async function createPwaIdentity () {
  const file = `${options.src}/pwa/index.html`

  let identity = null

  if (fs.existsSync(file)) {
    identity = await pwa.generateImages(file, `${options.dest}/pwa`, {
      favicon: true,
      log: false,
      maskable: false,
      mstile: true,
      pathOverride: `${options.dest.replace(outputBase, '')}/pwa`,
      type: 'png',
      xhtml: true
    })
  }

  return identity
}

function createPwaManifest (identity = {}) {
  const file = `${inputBase}/index.webmanifest`

  let manifest = {}

  if (fs.existsSync(file)) {
    manifest = JSON.parse(fs.readFileSync(file).toString())
  }

  return JSON.stringify({
    display: 'standalone',
    icons: identity.manifestJsonContent,
    name: options.title,
    short_name: options.title,
    start_url: '/',
    ...manifest
  })
}

function determineOrigin (origin) {
  switch (origin) {
    case 'true':
      return child
        .execSync('ip route get 255.255.255.255')
        .toString()
        .match(/src (?<ip>[^\s]+)/u).groups.ip
    case undefined:
      return 'localhost'
    default:
      return origin
  }
}

let inputBase = ''
let options = {}
let outputBase = ''

const plugin = {
  generateBundle: async function generateBundle () {
    let pwaIdentity = null

    if (options.watch !== true) {
      pwaIdentity = await createPwaIdentity()

      if (pwaIdentity !== null) {
        this.emitFile({
          fileName: `${outputBase}/index.webmanifest`,
          source: createPwaManifest(pwaIdentity),
          type: 'asset'
        })
      }

      await createCordovaIdentity()
    }

    this.emitFile({
      fileName: `${outputBase}/index.html`,
      source: createIndex(pwaIdentity),
      type: 'asset'
    })
  },
  name: 'shell',
  renderStart: (output, input) => {
    outputBase = path.dirname(output.entryFileNames)
    inputBase = path.dirname(input.input.shift())
  }
}

export default (pluginOptions = {}) => {
  options = pluginOptions
  return plugin
}
