import type { ProgressElement } from '../elements/progress'
import type { PropertyValues } from 'lit'
import type { RequestElement } from '../elements/request'

export default {
  'scola-request': (observer: ProgressElement, observable: RequestElement, properties: PropertyValues): void => {
    if ((
      properties.has('busy') ||
      properties.has('loaded')
    ) && (
      observer.method === undefined ||
      observer.method === observable.request?.method
    )) {
      if (
        observable.loaded === observer.loaded &&
        observable.total === observer.loaded
      ) {
        observer.loaded = 1
        observer.total = 1
      } else {
        observer.loaded = observable.loaded
        observer.total = observable.total
      }
    }
  }
}
