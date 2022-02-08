import { ScolaSelect } from './select'
import { isArray } from '../../common'

export class ScolaSelectTree extends ScolaSelect {
  protected dispatch (on: string, event?: Event): void {
    const items = this.getItemsByRow()

    if (items.length === 1) {
      const [item] = items

      if (typeof item.type === 'string') {
        this.element.propagator.dispatch(`${on}${item.type}`, items, event)
      }
    }

    super.dispatch(on, event)
  }

  protected handleInteractClickMouse (event: MouseEvent): boolean {
    const row = this.determineRow(event)

    if (row !== null) {
      if (
        !event.ctrlKey &&
        !event.shiftKey &&
        this.rows.length === 1
      ) {
        if (isArray(row.datamap.items)) {
          row.datamap.open = row.datamap.open !== true
          this.element.update()
          this.updateRow(row, true, true)
        }
      }
    }

    return super.handleInteractClickMouse(event)
  }

  protected handleInteractClickTouch (event: TouchEvent): boolean {
    const row = this.determineRow(event)

    if (row !== null) {
      if (isArray(row.datamap.items)) {
        row.datamap.open = row.datamap.open !== true
        this.element.update()
        this.updateRow(row, true, true)
      }
    }

    return super.handleInteractClickTouch(event)
  }

  protected handleInteractStartKeyboard (event: KeyboardEvent): boolean {
    if (
      this.rows.length === 1 &&
      this.lastSelectedRow !== undefined &&
      this.lastSelectedRow.datamap.type === 'node'
    ) {
      if (
        event.code === 'Enter' ||
        event.code === 'Space'
      ) {
        this.lastSelectedRow.datamap.open = this.lastSelectedRow.datamap.open !== true
        this.element.update()
        this.updateRow(this.lastSelectedRow, true, true)
      }
    }

    return super.handleInteractStartKeyboard(event)
  }

  protected handleInteractStartKeyboardDefault (event: KeyboardEvent): boolean {
    if (
      this.rows.length === 1 &&
      this.lastSelectedRow !== undefined &&
      this.lastSelectedRow.datamap.type === 'node'
    ) {
      if (this.interact.isArrowEnd(event)) {
        if (this.lastSelectedRow.datamap.open !== true) {
          this.lastSelectedRow.datamap.open = true
          this.element.update()
          this.updateRow(this.lastSelectedRow, true, true)
          return true
        }
      } else if (this.interact.isArrowStart(event)) {
        if (this.lastSelectedRow.datamap.open === true) {
          this.lastSelectedRow.datamap.open = false
          this.element.update()
          this.updateRow(this.lastSelectedRow, true, true)
          return true
        }
      }
    }

    return super.handleInteractStartKeyboardDefault(event)
  }
}
