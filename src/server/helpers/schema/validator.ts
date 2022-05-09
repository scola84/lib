import type { Primitive, User } from '../../../common'
import { Struct } from '../../../common'

type Generator = () => Array<[number | string, string, boolean?]> | Promise<Array<[string, string, boolean?]>>

export type Validator = (data: Struct, errors: Struct, user?: User) => Promise<void> | void

export type ValidatorFactory = (name: string, field: SchemaField, validator: SchemaValidator) => Promise<Validator> | Validator

export interface SchemaField extends Struct {
  accept?: string[]
  auth?: SchemaFieldKey[][]
  cursor?: number
  custom?: string
  generated?: string
  generator?: string
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
  public static generators: Partial<Struct<Generator>> = {}

  public static validators: Partial<Struct<ValidatorFactory>> = {}

  public generators: Partial<Struct<Generator>>

  public schema: Schema

  public validators: Validator[][]

  public constructor (schema: Schema) {
    this.generators = SchemaValidator.generators
    this.schema = schema
  }

  public static defineGenerators (generators: Struct<Generator>): void {
    Object
      .entries(generators)
      .forEach(([name, generator]) => {
        SchemaValidator.generators[name] = generator
      })
  }

  public static defineValidators (validators: Struct<ValidatorFactory>): void {
    Object
      .entries(validators)
      .forEach(([name, validator]) => {
        SchemaValidator.validators[name] = validator
      })
  }

  public async compile (): Promise<void> {
    this.validators = await Promise.all(Object
      .entries(this.schema)
      .map(async ([name, field]) => {
        return this.compileField(name, field)
      }))
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

  protected async compileField (name: string, field: SchemaField): Promise<Validator[]> {
    const validators = []

    validators.push(SchemaValidator.validators.required?.(name, field, this))

    if (SchemaValidator.validators[field.type] === undefined) {
      throw new Error(`Validator "${field.type}" is undefined`)
    }

    validators.push(await SchemaValidator.validators[field.type]?.(name, field, this))

    if (field.custom !== undefined) {
      if (SchemaValidator.validators[field.custom] === undefined) {
        throw new Error(`Validator "${field.custom}" is undefined`)
      }

      validators.push(await SchemaValidator.validators[field.custom]?.(name, field, this))
    }

    if (field.max !== undefined) {
      validators.push(await SchemaValidator.validators.max?.(name, field, this))
    }

    if (field.maxLength !== undefined) {
      validators.push(await SchemaValidator.validators['max-length']?.(name, field, this))
    }

    if (field.min !== undefined) {
      validators.push(await SchemaValidator.validators.min?.(name, field, this))
    }

    if (field.minLength !== undefined) {
      validators.push(await SchemaValidator.validators['min-length']?.(name, field, this))
    }

    if (field.pattern !== undefined) {
      validators.push(await SchemaValidator.validators.pattern?.(name, field, this))
    }

    if (field.step !== undefined) {
      validators.push(await SchemaValidator.validators.step?.(name, field, this))
    }

    return validators.filter((validator) => {
      return validator !== undefined
    }) as Validator[]
  }
}
