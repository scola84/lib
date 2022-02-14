import type { ScolaInputElement } from '../elements/input'
import type { ScolaMediaElement } from '../elements/media'

export function inputRangeMedia (observer: ScolaInputElement, observable: ScolaMediaElement): void {
  const value = observable.getAttribute(`sc-${observer.name}`)

  if (value !== null) {
    observer.setData({
      value
    })
  }

  if (
    observer.name === 'time' &&
    !Number.isNaN(observable.duration)
  ) {
    observer.setAttribute('max', Math.round(observable.duration * 1000).toString())
  }

  if (
    observer.name === 'volume' &&
    observable.muted
  ) {
    observer.setData({
      value: '0'
    })
  }
}
