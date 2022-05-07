import type { ScolaElement } from '../../elements'
import type { ScolaRequesterElement } from '../../elements/requester'
import type { Struct } from '../../../common'

export function elementStateRequesterState (observer: ScolaElement, observable: ScolaRequesterElement, query: Struct): void {
  if (query['aria-invalid'] === true) {
    if (observable.getAttribute('aria-invalid') === 'true') {
      observer.toggleAttribute('hidden', false)
      observer.data = observable.errorData ?? observable.error
    } else {
      observer.toggleAttribute('hidden', true)
    }
  } else if (query['aria-invalid'] === false) {
    if (observable.getAttribute('aria-invalid') === 'false') {
      observer.toggleAttribute('hidden', false)
      observer.data = observable.result
    } else {
      observer.toggleAttribute('hidden', true)
    }
  }
}
