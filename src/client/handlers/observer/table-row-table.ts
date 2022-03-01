import type { ScolaTableElement } from '../../elements/table'
import type { ScolaTableRowElement } from '../../elements/table-row'

export function tableRowTable (observer: ScolaTableRowElement, observable: ScolaTableElement): void {
  window.requestAnimationFrame(() => {
    const parent = observer.closest<ScolaTableElement>('[is="sc-table"]')

    if (parent !== null) {
      const index = observable.lister.findIndex(observer.data[parent.lister.key])

      if (index > -1) {
        parent.selector?.addRow(observer)
      }
    }
  })
}
