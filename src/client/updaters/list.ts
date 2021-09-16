import type { DialogElement } from '../elements/dialog'
import type { ListElement } from '../elements/list'
import type { PropertyValues } from 'lit'

export default {
  'scola-dialog': (observer: ListElement, observable: DialogElement, properties: PropertyValues): void => {
    if (properties.has('hidden')) {
      window.requestAnimationFrame(() => {
        if (!observable.hidden) {
          observer.start()
        }
      })
    }
  }
}
