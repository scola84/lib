import type { ScolaButtonElement } from '../elements/button'
import type { ScolaViewElement } from '../elements/view'

export function buttonView (observer: ScolaButtonElement, observable: ScolaViewElement): void {
  observer.toggleAttribute(
    observer.getAttribute('sc-observe-state') ?? '',
    observable.isSame({
      name: observer.dataset.name ?? '',
      params: Object.fromEntries(new URLSearchParams(observer.dataset.params).entries())
    }, observable.view)
  )
}
