import type { ScolaFormatElement } from '../elements/format'
import type { ScolaViewElement } from '../elements/view'

export function formatView (observer: ScolaFormatElement, observable: ScolaViewElement): void {
  window.requestAnimationFrame(() => {
    observer.dataset.title = observable.firstElementChild?.getAttribute('sc-title') ?? ''
    observer.update()
  })
}
