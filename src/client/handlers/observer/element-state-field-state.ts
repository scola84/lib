import type { ScolaElement } from '../../elements'
import type { ScolaFieldElement } from '../../elements/field'

export function elementStateFieldState (observer: ScolaElement, observable: ScolaFieldElement): void {
  if (observer.getAttribute('data-aria-invalid') === 'true') {
    if (observable.getAttribute('aria-invalid') === 'true') {
      observer.toggleAttribute('hidden', false)
      observer.data = observable.error
    } else {
      observer.toggleAttribute('hidden', true)
    }
  } else if (observer.getAttribute('data-aria-invalid') === 'false') {
    if (observable.getAttribute('aria-invalid') === 'false') {
      observer.toggleAttribute('hidden', false)
      observer.data = observable.data
    } else {
      observer.toggleAttribute('hidden', true)
    }
  }
}
