import type { Options } from './options'
import { camelize } from './camelize'
import { formatGroup } from './format-group'

export function formatIndex (options: Options): string {
  return `
${formatImport(options.methods)}

export function ${camelize(options.object)} (): void {
  ${formatHandlers(options, 4)}

  ${formatStart(options.methods, 0)}
}
`.trim()
}

function formatHandlers (options: Options, space: number): string {
  const handlers = []

  if (options.methods.includes('DELETE')) {
    handlers.push('const deleteHandler = new DeleteHandler()')
  }

  if (options.methods.includes('GET')) {
    handlers.push('const getAllHandler = new GetAllHandler()')
    handlers.push('const getHandler = new GetHandler()')
  }

  if (options.methods.includes('POST')) {
    handlers.push('const postHandler = new PostHandler()')
  }

  if (options.methods.includes('PUT')) {
    handlers.push('const putHandler = new PutHandler()')
  }

  return handlers
    .map((line) => {
      return line.padStart(line.length + space - 2, ' ')
    })
    .join('\n')
    .trimStart()
}

function formatImport (methods: string): string {
  const imports = []

  if (methods.includes('DELETE')) {
    imports.push('import { DeleteHandler } from \'./delete\'')
  }

  if (methods.includes('GET')) {
    imports.push('import { GetAllHandler } from \'./get-all\'')
    imports.push('import { GetHandler } from \'./get\'')
  }

  if (methods.includes('POST')) {
    imports.push('import { PostHandler } from \'./post\'')
  }

  if (methods.includes('PUT')) {
    imports.push('import { PutHandler } from \'./put\'')
  }

  return imports.join('\n')
}

function formatStart (methods: string, space: number): string {
  const imports = []

  if (methods.includes('DELETE')) {
    imports.push('deleteHandler.start()')
  }

  if (methods.includes('GET')) {
    imports.push('getAllHandler.start()')
    imports.push('getHandler.start()')
  }

  if (methods.includes('POST')) {
    imports.push('postHandler.start()')
  }

  if (methods.includes('PUT')) {
    imports.push('putHandler.start()')
  }

  return formatGroup(imports, space, ['', ''], '').trim()
}
