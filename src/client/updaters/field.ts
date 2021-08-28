import type { FieldElement } from '../elements/field'
import type { NodeElement } from '../elements/node'
import type { PropertyValues } from 'lit'
import type { RequestElement } from '../elements/request'
import { isPrimitive } from '../../common'

export default {
  'scola-node-params': (observer: FieldElement, observable: NodeElement, properties: PropertyValues): void => {
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
  'scola-node-props': (observer: FieldElement, observable: NodeElement, properties: PropertyValues): void => {
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
  'scola-request': (observer: FieldElement, observable: RequestElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (!observer.isEmpty) {
        observable.setParameters({
          [observer.name]: observer.value
        })
      }
    }
  }
}
