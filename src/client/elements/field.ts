import type { Field, FieldValue } from '../helpers'
import type { ScolaElement } from './element'
import type { ScolaError } from '../../common'

export interface ScolaFieldElement extends ScolaElement {
  disabled: boolean

  error?: ScolaError

  field: Field

  isEmpty: boolean

  name: string

  required: boolean

  type: string

  value: string

  valueAsCast: FieldValue

  falsify: () => void

  reset: () => void

  verify: () => void
}
