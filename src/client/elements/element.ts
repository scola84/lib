import type { ScolaMutator } from '../helpers/mutator'
import type { ScolaObserver } from '../helpers/observer'
import type { ScolaPropagator } from '../helpers/propagator'
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
