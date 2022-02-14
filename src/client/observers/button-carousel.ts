import type { ScolaCarouselElement } from '../elements/carousel'
import type { ScolaElement } from '../elements/element'

export function buttonCarousel (observer: ScolaElement, observable: ScolaCarouselElement): void {
  observer.observer.toggle(observer.dataset.pointer === observable.getAttribute('sc-pointer'))
}
