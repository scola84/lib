import type { ScolaTableElement } from '../elements/table'
import type { ScolaViewElement } from '../elements/view'

export function tableView (observer: ScolaTableElement, observable: ScolaViewElement): void {
  observer.list.clearItems()
  observer.select?.clearRows()

  observable.views.forEach((view) => {
    observer.addItem(view)
    view.selected = view === observable.view
  })

  observer.updateBody()
  observer.updateAttributes()

  window.requestAnimationFrame(() => {
    observer.select?.scrollTo()
  })
}
