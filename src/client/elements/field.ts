import type { ScolaElement } from './element'
import type { ScolaField } from '../helpers/field'
import type { Struct } from '../../common'

export interface ScolaFieldElement extends ScolaElement {
  error?: Struct

  field: ScolaField

  name: string

  type: string

  value: string

  clear: () => void
}
