import type { ScolaInputElement } from '../elements/input'
import type { ScolaTextElement } from '../elements/text'

export function formatInputValue (observer: ScolaTextElement, observable: ScolaInputElement): void {
  observer.setData({
    value: observable.value
  })
}
