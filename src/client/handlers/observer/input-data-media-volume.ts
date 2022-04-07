import type { ScolaInputElement } from '../../elements/input'
import type { ScolaMediaElement } from '../../elements/media'

export function inputDataMediaVolume (observer: ScolaInputElement, observable: ScolaMediaElement): void {
  if (observable.muted) {
    observer.data = {
      value: 0
    }
  } else {
    observer.data = {
      value: observable.volume
    }
  }
}
