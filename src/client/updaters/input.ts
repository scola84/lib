import type { InputElement } from '../elements/input'
import type { NodeElement } from '../elements'
import type { PropertyValues } from 'lit'
import type { RequestElement } from '../elements/request'
import { isPrimitive } from '../../common'

export default {
  'scola-node-params': (observer: InputElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      observable.setParameters({
        [observer.name]: observer.value
      })
    } else {
      const value = observable.parameters[observer.name]

      if (isPrimitive(value)) {
        observer.value = value.toString()
      }
    }
  },
  'scola-node-props': (observer: InputElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      observable.setProperties({
        [observer.name]: observer.value
      })
    } else {
      const value = observable[observer.name as keyof NodeElement]

      if (isPrimitive(value)) {
        observer.value = value.toString()
      }
    }
  },
  'scola-request': (observer: InputElement, observable: RequestElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (!observer.isEmpty) {
        observable.setParameters({
          [observer.name]: observer.value
        })
      }
    }
  }
}
