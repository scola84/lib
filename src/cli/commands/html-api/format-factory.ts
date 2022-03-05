import type { Options } from './options'
import { formatCode } from './format-code'
import { formatGroup } from './format-group'

export function formatFactory (options: Options): string {
  return `
${formatImport(options.methods)}

export function ${formatFunction(options.object)} (): void {
  ${formatHandlers(options, 4)}

  ${formatStart(options.methods, 0)}
}
`.trim()
}

function formatFunction (object: string): string {
  return object
    .split('_')
    .map((string, index) => {
      if (index === 0) {
        return string
      }

      return string[0].toUpperCase() + string.slice(1)
    })
    .join('')
}

function formatHandlers (options: Options, space: number): string {
  const handlers = []

  if (options.methods.includes('DELETE')) {
    handlers.push(`const deleteHandler = new DeleteHandler(${formatCode({
      method: 'DELETE',
      url: options.url
    }, space).trim()})`)
  }

  if (options.methods.includes('GET')) {
    handlers.push(`const getAllHandler = new GetAllHandler(${formatCode({
      method: 'GET',
      url: `${options.url}/all`
    }, space).trim()})`)

    handlers.push(`const getHandler = new GetHandler(${formatCode({
      method: 'GET',
      url: options.url
    }, space).trim()})`)
  }

  if (options.methods.includes('POST')) {
    handlers.push(`const postHandler = new PostHandler(${formatCode({
      method: 'POST',
      url: options.url
    }, space).trim()})`)
  }

  if (options.methods.includes('PUT')) {
    handlers.push(`const putHandler = new PutHandler(${formatCode({
      method: 'PUT',
      url: options.url
    }, space).trim()})`)
  }

  return handlers
    .map((line) => {
      return line.padStart(line.length + space - 2, ' ')
    })
    .join('\n\n')
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
