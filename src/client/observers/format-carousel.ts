import type { ScolaCarouselElement } from '../elements/carousel'
import type { ScolaTextElement } from '../elements/text'

export function formatCarousel (observer: ScolaTextElement, observable: ScolaCarouselElement): void {
  window.requestAnimationFrame(() => {
    observer.dataset.elements = observable.getAttribute('sc-elements') ?? '0'
    observer.dataset.pointer = (Number(observable.getAttribute('sc-pointer') ?? -1) + 1).toString()
    observer.update()
  })
}
