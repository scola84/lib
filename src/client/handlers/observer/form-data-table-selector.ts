import type { ScolaFormElement, ScolaTableElement } from '../../elements'

export function formDataTableSelector (observer: ScolaFormElement, observable: ScolaTableElement): void {
  if (observable.selector?.mode === 'one') {
    const data = observable.selector.firstSelectedRow?.getData()

    if (data !== undefined) {
      observer.setData(data)
    }
  }
}
