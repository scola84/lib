import type { Field, FieldError } from '../helpers'
import type { ScolaElement } from './element'

export interface ScolaFieldElement extends ScolaElement {
  field: Field

  name: string

  type: string

  value: string

  clear: () => void

  falsify: () => void

  getError: () => FieldError | null

  getValue: () => string | null

  verify: () => void
}
