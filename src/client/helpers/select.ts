import { ScolaInteract } from './interact'
import type { ScolaInteractEvent } from './interact'
import type { ScolaTableElement } from '../elements/table'
import { ScolaTableRowElement } from '../elements/table-row'
import type { Struct } from '../../common'

export class ScolaSelect {
  public all: boolean

  public element: ScolaTableElement

  public firstSelectedRow?: ScolaTableRowElement

  public handle: boolean

  public interact: ScolaInteract

  public lastSelectedRow?: ScolaTableRowElement

  public rows: ScolaTableRowElement[] = []

  public get firstRow (): ScolaTableRowElement | undefined {
    return this.rows[0]
  }

  public get lastRow (): ScolaTableRowElement | undefined {
    return this.rows[this.rows.length - 1]
  }

  protected handleDblclickBound = this.handleDblclick.bind(this)

  protected handleInteractBound = this.handleInteract.bind(this)

  public constructor (element: ScolaTableElement) {
    this.element = element
    this.interact = new ScolaInteract(element.body)
    this.reset()
  }

  public add (row: ScolaTableRowElement): void {
    const index = this.rows.findIndex((findRow) => {
      return row === findRow
    })

    if (index === -1) {
      if (this.firstSelectedRow === undefined) {
        this.firstSelectedRow = row
      }

      this.lastSelectedRow = row
      row.toggleAttribute('sc-active', true)
      this.rows.push(row)
      this.sort()
    }
  }

  public clear (): void {
    this.rows.forEach((row) => {
      row.removeAttribute('sc-active')
    })

    this.firstSelectedRow = undefined
    this.lastSelectedRow = undefined
    this.rows = []
  }

  public connect (): void {
    this.interact.observe(this.handleInteractBound)
    this.interact.connect()
    this.addEventListeners()
    this.scrollTo()
  }

  public delete (item: Struct): void {
    const index = this.rows.findIndex((findRow) => {
      return item[this.element.list.key] === findRow.datamap[this.element.list.key]
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
      this.sort()

      if (
        this.firstSelectedRow === undefined &&
        this.lastSelectedRow === undefined
      ) {
        if (row.previousElementSibling instanceof ScolaTableRowElement) {
          this.select(row.previousElementSibling)
        } else if (row.nextElementSibling instanceof ScolaTableRowElement) {
          this.select(row.nextElementSibling)
        }
      }
    }
  }

  public disconnect (): void {
    this.interact.disconnect()
    this.removeEventListeners()
  }

  public getItemsByRow (): Struct[] {
    return this.rows.map((row) => {
      return row.datamap
    })
  }

  public getKeysByRow (): unknown[] {
    return this.rows.map((row) => {
      return row.datamap[this.element.list.key]
    })
  }

  public reset (): void {
    this.all = this.element.hasAttribute('sc-select-all')
    this.handle = this.element.hasAttribute('sc-select-handle')
    this.interact.keyboard = this.interact.hasKeyboard
    this.interact.mouse = this.interact.hasMouse
    this.interact.touch = this.interact.hasTouch
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
      row.removeAttribute('sc-active')
      this.rows.splice(index, 1)
      this.sort()

      if (this.firstSelectedRow === row) {
        this.firstSelectedRow = undefined
      }

      if (this.lastSelectedRow === row) {
        this.lastSelectedRow = undefined
      }
    } else {
      row.toggleAttribute('sc-active', true)
      this.rows.push(row)
      this.sort()

      if (this.firstSelectedRow === undefined) {
        this.firstSelectedRow = row
      }
    }

    this.sort()
  }

  public toggleAll (force: boolean): void {
    this.clear()

    if (force) {
      this.element.body.childNodes.forEach((row) => {
        if (row instanceof ScolaTableRowElement) {
          if (this.firstSelectedRow === undefined) {
            this.firstSelectedRow = row
          }

          this.lastSelectedRow = row
          this.rows.push(row)
          row.toggleAttribute('sc-active', true)
        }
      })
    }
  }

  protected addEventListeners (): void {
    this.element.body.addEventListener('dblclick', this.handleDblclickBound)
  }

  protected dispatch (on: string, event?: Event): void {
    const items = this.getItemsByRow()
    const keys = this.getKeysByRow()

    if (items.length === 1) {
      this.element.propagator.dispatch(on, items, event)
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

  protected handleDblclick (event: MouseEvent): void {
    this.dispatch('selectdblclick', event)
  }

  protected handleInteract (event: ScolaInteractEvent): boolean {
    event.originalEvent.cancelBubble = true

    if (event.type === 'click') {
      if (this.interact.isMouse(event.originalEvent, 'up')) {
        return this.handleInteractEndMouse(event.originalEvent)
      } else if (this.interact.isTouch(event.originalEvent, 'end')) {
        return this.handleInteractEndTouch(event.originalEvent)
      }
    } else if (event.type === 'start') {
      if (this.interact.isMouse(event.originalEvent, 'down')) {
        return this.handleInteractStart(event.originalEvent)
      } else if (this.interact.isKeyboard(event.originalEvent, 'down')) {
        return this.handleKeydown(event.originalEvent)
      }

      return true
    }

    return false
  }

  protected handleInteractEndMouse (event: MouseEvent | TouchEvent): boolean {
    if (event.target instanceof HTMLElement) {
      const row = event.target.closest<ScolaTableRowElement>('tr')

      if (row !== null) {
        if (row.hasAttribute('sc-selectable')) {
          if (
            !event.ctrlKey &&
            !event.shiftKey && (
              !this.rows.includes(row) ||
              this.rows.length > 1
            )
          ) {
            this.select(row)
            this.dispatch('select', event)
            return true
          }
        }
      }
    }

    return false
  }

  protected handleInteractEndTouch (event: MouseEvent | TouchEvent): boolean {
    if (event.target instanceof HTMLElement) {
      const row = event.target.closest<ScolaTableRowElement>('tr')

      if (row !== null) {
        if (row.hasAttribute('sc-selectable')) {
          this.select(row)
          this.dispatch('select', event)
          return true
        } else if (
          this.handle &&
          event.target.closest('[sc-handle="select"]') !== null
        ) {
          this.toggle(row)
          this.dispatch('select', event)
          return true
        }
      }
    }

    return false
  }

  protected handleInteractStart (event: MouseEvent | TouchEvent): boolean {
    if (event.target instanceof HTMLElement) {
      const row = event.target.closest<ScolaTableRowElement>('tr')

      if (row !== null) {
        if (row.hasAttribute('sc-selectable')) {
          if (event.ctrlKey) {
            this.toggle(row)
          } else if (event.shiftKey) {
            this.select(row, this.firstSelectedRow)
          } else if (!this.rows.includes(row)) {
            this.select(row)
          }

          this.dispatch('select', event)
          return true
        } else if (
          this.handle &&
          event.target.closest('[sc-handle="select"]') !== null
        ) {
          if (event.shiftKey) {
            this.select(row, this.firstSelectedRow)
          } else {
            this.toggle(row)
          }

          this.dispatch('select', event)
          return true
        }
      }
    }

    return false
  }

  protected handleKeydown (event: KeyboardEvent): boolean {
    let handled = false

    if (
      !this.handle && (
        document.activeElement === this.element ||
        document.activeElement === this.element.body
      )
    ) {
      if (this.firstSelectedRow === undefined) {
        handled = this.handleKeydownStart(event)
      } else if (event.code === 'Delete') {
        handled = this.handleKeydownDelete(event)
      } else if (event.code === 'Enter') {
        handled = this.handleKeydownEnter(event)
      } else if (event.code === 'Space') {
        handled = this.handleKeydownSpace(event)
      } else if (!event.ctrlKey) {
        if (event.shiftKey) {
          handled = this.handleKeydownShift(event)
        } else {
          handled = this.handleKeydownDefault(event)
        }
      }
    }

    if (handled) {
      event.preventDefault()
    }

    return handled
  }

  protected handleKeydownDefault (event: KeyboardEvent): boolean {
    let lastRow: ScolaTableRowElement | null = null

    if (this.interact.isKeyForward(event)) {
      lastRow = this.findNext(this.lastRow) ?? this.lastRow ?? null
    } else if (this.interact.isKeyBack(event)) {
      lastRow = this.findPrevious(this.firstRow) ?? this.firstRow ?? null
    } else if (event.code === 'PageDown') {
      lastRow = this.findNext(this.lastRow, Math.floor(this.element.list.limit / this.element.list.factor))
    } else if (event.code === 'PageUp') {
      lastRow = this.findPrevious(this.firstRow, Math.floor(this.element.list.limit / this.element.list.factor))
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

      this.select(lastRow)

      if (dispatch) {
        this.dispatch('select', event)
      }

      return true
    }

    return false
  }

  protected handleKeydownDelete (event: Event): boolean {
    this.dispatch('selectdelete', event)
    return true
  }

  protected handleKeydownEnter (event: Event): boolean {
    this.dispatch('selectenter', event)
    return true
  }

  protected handleKeydownShift (event: KeyboardEvent): boolean {
    let lastRow: ScolaTableRowElement | null = null

    if (this.interact.isKeyForward(event)) {
      lastRow = this.findNext(this.lastSelectedRow)
    } else if (this.interact.isKeyBack(event)) {
      lastRow = this.findPrevious(this.lastSelectedRow)
    } else if (event.code === 'PageDown') {
      lastRow = this.findNext(this.lastSelectedRow, Math.floor(this.element.list.limit / this.element.list.factor))
    } else if (event.code === 'PageUp') {
      lastRow = this.findPrevious(this.lastSelectedRow, Math.floor(this.element.list.limit / this.element.list.factor))
    } else if (event.code === 'End') {
      lastRow = this.findNext(this.lastSelectedRow, Infinity)
    } else if (event.code === 'Home') {
      lastRow = this.findPrevious(this.lastSelectedRow, -Infinity)
    }

    if (lastRow !== null) {
      this.select(lastRow, this.firstSelectedRow)
      this.dispatch('select', event)
      return true
    }

    return false
  }

  protected handleKeydownSpace (event: Event): boolean {
    this.dispatch('selectspace', event)
    return true
  }

  protected handleKeydownStart (event: KeyboardEvent): boolean {
    if (this.interact.isKeyForward(event)) {
      if (this.element.body.firstElementChild instanceof ScolaTableRowElement) {
        this.select(this.element.body.firstElementChild)
        this.dispatch('select', event)
        return true
      }
    }

    return false
  }

  protected removeEventListeners (): void {
    this.element.body.removeEventListener('dblclick', this.handleDblclickBound)
  }

  protected select (lastRow: ScolaTableRowElement, firstRow = lastRow): void {
    this.clear()
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
        row.toggleAttribute('sc-active', true)
        this.rows.push(row)
      }
    }

    this.sort()
    this.scrollTo()
  }

  protected sort (): void {
    this.rows.sort((left, right) => {
      return left.rowIndex - right.rowIndex
    })
  }
}
