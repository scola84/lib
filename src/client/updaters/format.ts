import type { InputElement, MediaElement, RecorderElement } from '../elements'
import { Duration } from 'luxon'
import type { FormatElement } from '../elements/format'
import type { PropertyValues } from 'lit'
import type { ViewElement } from '../elements/view'

export default {
  'scola-input': (observer: FormatElement, observable: InputElement): void => {
    if (observable.isEmpty) {
      observer.data = {}
    } else {
      observer.data = {
        value: observable.value
      }
    }
  },
  'scola-media': (observer: FormatElement, observable: MediaElement, properties: PropertyValues): void => {
    if (
      properties.has('length') ||
      properties.has('time')
    ) {
      observer.data = {
        length: Duration
          .fromMillis(observable.length * 1000)
          .toFormat(observable.format),
        time: Duration
          .fromMillis(observable.time * 1000)
          .toFormat(observable.format)
      }
    }
  },
  'scola-recorder': (observer: FormatElement, observable: RecorderElement, properties: PropertyValues): void => {
    if (
      properties.has('length') ||
      properties.has('time')
    ) {
      if (observable.length === 0) {
        observer.data = {}
      } else {
        observer.data = {
          length: Duration
            .fromMillis(observable.length * 1000)
            .toFormat(observable.format)
        }
      }
    }
  },
  'scola-view': (observer: FormatElement, observable: ViewElement): void => {
    observer.data = {
      title: observable.view?.element?.viewTitle
    }
  }
}
