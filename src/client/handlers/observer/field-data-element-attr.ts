import type { ScolaElement } from '../../elements/element'
import type { ScolaFieldElement } from '../../elements/field'

export function fieldDataElementAttr (observer: ScolaFieldElement, observable: ScolaElement): void {
  observer.data = {
    value: observable.getAttribute(observer.name)
  }
}
