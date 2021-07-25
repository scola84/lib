import type { ProgressElement } from '../elements/progress'
import type { PropertyValues } from 'lit'
import type { RequestElement } from '../elements/request'

export default {
  'scola-request': (observer: ProgressElement, observable: RequestElement, properties: PropertyValues): void => {
    if (
      properties.has('busy') ||
      properties.has('loaded')
    ) {
      observer.updateRequest(observable).catch(() => {})
    }
  }
}
