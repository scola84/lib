import type { Mutator, Observer, Propagator } from '../helpers'

export interface ScolaElement extends HTMLElement {
  data: unknown

  mutator: Mutator

  observer: Observer

  propagator: Propagator
}
