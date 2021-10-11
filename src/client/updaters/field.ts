import type { FieldElement } from '../elements/field'
import type { NodeElement } from '../elements/node'
import type { PropertyValues } from 'lit'
import { isPrimitive } from '../../common'

export default {
  'scola-field-params': (observer: FieldElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (!observer.isEmpty) {
        observable.setParameters({
          [observer.name]: observer.value
        })
      }
    } else {
      const value = observable.parameters[observer.name]

      if (isPrimitive(value)) {
        observer.setValueFromPrimitive(value)
      }
    }
  },
  'scola-field-props': (observer: FieldElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (!observer.isEmpty) {
        observable.setProperties({
          [observer.name]: observer.value
        })
      }
    } else {
      const value = observable[observer.name as keyof NodeElement]

      if (isPrimitive(value)) {
        observer.setValueFromPrimitive(value)
      }
    }
  }
}
