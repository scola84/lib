import type { OptimizeOptions } from 'svgo'
import type { Plugin } from 'rollup'
import { optimize } from 'svgo'
import { readFileSync } from 'fs'

interface Options {
  minify?: boolean
  options?: OptimizeOptions
}

function createExport (id: string, options?: Options): string {
  let content = readFileSync(id).toString()

  if (options?.minify === true) {
    content = optimize(content, options.options).data
  }

  return `export default \`${content}\``
}

export function svg (options?: Options): Plugin {
  return {
    load: function load (id: string) {
      if (id.endsWith('.svg')) {
        return createExport(id, options)
      }

      return null
    },
    name: 'svg'
  }
}
