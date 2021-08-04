import type { PropertyValues } from 'lit'
import type { SourceElement } from '../elements/source'
import type { SvgElement } from '../elements'

export default {
  'scola-source': (observer: SvgElement, observable: SourceElement, properties: PropertyValues): void => {
    if (properties.has('data')) {
      observer.data = observable.data
    }
  }
}
