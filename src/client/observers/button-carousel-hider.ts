import type { ScolaButtonElement } from '../elements/button'
import type { ScolaCarouselElement } from '../elements/carousel'

export function buttonCarouselHider (observer: ScolaButtonElement, observable: ScolaCarouselElement): void {
  const isActive = (
    observer.dataset.pointer === observable.getAttribute('sc-pointer') &&
    observable.parentElement?.hasAttribute('hidden') === false
  )

  observer.toggleAttribute(observer.getAttribute('sc-observe-state') ?? '', isActive)

  if (isActive) {
    observer.dataset.hidden = 'true'
  } else {
    observer.dataset.hidden = 'false'
  }
}
