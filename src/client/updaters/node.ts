import type { NodeElement } from '../elements'
import type { PropertyValues } from 'lit'
import type { SourceElement } from '../elements/source'

export default {
  'scola-node-data': (observer: NodeElement, observable: NodeElement): void => {
    observer.toggleStateFromData(observable)
  },
  'scola-node-params': (observer: NodeElement, observable: NodeElement): void => {
    observer.toggleStateFromParameters(observable)
  },
  'scola-node-props': (observer: NodeElement, observable: NodeElement): void => {
    observer.toggleStateFromProperties(observable)
  },
  'scola-source': (observer: NodeElement, observable: SourceElement, properties: PropertyValues): void => {
    if (properties.has('data')) {
      observer.data = observable.data
    }
  }
}
