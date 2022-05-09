import type { ScolaElement } from '../../elements'
import type { ScolaRequesterElement } from '../../elements/requester'
import type { Struct } from '../../../common'
import { isError } from '../../../common'

export function elementStateRequesterState (observer: ScolaElement, observable: ScolaRequesterElement, query: Struct): void {
  if (query['aria-invalid'] === true) {
    const error = observable.errorData ?? observable.error

    if (
      observable.getAttribute('aria-invalid') === 'true' &&
      isError(error)
    ) {
      observer.toggleAttribute('hidden', false)
      observer.data = error
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
