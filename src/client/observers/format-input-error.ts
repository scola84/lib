import type { ScolaInputElement } from '../elements/input'
import type { ScolaTextElement } from '../elements/text'

export function formatInputError (observer: ScolaTextElement, observable: ScolaInputElement): void {
  if (observable.error === undefined) {
    observer.hidden = true
  } else {
    observer.hidden = false
    observer.setData(observable.error.data)
    observer.setAttribute('sc-code', String(observable.error.code))
  }
}
