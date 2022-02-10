import type { Plugin } from 'rollup'
import type { Result } from 'pwa-asset-generator/dist/models/result'
import child from 'child_process'
import fs from 'fs'
import { generateImages } from 'pwa-asset-generator'
import path from 'path'

interface Base {
  output: string
  input: string
}

interface Options {
  dest: string
  origin?: string
  reload?: boolean
  reloadPath?: string
  src: string
  title: string
  identity?: boolean
}

async function createIdentity (options: Options, base: Base): Promise<Result | null> {
  const file = `${options.src}/pwa/index.html`

  let identity = null

  if (fs.existsSync(file)) {
    identity = await generateImages(file, `${options.dest}/pwa`, {
      favicon: true,
      log: false,
      mstile: true,
      pathOverride: `${options.dest.replace(base.output, '')}/pwa`,
      type: 'png',
      xhtml: true
    })
  }

  return identity
}

function createIndex (options: Options, base: Base, identity: Result | null = null): string {
  const index = createIndexBase(options, base)
  const origin = `https://${determineOrigin(options.origin)}`
  const body = []

  const meta = [
    identity?.htmlMeta.appleTouchIcon ?? '',
    identity?.htmlMeta.appleLaunchImage ?? '',
    identity?.htmlMeta.favicon ?? '',
    identity?.htmlMeta.msTileImage ?? ''
  ]

  if (!index.includes('Content-Security-Policy')) {
    meta.push(`<meta http-equiv="Content-Security-Policy" content="default-src blob: ${origin} 'self'; object-src 'none'; script-src blob: ${origin} 'self' 'sha256-knuyr2eqjHBvba/qle9YR7ncttVURQSJunivr07BV/Q=' 'unsafe-inline'; style-src blob: ${origin} 'self' 'unsafe-inline';" />`)
  }

  if (options.reload === true) {
    body.push(`<object is="sc-event-source" sc-event="reload" sc-onmessage="sc-reload@[is='sc-reloader']" sc-path="${options.reloadPath ?? '/api/reload'}"><object is="sc-reloader"></object></object>`)
  }

  return index
    .replace('</head>', `${meta.join('')}</head>`)
    .replace('</body>', `${body.join('')}</body>`)
}

function createIndexBase (options: Options, base: Base): string {
  const file = `${base.input}/index.html`

  let index = ''

  if (fs.existsSync(file)) {
    index = fs.readFileSync(file).toString()
  } else {
    index = [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<link href="/app.webmanifest" rel="manifest" />',
      '<link href="/index.css" rel="stylesheet" />',
      '<meta charset="utf-8" />',
      '<meta name="mobile-web-app-capable" content="yes" />',
      '<meta name="referrer" content="no-referrer">',
      '<meta name="viewport" content="width=device-width" />',
      `<title>${options.title}</title>`,
      '</head>',
      '<body>',
      '<script type="text/javascript">',
      'document.body.classList.add(localStorage.getItem("sc-theme") ?? "sc-light");',
      '</script>',
      '<script src="/index.js"></script>',
      '</body>',
      '</html>'
    ].join('')
  }

  return index
}

function createManifest (options: Options, base: Base, identity?: Result): string {
  const file = `${base.input}/app.webmanifest`

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

export function pwa (options: Options): Plugin {
  const base: Base = {
    input: '',
    output: ''
  }

  return {
    generateBundle: async function generateBundle () {
      let identity = null

      if (options.identity === true) {
        identity = await createIdentity(options, base)

        if (identity !== null) {
          this.emitFile({
            fileName: `${base.output}/app.webmanifest`,
            source: createManifest(options, base, identity),
            type: 'asset'
          })
        }
      }

      this.emitFile({
        fileName: `${base.output}/index.html`,
        source: createIndex(options, base, identity),
        type: 'asset'
      })
    },
    name: 'pwa',
    renderStart: (output, input) => {
      if (typeof output.entryFileNames === 'string') {
        base.output = path.dirname(output.entryFileNames)
      }

      if (Array.isArray(input.input)) {
        base.input = path.dirname(input.input[0] ?? '')
      }
    }
  }
}
