import { ClipElement } from '../elements/clip'
import type { NodeElement } from '../elements/node'
import type { PropertyValues } from 'lit'
import type { SelectElement } from '../elements/select'

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
  'scola-select': (observer: SelectElement, observable: SelectElement, properties: PropertyValues): void => {
    if (properties.has('checked')) {
      observer.toggleChecked(observable.checked).catch(() => {})
    }
  }
}
