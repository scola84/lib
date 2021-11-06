import type { ScolaCarouselElement } from '../elements/carousel'
import type { ScolaFormatElement } from '../elements/format'

export function formatCarousel (observer: ScolaFormatElement, observable: ScolaCarouselElement): void {
  window.requestAnimationFrame(() => {
    observer.dataset.elements = observable.getAttribute('sc-elements') ?? '0'
    observer.dataset.pointer = (Number(observable.getAttribute('sc-pointer') ?? -1) + 1).toString()
    observer.update()
  })
}
