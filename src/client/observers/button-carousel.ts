import type { ScolaButtonElement } from '../elements/button'
import type { ScolaCarouselElement } from '../elements/carousel'

export function buttonCarousel (observer: ScolaButtonElement, observable: ScolaCarouselElement): void {
  observer.toggleAttribute(
    observer.getAttribute('sc-observe-state') ?? '',
    observer.dataset.pointer === observable.getAttribute('sc-pointer')
  )
}
