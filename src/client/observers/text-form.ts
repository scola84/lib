import type { ScolaFormElement } from '../elements/form'
import type { ScolaTextElement } from '../elements/text'

export function textForm (observer: ScolaTextElement, observable: ScolaFormElement): void {
  if (!observable.hasAttribute('hidden')) {
    observer.setData(observable.getData())
  }
}
