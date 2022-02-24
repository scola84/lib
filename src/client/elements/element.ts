import type { ScolaMutator } from '../helpers/mutator'
import type { ScolaObserver } from '../helpers/observer'
import type { ScolaPropagator } from '../helpers/propagator'

export interface ScolaElement extends HTMLElement {
  mutator: ScolaMutator

  observer: ScolaObserver

  propagator: ScolaPropagator

  getData: () => unknown

  isSame: (data: unknown) => unknown

  setData: (data: unknown) => void

  update: () => void
}
