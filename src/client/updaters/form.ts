import type { FormElement } from '../elements/form'
import type { PropertyValues } from 'lit'
import type { SourceElement } from '../elements/source'

export default {
  'scola-source': (observer: FormElement, observable: SourceElement, properties: PropertyValues): void => {
    if (properties.has('data')) {
      observer.data = observable.data
    }
  }
}
