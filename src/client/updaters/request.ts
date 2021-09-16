import type { DialogElement } from '../elements/dialog'
import type { PropertyValues } from 'lit'
import type { RequestElement } from '../elements/request'

export default {
  'scola-dialog': (observer: RequestElement, observable: DialogElement, properties: PropertyValues): void => {
    if (properties.has('hidden')) {
      window.requestAnimationFrame(() => {
        if (!observable.hidden) {
          observer.start()
        }
      })
    }
  }
}
