/* eslint-disable max-lines-per-function */
import type { Schema } from '../../../server/helpers/schema'
import { cast } from '../../../common/helpers/cast'

export function post (object: string, schema: Schema): string {
  return `
import type { InsertResult, RouteData, RouteHandlerOptions } from '@scola/lib'
import { RouteHandler, sql } from '@scola/lib'

interface PostData extends RouteData {
  body: {
${Object
  .entries(schema)
  .filter(([,field]) => {
    return field.key !== true
  })
  .map(([name]) => {
    return `${name}: string`
  })
  .map((line) => {
    return line.padStart(line.length + 4, ' ')
  })
  .join('\n')}
  }
}

export interface PostHandlerOptions extends Partial<RouteHandlerOptions> {}

export class PostHandler extends RouteHandler {
  public responseType = 'application/json'

  public schema = {
    body: {${Object
  .entries(schema)
  .filter(([,field]) => {
    return field.key !== true
  })
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

  public constructor (options: PostHandlerOptions) {
    super(options)
  }

  protected async handle (data: PostData): Promise<InsertResult> {
    return this.database.insert(sql\`
      INSERT INTO ${object} (
        $[created],
        $[updated],
${Object
  .entries(schema)
  .filter(([,field]) => {
    return field.key !== true
  })
  .map(([name]) => {
    return `$[${name}]`
  })
  .map((line) => {
    return line.padStart(line.length + 8, ' ')
  })
  .join(',\n')}
      ) VALUES (
        $(_date),
        $(_date),
${Object
  .entries(schema)
  .filter(([,field]) => {
    return field.key !== true
  })
  .map(([name]) => {
    return `$(${name})`
  })
  .map((line) => {
    return line.padStart(line.length + 8, ' ')
  })
  .join(',\n')}
      )
    \`, {
      _date: new Date().toISOString(),
${Object
  .entries(schema)
  .filter(([,field]) => {
    return field.key !== true
  })
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
