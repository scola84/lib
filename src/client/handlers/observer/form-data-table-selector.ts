import type { ScolaFormElement, ScolaTableElement } from '../../elements'

export function formDataTableSelector (observer: ScolaFormElement, observable: ScolaTableElement): void {
  if (
    observable.selector?.mode === 'one' &&
    observable.selector.firstSelectedRow?.data !== undefined
  ) {
    observer.data = observable.selector.firstSelectedRow.data
  }
}
