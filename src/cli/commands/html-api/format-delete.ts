import type { Options } from './options'
import type { Schema } from '../../../server/helpers/schema'
import { formatCode } from './format-code'
import { formatGroup } from './format-group'
import { formatInterface } from './format-interface'
import { pickField } from './pick-field'

export function formatDelete (options: Options, schema: Schema): string {
  return `
import type { RouteData, Struct } from '@scola/lib'
import { RouteHandler, sql } from '@scola/lib'

interface DeleteDataQuery extends Struct ${formatQueryInterface(schema, 0)}

interface DeleteData extends RouteData {
  query: DeleteDataQuery
}

export class DeleteHandler extends RouteHandler {
  public responseType = '${options.content}'

  public schema = {
    query: ${formatQuerySchema(schema, 6)}
  }

  protected async handle (data: DeleteData): Promise<void> {
    return this.database.select(sql\`
      DELETE
      FROM $[${options.object}]
      WHERE ${
        formatQueryKeys(schema, 6)
      }\`, ${
        formatQueryValues(schema, 4)
      })
  }
}
`.trim()
}

function formatQueryInterface (schema: Schema, space: number): string {
  return formatInterface(
    Object
      .entries(schema)
      .filter(([, field]) => {
        return field.pkey === true
      })
      .reduce((result, [name, field]) => {
        return {
          [name]: field,
          ...result
        }
      }, {}),
    space
  )
}

function formatQueryKeys (schema: Schema, space: number): string {
  return formatGroup(
    Object
      .entries(schema)
      .filter(([, field]) => {
        return field.pkey === true
      })
      .map(([name]) => {
        return `$[${name}] = $(${name})`
      }),
    space,
    ['(', ')'],
    ' AND'
  )
}

function formatQuerySchema (schema: Schema, space: number): string {
  return formatCode(
    Object
      .entries(schema)
      .filter(([,field]) => {
        return (
          field.pkey === true
        )
      })
      .reduce((value, [name, field]) => {
        return {
          ...value,
          [name]: pickField(field)
        }
      }, {}),
    space
  ).trimStart()
}

function formatQueryValues (schema: Schema, space: number): string {
  return formatGroup(
    [
      ...Object
        .entries(schema)
        .filter(([,field]) => {
          return (
            field.pkey === true
          )
        })
        .map(([name]) => {
          return `${name}: data.query.${name}`
        })
    ],
    space
  )
}
