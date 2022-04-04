import type { ScolaCarouselElement } from '../../elements/carousel'
import type { ScolaSelectElement } from '../../elements/select'

export function carouselSelectValue (observer: ScolaCarouselElement, observable: ScolaSelectElement): void {
  observer.go(observer.findPointer(observable.value))
}
