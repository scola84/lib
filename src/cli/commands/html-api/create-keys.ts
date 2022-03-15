import type { Schema, SchemaFieldKey } from '../../../server/helpers/schema'
import type { SqlQueryKeys } from '../../../server/helpers/sql'
import type { Struct } from '../../../common'
import { sortKeys } from './sort-keys'

export function createKeys (object: string, schema: Schema, relations: Struct<Schema>): SqlQueryKeys {
  return {
    auth: createAuthKeys(schema),
    foreign: createForeignKeys(schema),
    primary: createPrimaryKeys(object, schema),
    related: createRelatedKeys(schema),
    search: createSearchKeys(object, schema, relations),
    sort: createSortKeys(object, schema, relations)
  }
}

function createAuthKeys (schema: Schema): Struct<SchemaFieldKey[][]> | undefined {
  const keys = Object
    .entries(schema)
    .filter(([,field]) => {
      return field.auth !== undefined
    })

  if (keys.length === 0) {
    return undefined
  }

  return sortKeys(keys
    .reduce((result, [name, field]) => {
      return {
        ...result,
        [name]: field.auth
      }
    }, {}))
}

function createForeignKeys (schema: Schema): SchemaFieldKey[] | undefined {
  const keys = Object
    .entries(schema)
    .filter(([,field]) => {
      return field.fkey !== undefined
    })
    .map(([,field]) => {
      return field.fkey
    }) as SchemaFieldKey[]

  if (keys.length === 0) {
    return undefined
  }

  return keys
}

function createPrimaryKeys (object: string, schema: Schema): SchemaFieldKey[] | undefined {
  const keys = Object
    .entries(schema)
    .filter(([,field]) => {
      return field.pkey === true
    })
    .map(([name]) => {
      return {
        column: name,
        table: object
      }
    })

  if (keys.length === 0) {
    return undefined
  }

  return keys
}

function createRelatedKeys (schema: Schema): SchemaFieldKey[] | undefined {
  const keys = Object
    .entries(schema)
    .filter(([,field]) => {
      return field.rkey !== undefined
    })
    .map(([,field]) => {
      return field.rkey
    }) as SchemaFieldKey[]

  if (keys.length === 0) {
    return undefined
  }

  return keys
}

function createSearchKeys (object: string, schema: Schema, relations: Struct<Schema>): SchemaFieldKey[] | undefined {
  const keys = Object
    .entries({
      [object]: schema,
      ...relations
    })
    .map(([table, tableSchema]) => {
      return Object
        .entries(tableSchema)
        .filter(([,field]) => {
          return field.search === true
        })
        .map(([column]) => {
          return {
            column,
            table
          }
        })
    })
    .flat()

  if (keys.length === 0) {
    return undefined
  }

  return keys
}

function createSortKeys (object: string, schema: Schema, relations: Struct<Schema>): SchemaFieldKey[] | undefined {
  const keys = Object
    .entries({
      [object]: schema,
      ...relations
    })
    .map(([table, tableSchema]) => {
      return Object
        .entries(tableSchema)
        .filter(([,field]) => {
          return field.sort === true
        })
        .map(([column]) => {
          return {
            column,
            table
          }
        })
    })
    .flat()

  if (keys.length === 0) {
    return undefined
  }

  return keys
}
