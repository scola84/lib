import type { Schema, Struct } from '../../../server'
import type { Options } from '../html-crud'
import { formatDeleteAll } from './format-delete-all'
import { formatDeleteMany } from './format-delete-many'
import { formatDeleteOne } from './format-delete-one'
import { formatIndex } from './format-index'
import { formatInsertMany } from './format-insert-many'
import { formatInsertOne } from './format-insert-one'
import { formatSelectAll } from './format-select-all'
import { formatSelectMany } from './format-select-many'
import { formatSelectOne } from './format-select-one'
import { formatUpdateMany } from './format-update-many'
import { formatUpdateOne } from './format-update-one'
import { isMatch } from 'micromatch'
import { writeFileSync } from 'fs-extra'

export function writeTs (targetDir: string, schema: Schema, options: Options, relations: Struct<Schema>): void {
  Object
    .entries({
      'da': [`${targetDir}/delete-all.ts`, `${formatDeleteAll(schema, options)}\n`],
      'dm': [`${targetDir}/delete-many.ts`, `${formatDeleteMany(schema, options)}\n`],
      'do': [`${targetDir}/delete-one.ts`, `${formatDeleteOne(schema, options)}\n`],
      'im': [`${targetDir}/insert-many.ts`, `${formatInsertMany(schema, options)}\n`],
      'io': [`${targetDir}/insert-one.ts`, `${formatInsertOne(schema, options)}\n`],
      'sa': [`${targetDir}/select-all.ts`, `${formatSelectAll(schema, options, relations)}\n`],
      'sm': [`${targetDir}/select-many.ts`, `${formatSelectMany(schema, options)}\n`],
      'so': [`${targetDir}/select-one.ts`, `${formatSelectOne(schema, options)}\n`],
      'um': [`${targetDir}/update-many.ts`, `${formatUpdateMany(schema, options)}\n`],
      'uo': [`${targetDir}/update-one.ts`, `${formatUpdateOne(schema, options)}\n`]

    })
    .filter(([key]) => {
      return isMatch(key, options.actions)
    })
    .forEach(([, [path, content]]) => {
      writeFileSync(path, content)
    })

  writeFileSync(`${targetDir}/index.ts`, `${formatIndex(options)}\n`)
}
