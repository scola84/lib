import type { ScolaFormatElement } from '../elements/format'
import type { ScolaRecorderElement } from '../elements/recorder'

export function formatRecorder (observer: ScolaFormatElement, observable: ScolaRecorderElement): void {
  observer.setData({
    length: new Date(Number(observable.getAttribute('sc-duration') ?? 0))
  })
}
