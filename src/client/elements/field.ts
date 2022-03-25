import type { Field, FieldData, FieldError } from '../helpers'
import type { Primitive, Struct } from '../../common'
import type { ScolaElement } from './element'

export interface ScolaFieldElement extends ScolaElement {
  field: Field

  name: string

  type: string

  value: string

  falsify: () => void

  getError: () => FieldError | null

  isEmpty: () => boolean

  getData: () => FieldData

  getValue: () => Date | File | File[] | Primitive | Primitive[] | Struct | Struct[] | null

  reset: () => void

  verify: () => void
}
