import type { Primitive, Struct } from '../../../common'
import type { User } from '../../entities'

export type Validator = (data: Struct, errors: Struct, user?: User) => boolean | null

export type ValidatorFactory = (name: string, field: SchemaField) => Validator

export interface SchemaField extends Struct {
  accept?: string[]
  auth?: SchemaFieldKey[][]
  cursor?: number
  custom?: string
  default?: Primitive
  index?: string
  fkey?: SchemaFieldKey
  max?: number
  maxLength?: number
  min?: number
  minLength?: number
  mkey?: boolean
  pattern?: RegExp
  pkey?: boolean
  required?: boolean
  rkey?: SchemaFieldKey
  schema?: Schema
  search?: boolean
  serial?: boolean
  sort?: boolean
  step?: number
  type: string
  unique?: string
  values?: unknown[]
}

export interface SchemaFieldKey {
  column: string
  table: string
}

export type Schema = Struct<SchemaField>

export class SchemaValidator {
  public static validators: Struct<ValidatorFactory | undefined> = {}

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

  public validate<Data extends Struct = Struct>(data: Data, user?: User): Data {
    let hasErrors = false
    let isValid: boolean | null = false

    const errors: Struct = {}

    for (const validators of this.validators) {
      for (const validator of validators) {
        isValid = validator(data, errors, user)

        if (isValid === null) {
          break
        } else if (!isValid) {
          hasErrors = true
          break
        }
      }
    }

    if (hasErrors) {
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
    validators.push(SchemaValidator.validators[field.type]?.(name, field))

    if (field.custom !== undefined) {
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
