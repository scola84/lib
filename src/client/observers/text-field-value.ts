import type { ScolaFieldElement } from '../elements/field'
import type { ScolaTextElement } from '../elements/text'

export function textFieldValue (observer: ScolaTextElement, observable: ScolaFieldElement): void {
  observer.setData({
    value: observable.value
  })
}
