import type { MediaElement, SliderElement } from '../elements'
import type { PropertyValues } from 'lit'

export default {
  'scola-media-time': (observer: SliderElement, observable: MediaElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      observable.setTime(Number(observer.value))
    } else if (properties.has('length')) {
      observer.setMax(observable.length ?? 0)
    } else if (properties.has('time')) {
      observer.data = {
        value: observable.time
      }
    }
  },
  'scola-media-volume': (observer: SliderElement, observable: MediaElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      observable.setVolume(Number(observer.value))
    } else if (properties.has('volume')) {
      observer.data = {
        value: observable.volume
      }
    }
  }
}
