import type { ScolaTableElement } from '../elements/table'
import { ScolaTableRowElement } from '../elements/table-row'
import type { ScolaViewElement } from '../elements/view'

export function tableView (observer: ScolaTableElement, observable: ScolaViewElement): void {
  const focus = (
    document.activeElement !== document.body &&
    document.activeElement !== null
  )

  observer.list.clearItems()
  observer.select?.clearRows()

  observable.views.forEach((view) => {
    observer.addItem(view)
  })

  observer.updateBody()
  observer.updateAttributes()

  observer.elements.forEach((row) => {
    if (
      row instanceof ScolaTableRowElement &&
      row.datamap === observable.view
    ) {
      observer.select?.addRow(row, focus)
    }
  })

  window.requestAnimationFrame(() => {
    observer.select?.scrollTo()
  })
}
