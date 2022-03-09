import type { Mutator, Observer, Propagator } from '../helpers'
import type { Struct } from '../../common'

export interface ScolaElement extends HTMLElement {
  mutator: Mutator

  observer: Observer

  propagator: Propagator

  getData: () => Struct | null

  toObject: () => Struct

  setData: (data: unknown) => void

  update: () => void
}
