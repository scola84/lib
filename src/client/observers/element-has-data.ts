import type { ScolaElement } from '../elements/element'

export function elementHasData (observer: ScolaElement, observable: ScolaElement): void {
  observer.observer.toggle(observable.isSame(observer.getData()) === true)
}
