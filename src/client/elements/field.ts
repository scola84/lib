import type { FieldValue } from '../helpers'
import type { ScolaElement } from './element'
import type { ScolaError } from '../../common'

export interface ScolaFieldElement extends ScolaElement {
  disabled: boolean

  error?: ScolaError

  name: string

  qualifiedName: string

  type: string

  value: string

  valueAsCast: FieldValue

  falsify: () => void

  reset: () => void

  verify: () => void
}
