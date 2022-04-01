import type { Field, FieldData, FieldValue } from '../helpers'
import type { ScolaElement } from './element'
import type { ScolaError } from '../../common'

export interface ScolaFieldElement extends ScolaElement {
  field: Field

  name: string

  type: string

  value: string

  falsify: () => void

  getError: () => ScolaError | null

  isEmpty: () => boolean

  getData: () => FieldData

  getValue: () => FieldValue

  reset: () => void

  verify: () => void
}
