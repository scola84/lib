import type { InputElement, RecorderElement } from '../elements'
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
  'scola-recorder': (observer: FormatElement, observable: RecorderElement, properties: PropertyValues): void => {
    if (properties.has('state')) {
      observer.data = {
        ...observable.state
      }
    }
  },
  'scola-view': (observer: FormatElement, observable: ViewElement): void => {
    observer.data = {
      title: observable.view?.element?.viewTitle
    }
  }
}
