import type { ScolaMutator } from '../helpers/mutator'
import type { ScolaObserver } from '../helpers/observer'
import type { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export interface ScolaElement extends HTMLElement {
  datamap?: Struct

  mutator: ScolaMutator

  observer: ScolaObserver

  propagator: ScolaPropagator

  reset: () => void

  getData: () => unknown

  setData: (data: unknown) => void

  update: () => void
}
