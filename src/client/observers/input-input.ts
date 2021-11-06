import type { ScolaInputElement } from '../elements/input'

export function inputInput (observer: ScolaInputElement, observable: ScolaInputElement): void {
  observer.setData(observable.value)
}
