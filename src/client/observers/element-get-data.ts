import type { ScolaElement } from '../elements/element'

export function elementGetData (observer: ScolaElement, observable: ScolaElement): void {
  window.requestAnimationFrame(() => {
    const data = observable.getData()

    if (data !== null) {
      observer.setData(data)
    }
  })
}
