/* eslint-disable max-lines-per-function */
import type { Options } from '../html-crud'
import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'
import { hyphenize } from '../../../common'
import { pickField } from './pick-field'
import { sortKeys } from './sort-keys'

export function formatSelectAll (schema: Schema, options: Options, relations: Struct<Schema>): string {
  return `
import { CrudSelectAllHandler } from '@scola/lib'

export class SelectAllHandler extends CrudSelectAllHandler {
  public keys = ${formatKeys(options.object, schema, relations, 4)}

  public object = '${options.object}'

  public schema: CrudSelectAllHandler['schema'] = {
    query: ${formatQuerySchema(options.object, schema, relations, 6)}
  }

  public url = '${options.url}/select/all/${hyphenize(options.object)}'
}
`.trim()
}

function createJoinSchema (object: string, schema: Schema): Schema | undefined {
  const joinSchema = sortKeys<Schema>(Object
    .entries(schema)
    .filter(([,field]) => {
      return (
        field.fkey !== undefined ||
        field.rkey !== undefined
      )
    })
    .reduce((result, [name, field]) => {
      return {
        ...result,
        [name]: {
          ...pickField(field),
          required: undefined
        }
      }
    }, {}))

  const hasFields = Object
    .values(joinSchema)
    .some((tableSchema) => {
      return Object.keys(tableSchema).length > 0
    })

  if (!hasFields) {
    return undefined
  }

  return {
    where: {
      schema: joinSchema,
      type: 'struct'
    }
  }
}

function createLimitSchema (): Schema {
  return {
    limit: {
      required: true,
      schema: {
        count: {
          default: 10,
          required: true,
          type: 'number'
        },
        cursor: {
          type: 'text'
        },
        offset: {
          type: 'number'
        }
      },
      type: 'struct'
    }
  }
}

function createOperatorSchema (object: string, schema: Schema, relations: Struct<Schema>): Schema | undefined {
  const operatorSchema = sortKeys<Schema>(Object
    .entries({
      [object]: schema,
      ...relations
    })
    .reduce((tableResult, [tableName, tableSchema]) => {
      return {
        ...tableResult,
        [tableName]: {
          schema: Object
            .entries(tableSchema)
            .filter(([,field]) => {
              return field.where === true
            })
            .reduce((result, [name]) => {
              return {
                ...result,
                [name]: {
                  type: 'operator'
                }
              }
            }, {}),
          type: 'struct'
        }
      }
    }, {}))

  const hasFields = Object
    .values(operatorSchema)
    .some((tableSchema) => {
      return Object.keys(tableSchema).length > 0
    })

  if (!hasFields) {
    return undefined
  }

  return {
    operator: {
      schema: operatorSchema,
      type: 'struct'
    }
  }
}

function createOrderSchema (object: string, schema: Schema, relations: Struct<Schema>): Schema | undefined {
  const orderSchema = sortKeys<Schema>(Object
    .entries({
      [object]: schema,
      ...relations
    })
    .reduce((result, [tableName, tableSchema]) => {
      return {
        ...result,
        [tableName]: {
          type: 'select-multiple',
          values: Object
            .entries(tableSchema)
            .filter(([,field]) => {
              return field.order
            })
            .map(([name]) => {
              return name
            })
        }
      }
    }, {}))

  const hasFields = Object
    .values(orderSchema)
    .some((tableSchema) => {
      return (tableSchema.values ?? []).length > 0
    })

  if (!hasFields) {
    return undefined
  }

  return {
    order: {
      schema: {
        column: {
          schema: orderSchema,
          type: 'struct'
        },
        direction: {
          type: 'direction'
        }
      },
      type: 'struct'
    }
  }
}

function createSelectSchema (object: string, schema: Schema, relations: Struct<Schema>): Schema | undefined {
  const selectSchema = sortKeys<Schema>(Object
    .entries({
      [object]: schema,
      ...relations
    })
    .reduce((result, [tableName, tableSchema]) => {
      return {
        ...result,
        [tableName]: {
          type: 'select-multiple',
          values: Object
            .entries(tableSchema)
            .filter(([,field]) => {
              return field.select
            })
            .map(([name]) => {
              return name
            })
        }
      }
    }, {}))

  const hasFields = Object
    .values(selectSchema)
    .some((tableSchema) => {
      return (tableSchema.values ?? []).length > 0
    })

  if (!hasFields) {
    return undefined
  }

  return {
    select: {
      schema: selectSchema,
      type: 'struct'
    }
  }
}

function createWhereSchema (object: string, schema: Schema, relations: Struct<Schema>): Schema | undefined {
  const whereSchema = sortKeys<Schema>({
    [object]: {
      schema: Object
        .entries(schema)
        .filter(([,field]) => {
          return (
            field.fkey !== undefined ||
          field.rkey !== undefined ||
          field.where === true
          )
        })
        .reduce((result, [name, field]) => {
          return {
            ...result,
            [name]: {
              ...pickField(field),
              required: undefined
            }
          }
        }, {}),
      type: 'struct'
    },
    ...Object
      .entries(relations)
      .reduce((tableResult, [tableName, tableSchema]) => {
        return {
          ...tableResult,
          [tableName]: {
            schema: Object
              .entries(tableSchema)
              .filter(([,field]) => {
                return field.where === true
              })
              .reduce((result, [name, field]) => {
                return {
                  ...result,
                  [name]: {
                    ...pickField(field),
                    required: undefined
                  }
                }
              }, {}),
            type: 'struct'
          }
        }
      }, {})
  })

  const hasFields = Object
    .values(whereSchema)
    .some((tableSchema) => {
      return Object.keys(tableSchema).length > 0
    })

  if (!hasFields) {
    return undefined
  }

  return {
    where: {
      schema: whereSchema,
      type: 'struct'
    }
  }
}

function formatKeys (object: string, schema: Schema, relations: Struct<Schema>, space: number): string {
  return formatCode(
    createKeys(object, schema),
    space
  ).trimStart()
}

function formatQuerySchema (object: string, schema: Schema, relations: Struct<Schema>, space: number): string {
  return formatCode(
    {
      required: true,
      schema: sortKeys({
        ...createJoinSchema(object, schema),
        ...createLimitSchema(),
        ...createOrderSchema(object, schema, relations),
        ...createOperatorSchema(object, schema, relations),
        ...createSelectSchema(object, schema, relations),
        ...createWhereSchema(object, schema, relations)
      }),
      type: 'struct'
    },
    space
  ).trimStart()
}
