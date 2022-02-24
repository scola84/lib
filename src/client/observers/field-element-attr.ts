import type { ScolaElement } from '../elements/element'
import type { ScolaFieldElement } from '../elements/field'

export function fieldElementAttr (observer: ScolaFieldElement, observable: ScolaElement): void {
  observer.setData({
    value: observable.getAttribute(observer.name)
  })
}
