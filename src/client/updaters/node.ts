import type { NodeElement } from '../elements'
import type { PropertyValues } from 'lit'
import type { SourceElement } from '../elements/source'

export default {
  'scola-source': (observer: NodeElement, observable: SourceElement, properties: PropertyValues): void => {
    if (properties.has('data')) {
      observer.data = observable.data
    }
  }
}
