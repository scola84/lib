import type { FormatElement } from '../elements/format'
import type { PropertyValues } from 'lit'
import type { SourceElement } from '../elements/source'
import type { ViewElement } from '../elements/view'

export default {
  'scola-source': (observer: FormatElement, observable: SourceElement, properties: PropertyValues): void => {
    if (properties.has('data')) {
      observer.data = observable.data
    }
  },
  'scola-view': (observer: FormatElement, observable: ViewElement): void => {
    observer.data = {
      title: observable.view?.element?.viewTitle
    }
  }
}
