import type { Field, FieldData } from '../helpers'
import type { Primitive, ScolaError, Struct } from '../../common'
import type { ScolaElement } from './element'

export interface ScolaFieldElement extends ScolaElement {
  field: Field

  name: string

  type: string

  value: string

  falsify: () => void

  getError: () => ScolaError | null

  isEmpty: () => boolean

  getData: () => FieldData

  getValue: () => Date | File | File[] | Primitive | Primitive[] | Struct | Struct[] | null

  reset: () => void

  verify: () => void
}
