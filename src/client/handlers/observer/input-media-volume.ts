import type { ScolaInputElement } from '../../elements/input'
import type { ScolaMediaElement } from '../../elements/media'

export function inputMediaVolume (observer: ScolaInputElement, observable: ScolaMediaElement): void {
  const data = observable.getData()

  if (data !== null) {
    if (data.muted) {
      observer.setData({
        value: '0'
      })
    } else {
      observer.setData({
        value: data.volume
      })
    }
  }
}
