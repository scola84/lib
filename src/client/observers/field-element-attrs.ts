import type { ScolaElement } from '../elements/element'
import type { ScolaFieldElement } from '../elements/field'

export function fieldElementAttrs (observer: ScolaFieldElement, observable: ScolaElement): void {
  const value = observable.getAttribute(observer.name)

  if (value !== null) {
    observer.setAttribute('value', value)
  }
}
