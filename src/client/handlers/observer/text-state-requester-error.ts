import type { ScolaRequesterElement } from '../../elements/requester'
import type { ScolaTextElement } from '../../elements/text'

export function textStateRequesterError (observer: ScolaTextElement, observable: ScolaRequesterElement): void {
  if (observable.hasAttribute('aria-invalid')) {
    observer.data = observable.error
    observer.toggleAttribute('hidden', false)
  } else {
    observer.toggleAttribute('hidden', true)
  }
}
