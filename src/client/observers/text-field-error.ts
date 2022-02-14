import type { ScolaFieldElement } from '../elements/field'
import type { ScolaTextElement } from '../elements/text'

export function textFieldError (observer: ScolaTextElement, observable: ScolaFieldElement): void {
  if (observable.error === undefined) {
    observer.hidden = true
  } else {
    observer.hidden = false
    observer.setData(observable.error.data)
    observer.setAttribute('sc-code', String(observable.error.code))
  }
}
