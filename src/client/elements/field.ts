import type { Field, FieldData, FieldValue } from '../helpers'
import type { ScolaElement } from './element'
import type { ScolaError } from '../../common'

export interface ScolaFieldElement extends ScolaElement {
  disabled: boolean

  field: Field

  name: string

  required: boolean

  type: string

  value: string

  falsify: () => void

  getError: () => ScolaError | null

  isEmpty: () => boolean

  getData: () => FieldData

  getValue: () => FieldValue

  reset: () => void

  setValue: (value: unknown) => void

  verify: () => void
}
