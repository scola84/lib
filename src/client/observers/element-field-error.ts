import type { ScolaElement } from '../elements/element'
import type { ScolaFieldElement } from '../elements/field'

export function elementFieldError (observer: ScolaElement, observable: ScolaFieldElement): void {
  window.requestAnimationFrame(() => {
    const error = observable.getError()

    if (error !== null) {
      observer.setData(error)
    }
  })
}
