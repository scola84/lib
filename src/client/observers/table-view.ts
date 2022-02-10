import type { ScolaTableElement } from '../elements/table'
import type { ScolaViewElement } from '../elements/view'

export function tableView (observer: ScolaTableElement, observable: ScolaViewElement): void {
  const focus = (
    document.activeElement !== document.body &&
    document.activeElement !== null
  )

  observer.lister.clearItems()
  observer.selector?.clearRows()

  let key: unknown = null

  observable.views.forEach((view) => {
    observer.addItem(view)

    if (view === observable.view) {
      key = view[observer.lister.key]
    }
  })

  observer.updateBody()
  observer.updateAttributes()

  const element = observer.elements.get(key)

  if (element !== undefined) {
    observer.selector?.addRow(element)

    if (focus) {
      element.focus()
    }
  }

  window.requestAnimationFrame(() => {
    observer.selector?.scrollTo()
  })
}
