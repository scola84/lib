import type { ScolaElement } from './element'
import type { ScolaField } from '../helpers/field'

export interface ScolaFieldElement extends ScolaElement {
  field: ScolaField

  name: string

  type: string

  value: string

  clear: () => void
}
