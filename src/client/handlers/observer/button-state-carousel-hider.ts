import type { ScolaButtonElement } from '../../elements/button'
import type { ScolaCarouselElement } from '../../elements/carousel'
import type { Struct } from '../../../common'

export function buttonStateCarouselHider (observer: ScolaButtonElement, observable: ScolaCarouselElement, query: Struct): void {
  const hasState = (
    query.pointer === observable.pointer &&
    observable.parentElement?.hasAttribute('hidden') === false
  )

  observer.observer.toggleState(hasState)

  if (hasState) {
    observer.dataset.hidden = 'true'
  } else {
    observer.dataset.hidden = 'false'
  }
}
