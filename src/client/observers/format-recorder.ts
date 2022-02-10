import type { ScolaRecorderElement } from '../elements/recorder'
import type { ScolaTextElement } from '../elements/text'

export function formatRecorder (observer: ScolaTextElement, observable: ScolaRecorderElement): void {
  observer.setData({
    length: new Date(Number(observable.getAttribute('sc-duration') ?? 0))
  })
}
