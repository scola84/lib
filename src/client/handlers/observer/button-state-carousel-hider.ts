import type { ScolaButtonElement } from '../../elements/button'
import type { ScolaCarouselElement } from '../../elements/carousel'

export function buttonStateCarouselHider (observer: ScolaButtonElement, observable: ScolaCarouselElement): void {
  const hasState = (
    observer.dataset.pointer === observable.pointer.toString() &&
    observable.parentElement?.hasAttribute('hidden') === false
  )

  observer.observer.toggleState(hasState)

  if (hasState) {
    observer.dataset.hidden = 'true'
  } else {
    observer.dataset.hidden = 'false'
  }
}
