import type { ScolaFormatElement } from '../elements/format'
import type { ScolaInputElement } from '../elements/input'

export function formatInputError (observer: ScolaFormatElement, observable: ScolaInputElement): void {
  if (observable.error === undefined) {
    observer.hidden = true
  } else {
    observer.hidden = false
    observer.setData(observable.error.data)
    observer.setAttribute('sc-code', String(observable.error.code))
  }
}
