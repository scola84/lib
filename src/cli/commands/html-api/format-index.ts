import type { Options } from '../html-api'
import { camelize } from '../../../common/helpers/camelize'
import { formatGroup } from './format-group'

export function formatIndex (options: Options): string {
  return `
${formatImport(options.actions)}

export function ${camelize(options.object)} (): void {
  ${formatHandlers(options, 4)}

  ${formatStart(options.actions, 0)}
}
`.trim()
}

function formatHandlers (options: Options, space: number): string {
  const lines = []

  if (options.actions.includes('D')) {
    lines.push('const deleteManyHandler = new DeleteManyHandler()')
    lines.push('const deleteOneHandler = new DeleteOneHandler()')
  }

  if (options.actions.includes('I')) {
    lines.push('const insertManyHandler = new InsertManyHandler()')
    lines.push('const insertOneHandler = new InsertOneHandler()')
  }

  if (options.actions.includes('S')) {
    lines.push('const selectAllHandler = new SelectAllHandler()')
    lines.push('const selectManyHandler = new SelectManyHandler()')
    lines.push('const selectOneHandler = new SelectOneHandler()')
  }

  if (options.actions.includes('U')) {
    lines.push('const updateManyHandler = new UpdateManyHandler()')
    lines.push('const updateOneHandler = new UpdateOneHandler()')
  }

  return lines
    .map((line) => {
      return line.padStart(line.length + space - 2, ' ')
    })
    .join('\n')
    .trimStart()
}

function formatImport (actions: string): string {
  const lines = []

  if (actions.includes('D')) {
    lines.push('import { DeleteManyHandler } from \'./delete-many\'')
    lines.push('import { DeleteOneHandler } from \'./delete-one\'')
  }

  if (actions.includes('I')) {
    lines.push('import { InsertManyHandler } from \'./insert-many\'')
    lines.push('import { InsertOneHandler } from \'./insert-one\'')
  }

  if (actions.includes('S')) {
    lines.push('import { SelectAllHandler } from \'./select-all\'')
    lines.push('import { SelectManyHandler } from \'./select-many\'')
    lines.push('import { SelectOneHandler } from \'./select-one\'')
  }

  if (actions.includes('U')) {
    lines.push('import { UpdateManyHandler } from \'./update-many\'')
    lines.push('import { UpdateOneHandler } from \'./update-one\'')
  }

  return lines.join('\n')
}

function formatStart (actions: string, space: number): string {
  const lines = []

  if (actions.includes('D')) {
    lines.push('deleteManyHandler.start()')
    lines.push('deleteOneHandler.start()')
  }

  if (actions.includes('I')) {
    lines.push('insertManyHandler.start()')
    lines.push('insertOneHandler.start()')
  }

  if (actions.includes('S')) {
    lines.push('selectAllHandler.start()')
    lines.push('selectManyHandler.start()')
    lines.push('selectOneHandler.start()')
  }

  if (actions.includes('U')) {
    lines.push('updateManyHandler.start()')
    lines.push('updateOneHandler.start()')
  }

  return formatGroup(lines, space, ['', ''], '').trim()
}
