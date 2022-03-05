import { cast, isArray, isNil, isStruct } from '../../../common'
import type { Struct } from '../../../common'

type Validator = (data: Struct, errors: Struct) => boolean

type ValidatorBase = (name: string, field: SchemaField, data: Struct, errors: Struct) => boolean

interface Validators extends Struct<ValidatorBase | undefined> {
  max: ValidatorBase
  maxLength: ValidatorBase
  min: ValidatorBase
  minLength: ValidatorBase
  pattern: ValidatorBase
  required: ValidatorBase
  step: ValidatorBase
}

export interface SchemaField {
  cursor?: number
  default?: string
  index?: string
  fkey?: SchemaFieldKey
  lkey?: SchemaFieldKey
  max?: number
  maxLength?: number
  min?: number
  minLength?: number
  pattern?: RegExp
  pkey?: boolean
  required?: boolean
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
  public static validators: Validators = {
    checkbox (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      let values = data[name]

      if (!isArray(values)) {
        values = [values]
      }

      if (isArray(values)) {
        const included = values.every((value) => {
          return field.values?.includes(value) === true
        })

        if (!included) {
          errors[name] = {
            code: 'err_validator_bad_input_checkbox',
            data: { values: field.values }
          }

          return false
        }
      }

      return true
    },
    color (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (!(/[a-f0-9]{7}/iu).test(String(data[name]))) {
        errors[name] = {
          code: 'err_validator_bad_input_color'
        }

        return false
      }

      return true
    },
    date (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (Number.isNaN(Date.parse(String(data[name])))) {
        errors[name] = {
          code: 'err_validator_bad_input_date'
        }

        return false
      }

      return true
    },
    email (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (!(/.+@.+/iu).test(String(data[name]))) {
        errors[name] = {
          code: 'err_validator_bad_input_email'
        }

        return false
      }

      return true
    },
    max (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (Number(data[name]) > (field.max ?? Infinity)) {
        errors[name] = {
          code: 'err_validator_range_overflow',
          data: { max: field.max }
        }

        return false
      }

      return true
    },
    maxLength (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (String(data[name]).length > (field.maxLength ?? Infinity)) {
        errors[name] = {
          code: 'err_validator_too_long',
          data: { maxLength: field.maxLength }
        }

        return false
      }

      return true
    },
    min (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (Number(data[name]) < (field.min ?? -Infinity)) {
        errors[name] = {
          code: 'err_validator_range_underflow',
          data: { min: field.min }
        }

        return false
      }

      return true
    },
    minLength (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (String(data[name]).length < (field.minLength ?? -Infinity)) {
        errors[name] = {
          code: 'err_validator_too_short',
          data: { minLength: field.minLength }
        }

        return false
      }

      return true
    },
    number (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (Number.isNaN(cast(data[name]))) {
        errors[name] = {
          code: 'err_validator_bad_input_number'
        }

        return false
      }

      return true
    },
    pattern (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (field.pattern?.test(String(data[name])) === false) {
        errors[name] = {
          code: 'err_validator_pattern_mismatch',
          data: { pattern: field.pattern.source }
        }

        return false
      }

      return true
    },
    radio (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (field.values?.includes(data[name]) !== true) {
        errors[name] = {
          code: 'err_validator_bad_input_radio',
          data: { values: field.values }
        }

        return false
      }

      return true
    },
    range (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (Number.isNaN(cast(data[name]))) {
        errors[name] = {
          code: 'err_validator_bad_input_range'
        }

        return false
      }

      return true
    },
    required (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (
        isNil(data[name]) ||
        String(data[name]) === ''
      ) {
        if (field.default === undefined) {
          errors[name] = {
            code: 'err_validator_value_missing'
          }
        } else {
          data[name] = field.default
        }

        return false
      }

      return true
    },
    select (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (field.values?.includes(data[name]) !== true) {
        errors[name] = {
          code: 'err_validator_bad_input_select',
          data: { values: field.values }
        }

        return false
      }

      return true
    },
    selectall (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      let values = data[name]

      if (!isArray(values)) {
        values = [values]
      }

      if (isArray(values)) {
        const included = values.every((value) => {
          return field.values?.includes(value) === true
        })

        if (!included) {
          errors[name] = {
            code: 'err_validator_bad_input_selectall',
            data: { values: field.values }
          }

          return false
        }
      }

      return true
    },
    step (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if ((Number(data[name]) % (field.step ?? 0)) !== 0) {
        errors[name] = {
          code: 'err_validator_step_mismatch',
          data: { step: field.step }
        }

        return false
      }

      return true
    },
    text (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (typeof data[name] === 'string') {
        errors[name] = {
          code: 'err_validator_bad_input_text'
        }

        return false
      }

      return true
    },
    textarea (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (typeof data[name] === 'string') {
        errors[name] = {
          code: 'err_validator_bad_input_textarea'
        }

        return false
      }

      return true
    },
    time (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (Number.isNaN(Date.parse(`1970-01-01 ${String(data[name])}`))) {
        errors[name] = {
          code: 'err_validator_bad_input_time'
        }

        return false
      }

      return true
    },
    url (name: string, field: SchemaField, data: Struct, errors: Struct): boolean {
      if (!(/.+:\/\/.+/iu).test(String(data[name]))) {
        errors[name] = {
          code: 'err_validator_bad_input_url'
        }

        return false
      }

      return true
    }
  }

  public schema: Schema

  public validators: Validator[]

  public constructor (schema: Schema) {
    this.schema = schema
    this.validators = this.compile(schema)
  }

  public validate (data: Struct): Struct | null {
    let hasErrors = false

    const errors: Struct = {}

    for (const validator of this.validators) {
      if (!validator(data, errors)) {
        hasErrors = true
      }
    }

    if (hasErrors) {
      return errors
    }

    return null
  }

  protected compile (schema: Schema, validators: Validator[] = []): Validator[] {
    Object
      .entries(schema)
      .forEach(([name, field]) => {
        if (field.required === true) {
          validators.push(SchemaValidator.validators.required.bind(null, name, field))
        }

        const typeValidator = SchemaValidator.validators[field.type]

        if (typeValidator !== undefined) {
          validators.push(typeValidator.bind(null, name, field))
        }

        if (field.max !== undefined) {
          validators.push(SchemaValidator.validators.max.bind(null, name, field))
        }

        if (field.maxLength !== undefined) {
          validators.push(SchemaValidator.validators.maxLength.bind(null, name, field))
        }

        if (field.min !== undefined) {
          validators.push(SchemaValidator.validators.min.bind(null, name, field))
        }

        if (field.minLength !== undefined) {
          validators.push(SchemaValidator.validators.minLength.bind(null, name, field))
        }

        if (field.pattern !== undefined) {
          validators.push(SchemaValidator.validators.pattern.bind(null, name, field))
        }

        if (field.step !== undefined) {
          validators.push(SchemaValidator.validators.step.bind(null, name, field))
        }

        if (field.schema !== undefined) {
          validators.push(this.compileChild(name, field))
        }
      }, {})

    return validators
  }

  protected compileChild (name: string, field: SchemaField): Validator {
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
}
