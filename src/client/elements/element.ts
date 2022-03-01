import type { ScolaMutator, ScolaObserver, ScolaPropagator } from '../helpers'
import type { Struct } from '../../common'

export interface ScolaElement extends HTMLElement {
  mutator: ScolaMutator

  observer: ScolaObserver

  propagator: ScolaPropagator

  getData: () => Struct | null

  toObject: () => Struct

  setData: (data: unknown) => void

  update: () => void
}
