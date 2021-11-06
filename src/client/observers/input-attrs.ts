import type { ScolaElement } from '../elements/element'
import type { ScolaInputElement } from '../elements/input'

export function inputAttrs (observer: ScolaInputElement, observable: ScolaElement): void {
  const value = observable.getAttribute(observer.name)

  if (value !== null) {
    observer.setAttribute('value', value)
  }
}
