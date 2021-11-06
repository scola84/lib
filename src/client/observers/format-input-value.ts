import type { ScolaFormatElement } from '../elements/format'
import type { ScolaInputElement } from '../elements/input'

export function formatInputValue (observer: ScolaFormatElement, observable: ScolaInputElement): void {
  observer.setData({
    value: observable.value
  })
}
