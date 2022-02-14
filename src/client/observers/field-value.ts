import type { ScolaFieldElement } from '../elements/field'

export function fieldValue (observer: ScolaFieldElement, observable: ScolaFieldElement): void {
  observer.setData(observable.value)
}
