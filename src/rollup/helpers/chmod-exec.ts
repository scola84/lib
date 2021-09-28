import type { Plugin } from 'rollup'
import { chmodSync } from 'fs'
import { createFilter } from '@rollup/pluginutils'

interface Options {
  exclude?: string[] | string
  include?: string[] | string
}

export function chmodExec (options: Options = {}): Plugin {
  const directory = process.cwd()
  const filter = createFilter(options.include, options.exclude)

  const plugin: Plugin = {
    name: 'executable',
    writeBundle: (output, bundle) => {
      Object
        .keys(bundle)
        .forEach((file) => {
          const path = `${directory}/${file}`

          if (filter(path)) {
            chmodSync(path, '755')
          }
        })
    }
  }

  return plugin
}
