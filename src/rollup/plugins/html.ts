import type { Options as MinifierOptions } from 'html-minifier-terser'
import type { Plugin } from 'rollup'
import { minify } from 'html-minifier-terser'
import { readFileSync } from 'fs-extra'

interface Options {
  minify?: boolean
  options?: MinifierOptions
}

async function createExport (id: string, options?: Options): Promise<string> {
  let content = readFileSync(id).toString()

  if (options?.minify === true) {
    content = await minify(content, {
      collapseWhitespace: true,
      conservativeCollapse: true,
      removeComments: true,
      ...options.options
    })
  }

  return `export default \`${content}\``
}

export function html (options?: Options): Plugin {
  return {
    load: async function load (id: string) {
      if (id.endsWith('.html')) {
        return createExport(id, options)
      }

      return null
    },
    name: 'html'
  }
}
