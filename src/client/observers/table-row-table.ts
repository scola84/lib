import type { ScolaTableElement } from '../elements/table'
import type { ScolaTableRowElement } from '../elements/table-row'

export function tableRowTable (observer: ScolaTableRowElement, observable: ScolaTableElement): void {
  const parent = observer.closest<ScolaTableElement>('[is="sc-table"]')

  if (parent !== null) {
    const index = observable.list.items.findIndex((findItem) => {
      return observer.datamap[parent.list.key] === findItem[observable.list.key]
    })

    if (index > -1) {
      parent.select?.addRow(observer)
    }
  }
}
