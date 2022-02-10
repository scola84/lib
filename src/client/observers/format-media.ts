import type { ScolaAudioElement } from '../elements/audio'
import type { ScolaTextElement } from '../elements/text'
import type { ScolaVideoElement } from '../elements/video'

export function formatMedia (observer: ScolaTextElement, observable: ScolaAudioElement | ScolaVideoElement): void {
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
