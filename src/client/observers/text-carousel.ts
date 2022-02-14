import type { ScolaCarouselElement } from '../elements/carousel'
import type { ScolaTextElement } from '../elements/text'

export function textCarousel (observer: ScolaTextElement, observable: ScolaCarouselElement): void {
  observer.setData({
    elements: observable.getAttribute('sc-elements') ?? '0',
    pointer: (Number(observable.getAttribute('sc-pointer') ?? -1) + 1).toString()
  })
}
