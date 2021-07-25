import type { LogElement } from '../elements/log'
import type { NodeElement } from '../elements/node'
import type { PropertyValues } from 'lit'

export default {
  'scola-node': (observer: LogElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('logs')) {
      observer.updateNode(observable)
    }
  }
}
