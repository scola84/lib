import type { ScolaCarouselElement } from '../elements/carousel'
import type { ScolaElement } from '../elements/element'

export function buttonCarouselHider (observer: ScolaElement, observable: ScolaCarouselElement): void {
  const hasState = (
    observer.dataset.pointer === observable.getAttribute('sc-pointer') &&
    observable.parentElement?.hasAttribute('hidden') === false
  )

  observer.observer.toggle(hasState)

  if (hasState) {
    observer.dataset.hidden = 'true'
  } else {
    observer.dataset.hidden = 'false'
  }
}
