import type { ScolaTableElement } from '../../elements/table'
import type { ScolaTableRowElement } from '../../elements/table-row'
import { isStruct } from '../../../common'

export function tableSelectorTableLister (observer: ScolaTableRowElement, observable: ScolaTableElement): void {
  window.requestAnimationFrame(() => {
    if (isStruct(observer.data)) {
      const parent = observer.closest<ScolaTableElement>('[is="sc-table"]')

      if (parent !== null) {
        const index = observable.lister.findIndex(observer.data[parent.lister.pkey])

        if (index > -1) {
          parent.selector?.addRow(observer)
        }
      }
    }
  })
}
