import type { ScolaElement } from '../../elements/element'

export function elementDataElementData (observer: ScolaElement, observable: ScolaElement): void {
  window.requestAnimationFrame(() => {
    observer.data = observable.data
  })
}
