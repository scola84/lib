import { formatGroup } from './format-group'

export function formatName (files: string[][], name: string, defaults = false): string {
  const imports = files
    .map(([file, , value]) => {
      if (defaults) {
        return `import ${value} from './${file}'`
      }

      return `import { ${value} } from './${file}'`
    })
    .join('\n')

  const exports = files
    .map(([file, , value]) => {
      return `'${file}': ${value}`
    })

  return [
    imports,
    `export const ${name} = ${formatGroup(exports, 0)}`
  ].join('\n\n')
}
