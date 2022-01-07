import type { ScolaTableElement } from '../elements/table'
import type { ScolaViewElement } from '../elements/view'

export function tableView (observer: ScolaTableElement, observable: ScolaViewElement): void {
  observer.list.clear()
  observer.select?.clear()

  observable.views.forEach((view) => {
    observer.add(view)
    view.selected = view === observable.view
  })

  observer.updateBody()
  observer.updateAttributes()

  window.requestAnimationFrame(() => {
    observer.select?.scrollTo()
  })
}
