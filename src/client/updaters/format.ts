import type { FormatElement } from '../elements/format'
import type { InputElement } from '../elements'
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
  'scola-view': (observer: FormatElement, observable: ViewElement): void => {
    observer.data = {
      title: observable.view?.element?.viewTitle
    }
  }
}
