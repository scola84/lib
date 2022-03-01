import type { ScolaButtonElement } from '../../elements/button'
import type { ScolaCarouselElement } from '../../elements/carousel'

export function buttonCarouselHider (observer: ScolaButtonElement, observable: ScolaCarouselElement): void {
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