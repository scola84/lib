import { ClipElement } from '../elements/clip'
import type { ListElement } from '../elements'
import type { NodeElement } from '../elements/node'
import type { PropertyValues } from 'lit'
import type { SelectElement } from '../elements/select'
import { isObject } from '../../common'

export default {
  'scola-clip': (observer: SelectElement, observable: NodeElement, properties: PropertyValues): void => {
    if (properties.has('observe')) {
      if (
        observer.checked === true &&
        observable.parentElement instanceof ClipElement
      ) {
        observable.parentElement.toggleContentOrInner(observable).catch(() => {})
      }
    } else if (properties.has('hidden')) {
      observer.toggleChecked(!observable.hidden).catch(() => {})
    }
  },
  'scola-list': (observer: SelectElement, observable: ListElement, properties: PropertyValues): void => {
    if (
      properties.has('items') ||
      properties.has('observe')
    ) {
      observer.toggleChecked(observable.items.some((item) => {
        if (isObject(item)) {
          return observable.getKey(observer.data) === observable.getKey(item)
        }

        return false
      })).catch(() => {})
    }
  },
  'scola-select': (observer: SelectElement, observable: SelectElement, properties: PropertyValues): void => {
    if (properties.has('checked')) {
      observer.toggleChecked(observable.checked).catch(() => {})
    }
  }
}
