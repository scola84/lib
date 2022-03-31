import type { Schema, SchemaFieldKey } from '../../../server/helpers/schema'
import type { SqlQueryKeys } from '../../../server/helpers/sql'
import type { Struct } from '../../../common'
import { sortKeys } from './sort-keys'

export function createKeys (object: string, schema: Schema): SqlQueryKeys {
  return {
    auth: createAuthKeys(schema),
    foreign: createForeignKeys(schema),
    modified: createModifiedKey(object, schema),
    primary: createPrimaryKeys(object, schema),
    related: createRelatedKeys(schema)
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

function createModifiedKey (object: string, schema: Schema): SchemaFieldKey | undefined {
  const keys = Object
    .entries(schema)
    .filter(([,field]) => {
      return field.mkey === true
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

  return keys[0]
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
