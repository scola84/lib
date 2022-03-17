import type { Options } from '../html-api'
import { camelize } from '../../../common/helpers/camelize'
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
  const lines = []

  if (options.methods.includes('DELETE')) {
    lines.push('const deleteHandler = new DeleteHandler()')
  }

  if (options.methods.includes('GET')) {
    lines.push('const getAllHandler = new GetAllHandler()')
    lines.push('const getHandler = new GetHandler()')
  }

  if (options.methods.includes('PATCH')) {
    lines.push('const patchHandler = new PatchHandler()')
  }

  if (options.methods.includes('POST')) {
    lines.push('const postHandler = new PostHandler()')
  }

  if (options.methods.includes('PUT')) {
    lines.push('const putHandler = new PutHandler()')
  }

  return lines
    .map((line) => {
      return line.padStart(line.length + space - 2, ' ')
    })
    .join('\n')
    .trimStart()
}

function formatImport (methods: string): string {
  const lines = []

  if (methods.includes('DELETE')) {
    lines.push('import { DeleteHandler } from \'./delete\'')
  }

  if (methods.includes('GET')) {
    lines.push('import { GetAllHandler } from \'./get-all\'')
    lines.push('import { GetHandler } from \'./get\'')
  }

  if (methods.includes('PATCH')) {
    lines.push('import { PatchHandler } from \'./patch\'')
  }

  if (methods.includes('POST')) {
    lines.push('import { PostHandler } from \'./post\'')
  }

  if (methods.includes('PUT')) {
    lines.push('import { PutHandler } from \'./put\'')
  }

  return lines.join('\n')
}

function formatStart (methods: string, space: number): string {
  const lines = []

  if (methods.includes('DELETE')) {
    lines.push('deleteHandler.start()')
  }

  if (methods.includes('GET')) {
    lines.push('getAllHandler.start()')
    lines.push('getHandler.start()')
  }

  if (methods.includes('PATCH')) {
    lines.push('patchHandler.start()')
  }

  if (methods.includes('POST')) {
    lines.push('postHandler.start()')
  }

  if (methods.includes('PUT')) {
    lines.push('putHandler.start()')
  }

  return formatGroup(lines, space, ['', ''], '').trim()
}
