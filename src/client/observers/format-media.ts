import type { ScolaAudioElement } from '../elements/audio'
import type { ScolaFormatElement } from '../elements/format'
import type { ScolaVideoElement } from '../elements/video'

export function formatMedia (observer: ScolaFormatElement, observable: ScolaAudioElement | ScolaVideoElement): void {
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
