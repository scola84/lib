import type { ScolaTableElement } from '../elements/table'
import type { ScolaTableRowElement } from '../elements/table-row'

export function tableRowTable (observer: ScolaTableRowElement, observable: ScolaTableElement): void {
  const parent = observer.closest<ScolaTableElement>('[is="sc-table"]')

  if (parent !== null) {
    const index = observable.lister.items.findIndex((findItem) => {
      return observer.datamap[parent.lister.key] === findItem[observable.lister.key]
    })

    if (index > -1) {
      parent.selector?.addRow(observer)
    }
  }
}
