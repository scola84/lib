import type { ScolaInputElement } from '../../elements/input'
import type { ScolaMediaElement } from '../../elements/media'

export function inputDataMediaTime (observer: ScolaInputElement, observable: ScolaMediaElement): void {
  const data = observable.getData()

  if (data !== null) {
    observer.setAttribute('max', data.duration.toString())

    observer.setData({
      value: data.currentTime
    })
  }
}
