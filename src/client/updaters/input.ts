import type { InputElement } from '../elements/input'
import type { NodeElement } from '../elements'
import type { PropertyValues } from 'lit'
import type { RequestElement } from '../elements/request'
import type { SourceElement } from '../elements/source'
import { isPrimitive } from '../../common'

export default {
  'scola-node-params': (observer: InputElement, observable: NodeElement, properties: PropertyValues): void => {
    if (observer.inputElement instanceof HTMLInputElement) {
      if (properties.has('observe')) {
        observable.setParameters({
          [observer.inputElement.name]: observer.inputElement.value
        })
      } else {
        const value = observable.parameters[observer.inputElement.name]

        if (isPrimitive(value)) {
          observer.inputElement.value = value.toString()
        }
      }
    }
  },
  'scola-node-props': (observer: InputElement, observable: NodeElement, properties: PropertyValues): void => {
    if (observer.inputElement instanceof HTMLInputElement) {
      if (properties.has('observe')) {
        observable.setProperties({
          [observer.inputElement.name]: observer.inputElement.value
        })
      } else {
        const value = observable[observer.inputElement.name as keyof NodeElement]

        if (isPrimitive(value)) {
          observer.inputElement.value = value.toString()
        }
      }
    }
  },
  'scola-request': (observer: InputElement, observable: RequestElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (
        observer.inputElement instanceof HTMLInputElement &&
        observer.inputElement.value !== ''
      ) {
        observable.setParameters({
          [observer.inputElement.name]: observer.inputElement.value
        })
      }
    }
  },
  'scola-source': (observer: InputElement, observable: SourceElement, properties: PropertyValues): void => {
    if (properties.has('data')) {
      observer.data = observable.data
    }
  }
}
