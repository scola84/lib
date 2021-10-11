import type { Plugin } from 'rollup'
import { readFileSync } from 'fs'

export function loadSvg (): Plugin {
  return {
    load: function load (id: string) {
      if (!id.endsWith('.svg')) {
        return null
      }

      const content = readFileSync(id)
        .toString()
        .replace(/\r?\n/gu, '')

      return `export default '${content}'`
    },
    name: 'load-svg'
  }
}
