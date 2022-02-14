import type { ScolaElement } from '../elements/element'
import type { ScolaViewElement } from '../elements/view'

export function buttonView (observer: ScolaElement, observable: ScolaViewElement): void {
  observer.observer.toggle(observable.isSame(observer.getData(), observable.view))
}
