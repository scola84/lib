import type { Schema, SqlDatabase, Struct } from '../../../server'
import type { Options } from '../html-crud'
import { writeFileSync } from 'fs-extra'

export function writeSql (targetDir: string, schema: Schema, options: Options, databases: Partial<Struct<SqlDatabase>>): void {
  writeFileSync(
    `${targetDir}/${options.name}.sql`,
    databases[options.dialect]?.formatter.formatDdl(
      options.database,
      options.object,
      schema
    ) ?? ''
  )
}
