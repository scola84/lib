import type { ScolaButtonElement } from '../elements/button'
import type { ScolaViewElement } from '../elements/view'

export function buttonView (observer: ScolaButtonElement, observable: ScolaViewElement): void {
  observer.toggleAttribute(
    observer.getAttribute('sc-observe-state') ?? '',
    observable.isSame(observer.getData(), observable.view)
  )
}
