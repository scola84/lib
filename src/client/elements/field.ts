import type { Field, FieldError } from '../helpers'
import type { ScolaElement } from './element'

export interface ScolaFieldElement extends ScolaElement {
  field: Field

  name: string

  type: string

  value: string

  falsify: () => void

  getError: () => FieldError | null

  isEmpty: () => boolean

  getValue: () => string | null

  reset: () => void

  verify: () => void
}
