import type { ScolaField, ScolaFieldError } from '../helpers'
import type { ScolaElement } from './element'

export interface ScolaFieldElement extends ScolaElement {
  field: ScolaField

  name: string

  type: string

  value: string

  clear: () => void

  falsify: () => void

  getError: () => ScolaFieldError | null

  getValue: () => string | null

  verify: () => void
}
