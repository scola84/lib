import type { ScolaInputElement } from '../../elements/input'
import type { ScolaMediaElement } from '../../elements/media'

export function inputDataMediaTime (observer: ScolaInputElement, observable: ScolaMediaElement): void {
  observer.setAttribute('max', observable.duration.toString())

  observer.data = {
    value: observable.currentTime
  }
}
