import type { Primitive } from '../../../common'
import { Struct } from '../../../common'
import type { User } from '../../entities'

export type Validator = (data: Struct, errors: Struct, user?: User) => Promise<void> | void

export type ValidatorFactory = (name: string, field: SchemaField) => Validator

export interface SchemaField extends Struct {
  accept?: string[]
  auth?: SchemaFieldKey[][]
  cursor?: number
  custom?: string
  hidden?: boolean
  index?: string
  fkey?: SchemaFieldKey
  fkeyDelete?: string
  max?: number
  maxLength?: number
  min?: number
  minLength?: number
  mkey?: boolean
  order?: boolean
  pattern?: RegExp
  pkey?: boolean
  readonly?: boolean
  required?: boolean
  rkey?: SchemaFieldKey
  schema?: Schema
  serial?: boolean
  step?: number
  strict?: boolean
  type: string
  unique?: string
  values?: unknown[]
  value?: Date | Primitive
  var?: string
  where?: boolean
}

export interface SchemaFieldKey {
  column: string
  table: string
}

export type Schema = Struct<SchemaField>

export class SchemaValidator {
  public static validators: Partial<Struct<ValidatorFactory>> = {}

  public schema: Schema

  public validators: Validator[][]

  public constructor (schema: Schema) {
    this.schema = schema
    this.validators = this.compile(schema)
  }

  public static defineValidators (validators: Struct<ValidatorFactory>): void {
    Object
      .entries(validators)
      .forEach(([name, validator]) => {
        SchemaValidator.validators[name] = validator
      })
  }

  public async validate<Data extends Struct = Struct>(data: Data, user?: User): Promise<Data> {
    const errors = Struct.create()

    for (const validators of this.validators) {
      for (const validator of validators) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await validator(data, errors, user)
        } catch (error: unknown) {
          break
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw errors as unknown as Error
    }

    return data
  }

  protected compile (schema: Schema): Validator[][] {
    return Object
      .entries(schema)
      .map(([name, field]) => {
        return this.compileField(name, field)
      })
  }

  protected compileField (name: string, field: SchemaField): Validator[] {
    const validators = []

    validators.push(SchemaValidator.validators.required?.(name, field))

    if (SchemaValidator.validators[field.type] === undefined) {
      throw new Error(`Validator "${field.type}" is undefined`)
    }

    validators.push(SchemaValidator.validators[field.type]?.(name, field))

    if (field.custom !== undefined) {
      if (SchemaValidator.validators[field.custom] === undefined) {
        throw new Error(`Validator "${field.custom}" is undefined`)
      }

      validators.push(SchemaValidator.validators[field.custom]?.(name, field))
    }

    if (field.max !== undefined) {
      validators.push(SchemaValidator.validators.max?.(name, field))
    }

    if (field.maxLength !== undefined) {
      validators.push(SchemaValidator.validators['max-length']?.(name, field))
    }

    if (field.min !== undefined) {
      validators.push(SchemaValidator.validators.min?.(name, field))
    }

    if (field.minLength !== undefined) {
      validators.push(SchemaValidator.validators['min-length']?.(name, field))
    }

    if (field.pattern !== undefined) {
      validators.push(SchemaValidator.validators.pattern?.(name, field))
    }

    if (field.step !== undefined) {
      validators.push(SchemaValidator.validators.step?.(name, field))
    }

    return validators.filter((validator) => {
      return validator !== undefined
    }) as Validator[]
  }
}
