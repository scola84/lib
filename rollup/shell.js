import child from 'child_process'
import cordova from 'cordova-res'
import fs from 'fs'
import path from 'path'
import pwa from 'pwa-asset-generator'

async function createCordovaIdentity () {
  try {
    fs.closeSync(fs.openSync(`${options.src}/cordova/icon.png`))

    await cordova.run({
      logstream: null,
      platforms: {
        android: {
          icon: {
            sources: [`${options.src}/cordova/icon.png`]
          },
          splash: {
            sources: [`${options.src}/cordova/splash.png`]
          }
        },
        ios: {
          icon: {
            sources: [`${options.src}/cordova/icon.png`]
          },
          splash: {
            sources: [`${options.src}/cordova/splash.png`]
          }
        },
        windows: {
          icon: {
            sources: [`${options.src}/cordova/icon.png`]
          },
          splash: {
            sources: [`${options.src}/cordova/splash.png`]
          }
        }
      },
      resourcesDirectory: `${options.dest}/cordova`
    })
  } catch (error) {
    // file does not exist, skip creation
  }
}

function createIndex (identity = null) {
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

  try {
    index = fs.readFileSync(`${inputBase}/index.html`).toString()
  } catch (error) {
    // file does not exist, use default content
  }

  return index.replace('</head>', `${meta.replace(/\n/gu, '')}</head>`)
}

async function createPwaIdentity () {
  let identity = null

  try {
    const src = `${options.src}/pwa/index.html`

    fs.closeSync(fs.openSync(src))

    identity = await pwa.generateImages(src, `${options.dest}/pwa`, {
      favicon: true,
      log: false,
      maskable: false,
      mstile: true,
      pathOverride: `${options.dest.replace(outputBase, '')}/pwa`,
      type: 'png',
      xhtml: true
    })
  } catch (error) {
    // file does not exist, skip creation
  }

  return identity
}

function createPwaManifest (identity = {}) {
  let manifest = {}

  try {
    manifest = JSON.parse(fs.readFileSync(`${inputBase}/index.webmanifest`).toString())
  } catch (error) {
    // file does not exist, use default content
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
