import type { ScolaTextElement } from '../elements/text'
import type { ScolaViewElement } from '../elements/view'

export function formatView (observer: ScolaTextElement, observable: ScolaViewElement): void {
  window.requestAnimationFrame(() => {
    observer.dataset.title = observable.firstElementChild?.getAttribute('sc-title') ?? ''
    observer.update()
  })
}
