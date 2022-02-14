import type { ScolaMutator } from '../helpers/mutator'
import type { ScolaObserver } from '../helpers/observer'
import type { ScolaPropagator } from '../helpers/propagator'

export interface ScolaElement extends HTMLElement {
  data?: unknown

  mutator: ScolaMutator

  observer: ScolaObserver

  propagator: ScolaPropagator

  getData: () => unknown

  reset: () => void

  setData: (data: unknown) => void

  update: () => void
}
