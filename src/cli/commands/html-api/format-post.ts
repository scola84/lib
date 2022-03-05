import type { Options } from './options'
import type { Schema } from '../../../server/helpers/schema'
import { formatCode } from './format-code'
import { formatGroup } from './format-group'
import { formatInterface } from './format-interface'
import { pickField } from './pick-field'

export function formatPost (options: Options, schema: Schema): string {
  return `
import type { QueryKeys, RouteData, Struct } from '@scola/lib'
import { RouteHandler, sql } from '@scola/lib'

interface PostDataBody extends Struct ${formatBodyInterface(schema, 0)}

interface PostData extends RouteData {
  body: PostDataBody
}

export class PostHandler extends RouteHandler {
  public keys: QueryKeys = ${formatKeys(schema, 4)}

  public responseType = '${options.content}'

  public schema = {
    body: ${formatBodySchema(schema, 6)}
  }

  protected async handle (data: PostData): Promise<Struct> {
    const { id } = await this.database.insert(sql\`
      INSERT INTO ${options.object} ${
        formatObjectQueryColumns(schema, 6)
      } VALUES ${
        formatObjectQueryKeys(schema, 6)
      }\`, ${
        formatObjectQueryValues(schema, 4)
      })

    await Promise.all(this.keys.link?.map(async (key) => {
      return this.database.insert(sql\`
        INSERT INTO $[\${key.table}] ${
          formatLinkQueryColumns(schema, 8)
        } VALUES ${
          formatLinkQueryKeys(schema, 8)
        }\`, ${
          formatLinkQueryValues(schema, 6)
        })
    }) ?? [])

    return ${formatReturn(schema, 4)}
  }
}
`.trim()
}

function formatReturn (schema: Schema, space: number): string {
  return formatGroup(
    Object
      .entries(schema)
      .filter(([,field]) => {
        return field.pkey === true
      })
      .map(([name]) => {
        return `${name}: id`
      }),
    space
  )
}

function formatBodyInterface (schema: Schema, space: number): string {
  return formatInterface(
    Object
      .entries(schema)
      .filter(([, field]) => {
        return (
          field.pkey !== true &&
          field.lkey === undefined
        )
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
        return (
          field.pkey !== true &&
          field.lkey === undefined
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

function formatKeys (schema: Schema, space: number): string {
  return formatCode(
    {
      link: Object
        .entries(schema)
        .filter(([,field]) => {
          return field.lkey !== undefined
        })
        .map(([,field]) => {
          return field.lkey
        })
    },
    space
  ).trimStart()
}

function formatLinkQueryColumns (schema: Schema, space: number): string {
  return formatGroup(
    [
      `$[\${${'key.column'}}]`,
      ...Object
        .entries(schema)
        .filter(([,field]) => {
          return field.pkey === true
        })
        .map(([name]) => {
          return `$[${name}]`
        })
    ],
    space,
    ['(', ')']
  )
}

function formatLinkQueryKeys (schema: Schema, space: number): string {
  return formatGroup(
    [
      `$(\${${'key.column'}})`,
      ...Object
        .entries(schema)
        .filter(([,field]) => {
          return field.pkey === true
        })
        .map(([name]) => {
          return `$[${name}]`
        })
    ],
    space,
    ['(', ')']
  )
}

function formatLinkQueryValues (schema: Schema, space: number): string {
  return formatGroup(
    [
      '[key.column]: data.body[key.column]',
      ...Object
        .entries(schema)
        .filter(([,field]) => {
          return field.pkey === true
        })
        .map(([name]) => {
          return `${name}: id`
        })
    ],
    space
  )
}

function formatObjectQueryColumns (schema: Schema, space: number): string {
  return formatGroup(
    [
      '$[created]',
      '$[updated]',
      ...Object
        .entries(schema)
        .filter(([,field]) => {
          return (
            field.pkey !== true &&
            field.lkey === undefined
          )
        })
        .map(([name]) => {
          return `$[${name}]`
        })
    ],
    space,
    ['(', ')']
  )
}

function formatObjectQueryKeys (schema: Schema, space: number): string {
  return formatGroup(
    [
      '$(_date)',
      '$(_date)',
      ...Object
        .entries(schema)
        .filter(([,field]) => {
          return (
            field.pkey !== true &&
            field.lkey === undefined
          )
        })
        .map(([name]) => {
          return `$(${name})`
        })
    ],
    space,
    ['(', ')']
  )
}

function formatObjectQueryValues (schema: Schema, space: number): string {
  return formatGroup(
    [
      '_date: new Date().toISOString()',
      ...Object
        .entries(schema)
        .filter(([,field]) => {
          return (
            field.pkey !== true &&
            field.lkey === undefined
          )
        })
        .map(([name]) => {
          return `${name}: data.body.${name}`
        })
    ],
    space
  )
}
