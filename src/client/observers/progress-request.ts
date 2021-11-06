import type { ScolaProgressElement } from '../elements/progress'
import type { ScolaRequestElement } from '../elements/request'

export function progressRequest (observer: ScolaProgressElement, observable: ScolaRequestElement, mutations: MutationRecord[]): void {
  if (mutations.length > 0) {
    const loaded = Number(observable.getAttribute('sc-loaded'))
    const state = Number(observable.getAttribute('sc-state'))
    const total = Number(observable.getAttribute('sc-total'))

    if (
      loaded > 0 &&
      total > 0 &&
      loaded !== total
    ) {
      observer.max = total
      observer.value = loaded
    } else {
      observer.removeAttribute('max')
      observer.removeAttribute('value')
    }

    if (state === 4) {
      observer.hidden = true
    } else {
      observer.hidden = false
    }
  }
}
