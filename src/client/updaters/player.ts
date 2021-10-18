import type { ListElement } from '../elements/list'
import type { PlayerElement } from '../elements'
import type { PropertyValues } from 'lit'

export default {
  'scola-list': (observer: PlayerElement, observable: ListElement, properties: PropertyValues): void => {
    if (properties.has('items')) {
      observer.rewind()
    }
  }
}
