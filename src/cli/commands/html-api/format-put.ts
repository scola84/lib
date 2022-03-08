import type { Options } from './options'
import type { Schema } from '../../../server/helpers/schema'
import { formatCode } from './format-code'
import { formatGroup } from './format-group'
import { formatInterface } from './format-interface'
import { pickField } from './pick-field'

export function formatPut (options: Options, schema: Schema): string {
  return `
import type { RouteData, Struct } from '@scola/lib'
import { RouteHandler, sql } from '@scola/lib'

interface PutDataBody extends Struct ${formatBodyInterface(schema, 0)}

interface PutData extends RouteData {
  body: PutDataBody
}

export class PutHandler extends RouteHandler {
  public schema = {
    body: ${formatBodySchema(schema, 6)}
  }

  protected async handle (data: PutData): Promise<void> {
    await this.database.insert(sql\`
      UPDATE $[${options.object}]
      SET ${
        formatQueryColumns(schema, 6)
      }
      WHERE ${
        formatQueryKeys(schema, 6)
      }\`, ${
        formatQueryValues(schema, 4)
      })
  }
}
`.trim()
}

function formatBodyInterface (schema: Schema, space: number): string {
  return formatInterface(
    Object
      .entries(schema)
      .filter(([, field]) => {
        return field.lkey === undefined
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

function formatBodySchema (schema: Schema, space: number): string {
  return formatCode(
    Object
      .entries(schema)
      .filter(([,field]) => {
        return field.lkey === undefined
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

function formatQueryColumns (schema: Schema, space: number): string {
  return formatGroup(
    [
      '$[updated] = $(_date)',
      ...Object
        .entries(schema)
        .filter(([,field]) => {
          return (
            field.pkey !== true &&
            field.lkey === undefined
          )
        })
        .map(([name]) => {
          return `$[${name}] = $(${name})`
        })
    ],
    space,
    ['', '']
  ).trimEnd()
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

function formatQueryValues (schema: Schema, space: number): string {
  return formatGroup(
    [
      '_date: new Date().toISOString()',
      ...Object
        .entries(schema)
        .filter(([,field]) => {
          return field.lkey === undefined
        })
        .map(([name]) => {
          return `${name}: data.body.${name}`
        })
    ],
    space
  )
}
