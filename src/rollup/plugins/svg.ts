import type { OptimizeOptions } from 'svgo'
import type { Plugin } from 'rollup'
import { optimize } from 'svgo'
import { readFileSync } from 'fs'

interface Options {
  minify?: boolean
  options?: OptimizeOptions
}

function createExport (id: string, options?: Options): string {
  const content = readFileSync(id).toString()
  const { data } = optimize(content, options?.options)
  return `export default \`${data}\``
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
