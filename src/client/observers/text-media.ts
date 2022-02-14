import type { ScolaMediaElement } from '../elements/media'
import type { ScolaTextElement } from '../elements/text'

export function textMedia (observer: ScolaTextElement, observable: ScolaMediaElement): void {
  if (
    !Number.isNaN(observable.duration) &&
    observable.duration !== Infinity
  ) {
    observer.setData({
      length: new Date(observable.duration * 1000),
      time: new Date(observable.currentTime * 1000),
      volume: observable.volume
    })
  }
}
