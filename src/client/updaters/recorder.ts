import type { DialogElement } from '../elements/dialog'
import type { PropertyValues } from 'lit'
import type { RecorderElement } from '../elements'

export default {
  'scola-dialog': (observer: RecorderElement, observable: DialogElement, properties: PropertyValues): void => {
    if (properties.has('hidden')) {
      window.requestAnimationFrame(() => {
        if (observable.hidden) {
          observer.disable()
        } else {
          observer.enable()
        }
      })
    }
  }
}
