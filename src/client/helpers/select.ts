import { ScolaRowElement } from '../elements/row'
import type { ScolaTableElement } from '../elements/table'
import type { Struct } from '../../common'

export class ScolaSelect {
  public all: boolean

  public count = 0

  public element: ScolaTableElement

  public firstSelectedRow?: ScolaRowElement

  public handle: boolean

  public lastSelectedRow?: ScolaRowElement

  public rows: ScolaRowElement[] = []

  public get firstRow (): ScolaRowElement | undefined {
    return this.rows[0]
  }

  public get lastRow (): ScolaRowElement | undefined {
    return this.rows[this.rows.length - 1]
  }

  protected handleClickBound = this.handleClick.bind(this)

  protected handleKeydownBound = this.handleKeydown.bind(this)

  protected handleMousedownBound = this.handleMousedown.bind(this)

  public constructor (element: ScolaTableElement) {
    this.element = element
    this.reset()
  }

  public add (row: ScolaRowElement): void {
    const index = this.rows.findIndex((findRow) => {
      return row === findRow
    })

    if (index === -1) {
      if (this.firstSelectedRow === undefined) {
        this.firstSelectedRow = row
      }

      this.lastSelectedRow = row
      row.toggleAttribute('sc-selected', true)
      this.rows.push(row)
    }

    this.update()
  }

  public clear (): void {
    this.rows.forEach((row) => {
      row.removeAttribute('sc-selected')
    })

    this.firstSelectedRow = undefined
    this.lastSelectedRow = undefined
    this.rows = []
    this.update()
  }

  public connect (): void {
    this.addEventListeners()
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

      if (
        this.firstSelectedRow === undefined &&
        this.lastSelectedRow === undefined
      ) {
        if (row.previousElementSibling instanceof ScolaRowElement) {
          this.select(row.previousElementSibling)
        } else if (row.nextElementSibling instanceof ScolaRowElement) {
          this.select(row.nextElementSibling)
        } else {
          this.update()
        }
      }
    }
  }

  public disconnect (): void {
    this.removeEventListeners()
  }

  public getItems (): Struct[] {
    return this.rows.map((row) => {
      return row.datamap
    })
  }

  public getKeys (): unknown[] {
    return this.rows.map((row) => {
      return row.datamap[this.element.list.key]
    })
  }

  public reset (): void {
    this.all = this.element.hasAttribute('sc-select-all')
    this.handle = this.element.hasAttribute('sc-select-handle')
  }

  public toggle (row: ScolaRowElement): void {
    const index = this.rows.findIndex((findRow) => {
      return row === findRow
    })

    if (index > -1) {
      row.removeAttribute('sc-selected')
      this.rows.splice(index, 1)

      if (this.firstSelectedRow === row) {
        this.firstSelectedRow = undefined
      }

      if (this.lastSelectedRow === row) {
        this.lastSelectedRow = undefined
      }
    } else {
      row.toggleAttribute('sc-selected', true)
      this.rows.push(row)

      if (this.firstSelectedRow === undefined) {
        this.firstSelectedRow = row
      }
    }

    this.update()
  }

  public toggleAll (force: boolean): void {
    this.clear()

    if (force) {
      this.element.body.childNodes.forEach((row) => {
        if (row instanceof ScolaRowElement) {
          if (this.firstSelectedRow === undefined) {
            this.firstSelectedRow = row
          }

          this.lastSelectedRow = row
          this.rows.push(row)
          row.toggleAttribute('sc-selected', true)
        }
      })

      this.update()
    }
  }

  protected addEventListeners (): void {
    this.element.addEventListener('keydown', this.handleKeydownBound)
    this.element.body.addEventListener('click', this.handleClickBound)
    this.element.body.addEventListener('mousedown', this.handleMousedownBound)
  }

  protected dispatch (on: string, event?: Event): void {
    const items = this.getItems()
    const keys = this.getKeys()

    if (items.length === 1) {
      this.element.propagator.dispatch(on, items, event)
    }

    this.element.propagator.dispatch(`${on}item`, items, event)

    this.element.propagator.dispatch(`${on}items`, [{
      items: keys
    }], event)
  }

  protected findNext (row?: ScolaRowElement, count = 1): ScolaRowElement | null {
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

      if (next instanceof ScolaRowElement) {
        return next
      }
    }

    return null
  }

  protected findPrevious (row?: ScolaRowElement, count = 1): ScolaRowElement | null {
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

      if (next instanceof ScolaRowElement) {
        return next
      }
    }

    return null
  }

  protected handleClick (event: MouseEvent): void {
    if (event.target instanceof HTMLElement) {
      const row = event.target.closest<ScolaRowElement>('tr')

      if (row !== null) {
        if (row.hasAttribute('sc-selectable')) {
          if (
            !event.ctrlKey &&
            !event.shiftKey
          ) {
            this.select(row)
            this.dispatch('selectclick', event)
          }
        }
      }
    }
  }

  protected handleKeydown (event: KeyboardEvent): void {
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
      } else if (event.code === 'Escape') {
        handled = this.handleKeydownEscape()
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
  }

  protected handleKeydownDefault (event: KeyboardEvent): boolean {
    let lastRow: ScolaRowElement | null = null

    if (
      event.code === 'ArrowDown' ||
      event.code === 'ArrowRight'
    ) {
      lastRow = this.findNext(this.lastRow) ?? this.lastRow ?? null
    } else if (
      event.code === 'ArrowLeft' ||
      event.code === 'ArrowUp'
    ) {
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
      this.select(lastRow)
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

  protected handleKeydownEscape (): boolean {
    this.clear()
    return true
  }

  protected handleKeydownShift (event: KeyboardEvent): boolean {
    let lastRow: ScolaRowElement | null = null

    if (
      event.code === 'ArrowDown' ||
      event.code === 'ArrowRight'
    ) {
      lastRow = this.findNext(this.lastSelectedRow)
    } else if (
      event.code === 'ArrowLeft' ||
      event.code === 'ArrowUp'
    ) {
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
      return true
    }

    return false
  }

  protected handleKeydownSpace (event: Event): boolean {
    this.dispatch('selectspace', event)
    return true
  }

  protected handleKeydownStart (event: KeyboardEvent): boolean {
    if (
      event.code === 'ArrowDown' ||
      event.code === 'ArrowRight'
    ) {
      if (this.element.body.firstElementChild instanceof ScolaRowElement) {
        this.select(this.element.body.firstElementChild)
        return true
      }
    }

    return false
  }

  protected handleMousedown (event: MouseEvent): void {
    event.cancelBubble = true

    if (event.target instanceof HTMLElement) {
      const row = event.target.closest<ScolaRowElement>('tr')

      if (row !== null) {
        if (row.hasAttribute('sc-selectable')) {
          if (event.ctrlKey) {
            this.toggle(row)
          } else if (event.shiftKey) {
            this.select(row, this.firstSelectedRow)
          } else if (!this.rows.includes(row)) {
            this.select(row)
          }
        } else if (
          this.handle &&
          event.target.closest('[sc-handle="select"]') !== null
        ) {
          if (event.shiftKey) {
            this.select(row, this.firstSelectedRow)
          } else {
            this.toggle(row)
          }
        }
      }
    }
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('keydown', this.handleKeydownBound)
    this.element.body.removeEventListener('click', this.handleClickBound)
    this.element.body.removeEventListener('mousedown', this.handleMousedownBound)
  }

  protected scrollTo (): void {
    if (this.lastSelectedRow !== undefined) {
      const {
        clientHeight: rowHeight,
        offsetTop: rowTop
      } = this.lastSelectedRow

      const {
        clientHeight: bodyHeight,
        offsetTop: bodyTop,
        scrollTop: bodyScrollTop
      } = this.element.body

      let top = bodyScrollTop

      if ((rowTop - bodyTop + rowHeight) > (bodyScrollTop + bodyHeight)) {
        top = rowTop - bodyTop + rowHeight - bodyHeight
      } else if ((rowTop - bodyTop) < bodyScrollTop) {
        top = rowTop - bodyTop
      }

      this.element.body.scrollTo({
        top
      })
    }
  }

  protected select (lastRow: ScolaRowElement, firstRow = lastRow): void {
    this.clear()
    this.firstSelectedRow = firstRow
    this.lastSelectedRow = lastRow

    const firstRowIndex = Array.prototype.indexOf.call(this.element.body.children, firstRow)
    const lastRowIndex = Array.prototype.indexOf.call(this.element.body.children, lastRow)
    const beginIndex = Math.min(firstRowIndex, lastRowIndex)
    const endIndex = Math.max(firstRowIndex, lastRowIndex)

    let row: ScolaRowElement | null = null

    for (let index = beginIndex; index <= endIndex; index += 1) {
      row = this.element.body.querySelector(`tr:nth-child(${index + 1})`)

      if (row !== null) {
        row.toggleAttribute('sc-selected', true)
        this.rows.push(row)
      }
    }

    this.update()
    this.scrollTo()
  }

  protected setCount (): void {
    this.count = this.rows.length
  }

  protected update (): void {
    this.rows.sort((left, right) => {
      return left.rowIndex - right.rowIndex
    })

    this.dispatch('select')
    this.setCount()
  }
}
