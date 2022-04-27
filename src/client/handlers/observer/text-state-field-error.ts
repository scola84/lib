import type { ScolaFieldElement } from '../../elements/field'
import type { ScolaTextElement } from '../../elements/text'

export function textStateFieldError (observer: ScolaTextElement, observable: ScolaFieldElement): void {
  if (observable.hasAttribute('aria-invalid')) {
    observer.data = observable.error
    observer.toggleAttribute('hidden', false)
  } else {
    observer.toggleAttribute('hidden', true)
  }
}
