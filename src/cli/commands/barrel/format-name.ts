import type { Options } from '../barrel'
import { formatGroup } from './format-group'

export function formatName (files: string[][], options: Options): string {
  const imports = files
    .map(([file, , value]) => {
      if (options.defaults) {
        return `import ${value} from './${file}'`
      }

      return `import { ${value} } from './${file}'`
    })
    .join('\n')

  const exports = files
    .map(([, base, value]) => {
      if (
        options.prefix !== '' ||
        !options.shorthand
      ) {
        return `'${options.prefix}${base}': ${value}`
      }

      return value
    })

  return [
    imports,
    `export const ${options.name ?? ''} = ${formatGroup(exports, 0)}`
  ].join('\n\n')
}
