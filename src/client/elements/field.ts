import type { ScolaField, ScolaFieldError } from '../helpers/field'
import type { ScolaElement } from './element'

export interface ScolaFieldElement extends ScolaElement {
  field: ScolaField

  name: string

  type: string

  value: string

  clear: () => void

  getError: () => ScolaFieldError | null
}
