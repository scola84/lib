import { ScolaInteractor } from './interactor'
import type { ScolaInteractorEvent } from './interactor'
import type { ScolaTableElement } from '../elements/table'
import { ScolaTableRowElement } from '../elements/table-row'
import type { Struct } from '../../common'

type Mode = 'many' | 'one' | 'toggle'

export class ScolaTableSelector {
  public all: boolean

  public element: ScolaTableElement

  public firstSelectedRow?: ScolaTableRowElement

  public interactor: ScolaInteractor

  public lastSelectedRow?: ScolaTableRowElement

  public mode: Mode

  public rows: ScolaTableRowElement[] = []

  public get firstRow (): ScolaTableRowElement | undefined {
    return this.rows[0]
  }

  public get lastRow (): ScolaTableRowElement | undefined {
    return this.rows[this.rows.length - 1]
  }

  protected handleInteractorBound = this.handleInteractor.bind(this)

  public constructor (element: ScolaTableElement) {
    this.element = element
    this.interactor = new ScolaInteractor(element.body)
    this.reset()
  }

  public addRow (row: ScolaTableRowElement): void {
    const index = this.rows.findIndex((findRow) => {
      return row === findRow
    })

    if (index === -1) {
      if (this.firstSelectedRow === undefined) {
        this.firstSelectedRow = row
      }

      this.lastSelectedRow = row
      this.rows.push(row)
      this.updateRow(row, true)
      this.sortRows()
    }
  }

  public clearRows (): void {
    this.rows.forEach((row) => {
      this.updateRow(row, false)
    })

    this.firstSelectedRow = undefined
    this.lastSelectedRow = undefined
    this.rows = []
  }

  public connect (): void {
    this.interactor.observe(this.handleInteractorBound)
    this.interactor.connect()
    this.scrollTo()
  }

  public deleteRow (item: Struct): void {
    const index = this.rows.findIndex((findRow) => {
      return item[this.element.lister.key] === findRow.datamap[this.element.lister.key]
    })

    if (index > -1) {
      const row = this.rows[index]

      if (row === this.firstSelectedRow) {
        this.firstSelectedRow = undefined
      }

      if (row === this.lastSelectedRow) {
        this.lastSelectedRow = undefined
      }

      this.rows.splice(index, 1)

      if (
        this.firstSelectedRow === undefined &&
        this.lastSelectedRow === undefined
      ) {
        if (row.previousElementSibling instanceof ScolaTableRowElement) {
          this.selectRows(row.previousElementSibling)
        } else if (row.nextElementSibling instanceof ScolaTableRowElement) {
          this.selectRows(row.nextElementSibling)
        }
      }
    }
  }

  public disconnect (): void {
    this.interactor.disconnect()
  }

  public getItemsByRow (): Struct[] {
    return this.rows.map((row) => {
      return row.datamap
    })
  }

  public getKeysByRow (): unknown[] {
    return this.rows.map((row) => {
      return row.datamap[this.element.lister.key]
    })
  }

  public reset (): void {
    this.all = this.element.hasAttribute('sc-select-all')
    this.interactor.keyboard = this.interactor.hasKeyboard
    this.interactor.mouse = this.interactor.hasMouse
    this.interactor.touch = this.interactor.hasTouch
    this.mode = (this.element.getAttribute('sc-select-mode') as Mode | null) ?? 'one'
  }

  public scrollTo (): void {
    if (this.lastSelectedRow !== undefined) {
      const {
        offsetHeight: bodyHeight,
        offsetLeft: bodyLeft,
        offsetTop: bodyTop,
        offsetWidth: bodyWidth,
        scrollLeft: bodyScrollLeft,
        scrollTop: bodyScrollTop
      } = this.element.body

      const {
        offsetHeight: rowHeight,
        offsetLeft: rowLeft,
        offsetTop: rowTop,
        offsetWidth: rowWidth
      } = this.lastSelectedRow

      let left = bodyScrollLeft
      let top = bodyScrollTop

      if ((rowTop - bodyTop + rowHeight) > (bodyScrollTop + bodyHeight)) {
        top = rowTop - bodyTop + rowHeight - bodyHeight
      } else if ((rowTop - bodyTop) < bodyScrollTop) {
        top = rowTop - bodyTop
      }

      if ((rowLeft - bodyLeft + rowWidth) > (bodyScrollLeft + bodyWidth)) {
        left = rowLeft - bodyLeft + rowWidth - bodyWidth
      } else if ((rowLeft - bodyLeft) < bodyScrollLeft) {
        left = rowLeft - bodyLeft
      }

      this.element.body.scrollTo({
        left,
        top
      })
    }
  }

  public toggle (row: ScolaTableRowElement): void {
    const index = this.rows.findIndex((findRow) => {
      return row === findRow
    })

    if (index > -1) {
      if (this.firstSelectedRow === row) {
        this.firstSelectedRow = undefined
      }

      if (this.lastSelectedRow === row) {
        this.lastSelectedRow = undefined
      }

      this.rows.splice(index, 1)
      this.updateRow(row, false)
    } else {
      if (this.firstSelectedRow === undefined) {
        this.firstSelectedRow = row
      }

      this.lastSelectedRow = row
      this.rows.push(row)
      this.updateRow(row, true)
      this.sortRows()
    }
  }

  public toggleAll (force: boolean): void {
    this.clearRows()

    if (force) {
      this.element.body.childNodes.forEach((row) => {
        if (row instanceof ScolaTableRowElement) {
          if (this.firstSelectedRow === undefined) {
            this.firstSelectedRow = row
          }

          this.lastSelectedRow = row
          this.rows.push(row)
          this.updateRow(row, true)
        }
      })
    }
  }

  protected calculatePageSize (): number {
    return this.element.body.clientHeight / (this.element.body.firstElementChild?.clientHeight ?? 16)
  }

  protected determineRow (event: Event): ScolaTableRowElement | null {
    if (event.target instanceof HTMLElement) {
      const row = event.target.closest<ScolaTableRowElement>('tr')

      if (
        row?.hasAttribute('sc-selectable') === true ||
        event.target.closest('[sc-handle="select"]') !== null
      ) {
        return row
      }
    }

    return null
  }

  protected dispatch (on: string, event?: Event): void {
    const items = this.getItemsByRow()
    const keys = this.getKeysByRow()

    if (items.length === 1) {
      const [item] = items

      this.element.propagator.dispatch(on, items, event)

      if (this.element.tree !== undefined) {
        this.element.propagator.dispatch(`${on}${String(item.type)}`, items, event)
      }
    }

    this.element.propagator.dispatch(`${on}item`, items, event)
    this.element.propagator.dispatch(`${on}items`, [{ items }], event)
    this.element.propagator.dispatch(`${on}key`, keys, event)
    this.element.propagator.dispatch(`${on}keys`, [{ keys }], event)
  }

  protected findNext (row?: ScolaTableRowElement, count = 1): ScolaTableRowElement | null {
    if (row?.parentElement instanceof HTMLElement) {
      let next: Element | null = null
      let index = Array.prototype.indexOf.call(row.parentElement.children, row)

      if (
        index === 0 &&
        count > 1
      ) {
        index -= 1
      }

      if (
        count === Infinity ||
        index + count > row.parentElement.children.length
      ) {
        next = row.parentElement.lastElementChild
      } else {
        next = row.parentElement.children.item(index + count)
      }

      if (next instanceof ScolaTableRowElement) {
        return next
      }
    }

    return null
  }

  protected findPrevious (row?: ScolaTableRowElement, count = 1): ScolaTableRowElement | null {
    if (row?.parentElement instanceof HTMLElement) {
      let next: Element | null = null

      const index = Array.prototype.indexOf.call(row.parentElement.children, row)

      if (
        count === -Infinity ||
        index - count < 0
      ) {
        next = row.parentElement.firstElementChild
      } else {
        next = row.parentElement.children.item(index - count)
      }

      if (next instanceof ScolaTableRowElement) {
        return next
      }
    }

    return null
  }

  protected handleInteractor (event: ScolaInteractorEvent): boolean {
    switch (event.type) {
      case 'click':
        return this.handleInteractorClick(event)
      case 'dblclick':
        return this.handleInteractorDblclick(event)
      case 'start':
        return this.handleInteractorStart(event)
      default:
        return false
    }
  }

  protected handleInteractorClick (event: ScolaInteractorEvent): boolean {
    if (this.interactor.isMouse(event.originalEvent)) {
      return this.handleInteractorClickMouse(event.originalEvent)
    } else if (this.interactor.isTouch(event.originalEvent)) {
      return this.handleInteractorClickTouch(event.originalEvent)
    }

    return false
  }

  protected handleInteractorClickMouse (event: MouseEvent): boolean {
    const row = this.determineRow(event)

    if (row !== null) {
      if (
        this.mode === 'many' ||
        this.mode === 'one'
      ) {
        if (
          !event.ctrlKey &&
          !event.shiftKey
        ) {
          if (row.datamap.type === 'node') {
            this.element.tree?.toggle(row.datamap)
          }

          if (
            !this.rows.includes(row) ||
            this.rows.length > 1
          ) {
            this.selectRows(row)
            this.dispatch('select', event)
            return true
          }
        }
      }
    }

    return false
  }

  protected handleInteractorClickTouch (event: TouchEvent): boolean {
    const row = this.determineRow(event)

    if (row !== null) {
      if (
        this.mode === 'many' ||
        this.mode === 'one'
      ) {
        if (row.datamap.type === 'node') {
          this.element.tree?.toggle(row.datamap)
        }

        this.selectRows(row)
        this.dispatch('select', event)
        return true
      }

      this.toggle(row)
      this.dispatch('select', event)
      return true
    }

    return false
  }

  protected handleInteractorDblclick (event: ScolaInteractorEvent): boolean {
    this.dispatch('selectdblclick', event.originalEvent)
    return true
  }

  protected handleInteractorStart (event: ScolaInteractorEvent): boolean {
    if (this.interactor.isKeyboard(event.originalEvent)) {
      return this.handleInteractorStartKeyboard(event.originalEvent)
    } else if (this.interactor.isMouse(event.originalEvent)) {
      return this.handleInteractorStartMouse(event.originalEvent)
    }

    return true
  }

  protected handleInteractorStartKeyboard (event: KeyboardEvent): boolean {
    let handled = false

    if (this.firstSelectedRow === undefined) {
      handled = this.handleInteractorStartKeyboardStart(event)
    } else if (event.code === 'Delete') {
      handled = this.handleInteractorStartKeyboardDelete(event)
    } else if (event.code === 'Enter') {
      handled = this.handleInteractorStartKeyboardEnter(event)
    } else if (event.code === 'Space') {
      handled = this.handleInteractorStartKeyboardSpace(event)
    } else if (event.code === 'Tab') {
      if (!event.shiftKey) {
        handled = this.handleInteractorStartKeyboardTab()
      }
    } else if (!event.ctrlKey) {
      if (
        event.shiftKey && (
          this.mode === 'many' ||
          this.mode === 'toggle'
        )) {
        handled = this.handleInteractorStartKeyboardShift(event)
      } else {
        handled = this.handleInteractorStartKeyboardDefault(event)
      }
    }

    if (handled) {
      event.preventDefault()
    }

    return handled
  }

  protected handleInteractorStartKeyboardDefault (event: KeyboardEvent): boolean {
    let lastRow: ScolaTableRowElement | null = null

    if (
      this.interactor.isArrowEnd(event) &&
      this.firstSelectedRow?.datamap.type === 'node'
    ) {
      lastRow = this.firstSelectedRow
      this.element.tree?.toggle(lastRow.datamap, true)
    } else if (
      this.interactor.isArrowStart(event) &&
      this.firstSelectedRow?.datamap.type === 'node'
    ) {
      lastRow = this.firstSelectedRow
      this.element.tree?.toggle(lastRow.datamap, false)
    } else if (this.interactor.isKeyForward(event)) {
      lastRow = this.findNext(this.lastRow) ?? this.lastRow ?? null
    } else if (this.interactor.isKeyBack(event)) {
      lastRow = this.findPrevious(this.firstRow) ?? this.firstRow ?? null
    } else if (event.code === 'PageDown') {
      lastRow = this.findNext(this.lastRow, this.calculatePageSize())
    } else if (event.code === 'PageUp') {
      lastRow = this.findPrevious(this.firstRow, this.calculatePageSize())
    } else if (event.code === 'End') {
      lastRow = this.findNext(this.lastRow, Infinity)
    } else if (event.code === 'Home') {
      lastRow = this.findPrevious(this.firstRow, -Infinity)
    }

    if (lastRow !== null) {
      const dispatch = (
        lastRow !== this.lastSelectedRow ||
        this.rows.length > 1
      )

      this.selectRows(lastRow, lastRow)
      lastRow.focus()

      if (dispatch) {
        this.dispatch('select', event)
      }

      return true
    }

    return false
  }

  protected handleInteractorStartKeyboardDelete (event: Event): boolean {
    this.dispatch('selectdelete', event)
    return true
  }

  protected handleInteractorStartKeyboardEnter (event: Event): boolean {
    if (this.firstSelectedRow?.datamap.type === 'node') {
      this.element.tree?.toggle(this.firstSelectedRow.datamap)
    }

    this.dispatch('selectenter', event)
    return true
  }

  protected handleInteractorStartKeyboardShift (event: KeyboardEvent): boolean {
    let lastRow: ScolaTableRowElement | null = null

    if (this.interactor.isKeyForward(event)) {
      lastRow = this.findNext(this.lastSelectedRow)
    } else if (this.interactor.isKeyBack(event)) {
      lastRow = this.findPrevious(this.lastSelectedRow)
    } else if (event.code === 'PageDown') {
      lastRow = this.findNext(this.lastSelectedRow, this.calculatePageSize())
    } else if (event.code === 'PageUp') {
      lastRow = this.findPrevious(this.lastSelectedRow, this.calculatePageSize())
    } else if (event.code === 'End') {
      lastRow = this.findNext(this.lastSelectedRow, Infinity)
    } else if (event.code === 'Home') {
      lastRow = this.findPrevious(this.lastSelectedRow, -Infinity)
    }

    if (lastRow !== null) {
      this.selectRows(lastRow, this.firstSelectedRow)
      this.dispatch('select', event)
      return true
    }

    return false
  }

  protected handleInteractorStartKeyboardSpace (event: Event): boolean {
    if (this.firstSelectedRow?.datamap.type === 'node') {
      this.element.tree?.toggle(this.firstSelectedRow.datamap)
    }

    this.dispatch('selectspace', event)
    return true
  }

  protected handleInteractorStartKeyboardStart (event: KeyboardEvent): boolean {
    if (this.interactor.isKeyForward(event)) {
      if (this.element.body.firstElementChild instanceof ScolaTableRowElement) {
        this.selectRows(this.element.body.firstElementChild, this.element.body.firstElementChild)
        this.element.body.firstElementChild.focus()
        this.dispatch('select', event)
        return true
      }
    }

    return false
  }

  protected handleInteractorStartKeyboardTab (): boolean {
    let handled = false

    const button = this.rows[0].querySelector('button')

    if (button !== null) {
      handled = document.activeElement !== button
      button.focus()
    }

    return handled
  }

  protected handleInteractorStartMouse (event: MouseEvent): boolean {
    const row = this.determineRow(event)

    if (row !== null) {
      if (this.mode === 'one') {
        if (event.ctrlKey) {
          this.toggle(row)
        } else if (!this.rows.includes(row)) {
          this.selectRows(row)
        }

        this.dispatch('select', event)
        return true
      } else if (this.mode === 'many') {
        if (event.ctrlKey) {
          this.toggle(row)
        } else if (event.shiftKey) {
          this.selectRows(row, this.firstSelectedRow)
        } else if (!this.rows.includes(row)) {
          this.selectRows(row)
        }

        this.dispatch('select', event)
        return true
      }

      if (event.shiftKey) {
        this.selectRows(row, this.firstSelectedRow)
      } else {
        this.toggle(row)
      }

      this.dispatch('select', event)
      return true
    }

    return false
  }

  protected selectRows (lastRow: ScolaTableRowElement, firstRow = lastRow): void {
    this.clearRows()
    this.firstSelectedRow = firstRow
    this.lastSelectedRow = lastRow

    const firstRowIndex = Array.prototype.indexOf.call(this.element.body.children, firstRow)
    const lastRowIndex = Array.prototype.indexOf.call(this.element.body.children, lastRow)
    const beginIndex = Math.min(firstRowIndex, lastRowIndex)
    const endIndex = Math.max(firstRowIndex, lastRowIndex)

    let row: ScolaTableRowElement | null = null

    for (let index = beginIndex; index <= endIndex; index += 1) {
      row = this.element.body.querySelector(`tr:nth-child(${index + 1})`)

      if (row !== null) {
        this.rows.push(row)
        this.updateRow(row, true)
      }
    }

    this.sortRows()
    this.scrollTo()
  }

  protected sortRows (): void {
    this.rows.sort((left, right) => {
      return left.rowIndex - right.rowIndex
    })
  }

  protected updateRow (row: ScolaTableRowElement, active: boolean): void {
    if (active) {
      row.toggleAttribute('sc-active', true)

      if (this.rows.length === 1) {
        row.setAttribute('tabindex', '0')
      }
    } else {
      row.toggleAttribute('sc-active', false)
      row.setAttribute('tabindex', '-1')
    }

    this.element.updateAttributes()
  }
}
