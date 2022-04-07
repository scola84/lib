import type { Options } from '../html-crud'
import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { createKeys } from './create-keys'
import { createSelectSchema } from './create-select-schema'
import { formatCode } from './format-code'
import { pickField } from './pick-field'
import { sortKeys } from './sort-keys'
import { toJoint } from '../../../common'

export function formatSelectAll (schema: Schema, options: Options, relations: Struct<Schema>): string {
  return `
import { CrudSelectAllHandler } from '@scola/lib'

export class SelectAllHandler extends CrudSelectAllHandler {
  public keys = ${formatKeys(options.object, schema, relations, 4)}

  public object = '${options.object}'

  public schema: CrudSelectAllHandler['schema'] = {
    query: ${formatQuerySchema(options.object, schema, relations, 6)}
  }

  public url = '${options.url}/select/all/${toJoint(options.object, {
    separator: '-'
  })}'
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
    cursor: {
      type: 'text'
    },
    limit: {
      default: 10,
      required: true,
      type: 'number'
    },
    offset: {
      type: 'number'
    }
  }
}

function createOperatorSchema (object: string, schema: Schema, relations: Struct<Schema>): Schema | undefined {
  let operatorSchema = sortKeys<Schema>({
    [object]: {
      schema: Object
        .entries(schema)
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
      strict: true,
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
              .reduce((result, [name]) => {
                return {
                  ...result,
                  [name]: {
                    type: 'operator'
                  }
                }
              }, {}),
            strict: true,
            type: 'struct'
          }
        }
      }, {})
  })

  if (Object.keys(relations).length === 0) {
    operatorSchema = operatorSchema[object].schema ?? {}
  }

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
      strict: true,
      type: 'struct'
    }
  }
}

function createOrderSchema (object: string, schema: Schema, relations: Struct<Schema>): Schema | undefined {
  let orderSchema = sortKeys<Schema>({
    [object]: {
      schema: Object
        .entries(schema)
        .filter(([,field]) => {
          return field.order === true
        })
        .reduce((result, [name]) => {
          return {
            ...result,
            [name]: {
              type: 'order'
            }
          }
        }, {}),
      strict: true,
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
                return field.order === true
              })
              .reduce((result, [name]) => {
                return {
                  ...result,
                  [name]: {
                    type: 'order'
                  }
                }
              }, {}),
            strict: true,
            type: 'struct'
          }
        }
      }, {})
  })

  if (Object.keys(relations).length === 0) {
    orderSchema = orderSchema[object].schema ?? {}
  }

  const hasFields = Object
    .values(orderSchema)
    .some((tableSchema) => {
      return Object.keys(tableSchema).length > 0
    })

  if (!hasFields) {
    return undefined
  }

  return {
    order: {
      schema: orderSchema,
      strict: true,
      type: 'struct'
    }
  }
}

function createWhereSchema (object: string, schema: Schema, relations: Struct<Schema>): Schema | undefined {
  let whereSchema = sortKeys<Schema>({
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
      strict: true,
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
            strict: true,
            type: 'struct'
          }
        }
      }, {})
  })

  if (Object.keys(relations).length === 0) {
    whereSchema = whereSchema[object].schema ?? {}
  }

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
      strict: true,
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
      schema: {
        ...createJoinSchema(object, schema),
        ...createLimitSchema(),
        ...createOperatorSchema(object, schema, relations),
        ...createOrderSchema(object, schema, relations),
        ...createSelectSchema(object, schema, relations),
        ...createWhereSchema(object, schema, relations)
      },
      type: 'struct'
    },
    space
  ).trimStart()
}
