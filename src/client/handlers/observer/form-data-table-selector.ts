import type { ScolaFormElement, ScolaTableElement } from '../../elements'

export function formDataTableSelector (observer: ScolaFormElement, observable: ScolaTableElement): void {
  if (observable.selector?.mode === 'one') {
    observer.data = observable.selector.firstSelectedRow?.data
  }
}
