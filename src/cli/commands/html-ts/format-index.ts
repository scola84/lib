import type { WriteOptions } from '../html-ts'
import { formatGroup } from './format-group'
import { isMatch } from 'micromatch'
import { toCaps } from '../../../common'

export function formatIndex (options: WriteOptions): string {
  return `
${formatImport(options)}

export function ${formatFunctionName(options)} (): void {
  ${formatHandlers(options, 4)}

  ${formatStart(options, 0)}
}
`.trim()
}

function formatFunctionName (options: WriteOptions): string {
  return toCaps(options.object, {
    chars: /[^a-z0-9]+/iu,
    lcfirst: true
  })
}

function formatHandlers (options: WriteOptions, space: number): string {
  return Object
    .entries({
      'da': 'const deleteAllHandler = new DeleteAllHandler()',
      'dm': 'const deleteManyHandler = new DeleteManyHandler()',
      'do': 'const deleteOneHandler = new DeleteOneHandler()',
      'im': 'const insertManyHandler = new InsertManyHandler()',
      'io': 'const insertOneHandler = new InsertOneHandler()',
      'sa': 'const selectAllHandler = new SelectAllHandler()',
      'sm': 'const selectManyHandler = new SelectManyHandler()',
      'so': 'const selectOneHandler = new SelectOneHandler()',
      'um': 'const updateManyHandler = new UpdateManyHandler()',
      'uo': 'const updateOneHandler = new UpdateOneHandler()'
    })
    .filter(([key]) => {
      return isMatch(key, options.actions)
    })
    .map(([,line]) => {
      return line.padStart(line.length + space - 2, ' ')
    })
    .join('\n')
    .trimStart()
}

function formatImport (options: WriteOptions): string {
  return Object
    .entries({
      'da': 'import { DeleteAllHandler } from \'./delete-all\'',
      'dm': 'import { DeleteManyHandler } from \'./delete-many\'',
      'do': 'import { DeleteOneHandler } from \'./delete-one\'',
      'im': 'import { InsertManyHandler } from \'./insert-many\'',
      'io': 'import { InsertOneHandler } from \'./insert-one\'',
      'sa': 'import { SelectAllHandler } from \'./select-all\'',
      'sm': 'import { SelectManyHandler } from \'./select-many\'',
      'so': 'import { SelectOneHandler } from \'./select-one\'',
      'um': 'import { UpdateManyHandler } from \'./update-many\'',
      'uo': 'import { UpdateOneHandler } from \'./update-one\''
    })
    .filter(([key]) => {
      return isMatch(key, options.actions)
    })
    .map(([,line]) => {
      return line
    })
    .join('\n')
}

function formatStart (options: WriteOptions, space: number): string {
  const lines = Object
    .entries({
      'da': 'deleteAllHandler.start()',
      'dm': 'deleteManyHandler.start()',
      'do': 'deleteOneHandler.start()',
      'im': 'insertManyHandler.start()',
      'io': 'insertOneHandler.start()',
      'sa': 'selectAllHandler.start()',
      'sm': 'selectManyHandler.start()',
      'so': 'selectOneHandler.start()',
      'um': 'updateManyHandler.start()',
      'uo': 'updateOneHandler.start()'
    })
    .filter(([key]) => {
      return isMatch(key, options.actions)
    })
    .map(([,line]) => {
      return line
    })

  return formatGroup(lines, space, ['', ''], '').trim()
}