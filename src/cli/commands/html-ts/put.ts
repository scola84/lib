/* eslint-disable max-lines-per-function */
import type { Schema } from '../../../server/helpers/schema'
import { cast } from '../../../common/helpers/cast'

export function put (object: string, schema: Schema): string {
  return `
import type { RouteData, RouteHandlerOptions, UpdateResult } from '@scola/lib'
import { RouteHandler, sql } from '@scola/lib'

interface PutData extends RouteData {
  body: {
${Object
  .entries(schema)
  .map(([name]) => {
    return `${name}: string`
  })
  .map((line) => {
    return line.padStart(line.length + 4, ' ')
  })
  .join('\n')}
  }
}

export interface PutHandlerOptions extends Partial<RouteHandlerOptions> {}

export class PutHandler extends RouteHandler {
  public responseType = 'application/json'

  public schema = {
    body: {${Object
  .entries(schema)
  .map(([name, field]) => {
    return `
      ${name}: {
${Object
  .entries(field)
  .map(([propertyName, propertyValue]) => {
    if (typeof propertyValue === 'string') {
      return `${propertyName}: '${propertyValue}'`
    } else if (propertyValue instanceof RegExp) {
      return `${propertyName}: /${propertyValue.source}/iu`
    }

    return `${propertyName}: ${cast(propertyValue)?.toString() ?? ''}`
  })
  .map((line) => {
    return line.padStart(line.length + 8, ' ')
  })
  .join(',\n')}
      }`
  })
  .join(',')}
    }
  }

  public constructor (options: PutHandlerOptions) {
    super(options)
  }

  protected async handle (data: PutData): Promise<UpdateResult> {
    return this.database.update(sql\`
      UPDATE $[${object}]
      SET
        $[updated] = $(_date),
${Object
  .entries(schema)
  .filter(([, field]) => {
    return field.key !== true
  })
  .map(([name]) => {
    return `$[${name}] = $(${name})`
  })
  .map((line) => {
    return line.padStart(line.length + 8, ' ')
  })
  .join(',\n')}
      WHERE $[${object}_id] = $(${object}_id)
    \`, {
      _date: new Date().toISOString(),
${Object
  .entries(schema)
  .map(([name]) => {
    return `${name}: data.body.${name}`
  })
  .map((line) => {
    return line.padStart(line.length + 6, ' ')
  })
  .join(',\n')}
    })
  }
}
`.trim()
}
