import type { ScolaTableElement } from '../../elements/table'
import type { ScolaViewElement } from '../../elements/view'

export function tableRowsView (observer: ScolaTableElement, observable: ScolaViewElement): void {
  const focus = (
    document.activeElement !== document.body &&
    document.activeElement !== null
  )

  observer.lister.clear()
  observer.selector?.clear()

  let key: unknown = null

  observable.views.forEach((view) => {
    observer.add(view)

    if (view === observable.view) {
      key = view[observer.lister.pkey]
    }
  })

  observer.updateElements()
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
