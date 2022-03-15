import type { Primitive, Struct } from '../../../common'
import type { User } from '../../entities'
import { isStruct } from '../../../common'

type BoundValidator = (data: Struct, errors: Struct, user?: User) => boolean | null

type Validator = (name: string, field: SchemaField, data: Struct, errors: Struct, user?: User) => boolean | null

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
  pattern?: RegExp
  pkey?: boolean
  required?: boolean
  rkey?: SchemaFieldKey
  schema?: Schema
  search?: boolean
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
  public static validators: Struct<Validator | undefined> = {}

  public schema: Schema

  public validators: BoundValidator[][]

  public constructor (schema: Schema) {
    this.schema = schema
    this.validators = this.compile(schema)
  }

  public static defineValidators (validators: Struct<Validator>): void {
    Object
      .entries(validators)
      .forEach(([name, validator]) => {
        SchemaValidator.validators[name] = validator
      })
  }

  public validate (data: Struct, user?: User): Struct | null {
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
        }
      }
    }

    if (hasErrors) {
      return errors
    }

    return null
  }

  protected compile (schema: Schema): BoundValidator[][] {
    return Object
      .entries(schema)
      .map(([name, field]) => {
        return this.compileField(name, field)
      })
  }

  protected compileChild (name: string, field: SchemaField): BoundValidator {
    const childValidator = new SchemaValidator(field.schema ?? {})

    function validator (data: Struct, errors: Struct): boolean {
      let childErrors: Struct | null = null

      const childData = data[name]

      if (isStruct(childData)) {
        childErrors = childValidator.validate(childData)
      }

      if (childErrors === null) {
        return true
      }

      Object.assign(errors, childErrors)
      return false
    }

    return validator
  }

  protected compileField (name: string, field: SchemaField): BoundValidator[] {
    const validators = []

    validators.push(SchemaValidator.validators.required?.bind(null, name, field))
    validators.push(SchemaValidator.validators[field.type]?.bind(null, name, field))

    if (field.custom !== undefined) {
      validators.push(SchemaValidator.validators[field.custom]?.bind(null, name, field))
    }

    if (field.max !== undefined) {
      validators.push(SchemaValidator.validators.max?.bind(null, name, field))
    }

    if (field.maxLength !== undefined) {
      validators.push(SchemaValidator.validators['max-length']?.bind(null, name, field))
    }

    if (field.min !== undefined) {
      validators.push(SchemaValidator.validators.min?.bind(null, name, field))
    }

    if (field.minLength !== undefined) {
      validators.push(SchemaValidator.validators['min-length']?.bind(null, name, field))
    }

    if (field.pattern !== undefined) {
      validators.push(SchemaValidator.validators.pattern?.bind(null, name, field))
    }

    if (field.step !== undefined) {
      validators.push(SchemaValidator.validators.step?.bind(null, name, field))
    }

    if (field.schema !== undefined) {
      validators.push(this.compileChild(name, field))
    }

    return validators.filter((validator) => {
      return validator !== undefined
    }) as BoundValidator[]
  }
}
