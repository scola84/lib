import type { ScolaElement } from '../../elements'
import type { ScolaRequesterElement } from '../../elements/requester'

export function elementStateRequesterState (observer: ScolaElement, observable: ScolaRequesterElement): void {
  if (observer.getAttribute('data-aria-invalid') === 'true') {
    if (observable.getAttribute('aria-invalid') === 'true') {
      observer.toggleAttribute('hidden', false)
      observer.data = observable.errorData ?? observable.error
    } else {
      observer.toggleAttribute('hidden', true)
    }
  } else if (observer.getAttribute('data-aria-invalid') === 'false') {
    if (observable.getAttribute('aria-invalid') === 'false') {
      observer.toggleAttribute('hidden', false)
      observer.data = observable.result
    } else {
      observer.toggleAttribute('hidden', true)
    }
  }
}
