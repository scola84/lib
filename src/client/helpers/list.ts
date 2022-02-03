import { ScolaIntl, isStruct } from '../../common'
import type { ScolaTableElement } from '../elements/table'
import type { ScolaTableRowElement } from '../elements/table-row'
import type { Struct } from '../../common'
import { isArray } from 'lodash'

type Axis = 'x' | 'y'

type Mode = 'cursor' | 'offset' | null

export class ScolaList {
  public added = new Set()

  public axis: string | null

  public deleted = new Set()

  public element: ScolaTableElement

  public factor: number

  public filter: string

  public intl: ScolaIntl

  public items: Struct[] = []

  public key: string

  public limit: number

  public mode: Mode

  public requestData?: Struct

  public sortKey: string

  public sortOrder: string

  public threshold: number

  public get cursor (): unknown {
    return this.items.slice(-1)[0]?.cursor
  }

  public get offset (): unknown {
    return this.items.length
  }

  protected handleScrollBound = this.handleScroll.bind(this)

  public constructor (element: ScolaTableElement) {
    this.element = element
    this.intl = new ScolaIntl()
    this.reset()
  }

  public addItem (item: Struct): void {
    let key = item[this.key]

    if (key === undefined) {
      key = `${Date.now()}-${this.items.length + 1}`

      Object.defineProperty(item, this.key, {
        enumerable: true,
        value: key,
        writable: false
      })
    }

    const index = this.items.findIndex((findItem) => {
      return key === findItem[this.key]
    })

    if (index === -1) {
      this.items.push(item)
    }

    if (this.deleted.has(key)) {
      this.deleted.delete(key)
    } else {
      this.added.add(key)
    }
  }

  public clearItems (): void {
    this.items = []
  }

  public connect (): void {
    this.addEventListeners()
  }

  public deleteItem (item: Struct): void {
    const key = item[this.key]

    const index = this.items.findIndex((findItem) => {
      return key === findItem[this.key]
    })

    if (index > -1) {
      this.items.splice(index, 1)
    }

    if (this.added.has(key)) {
      this.added.delete(key)
    } else {
      this.deleted.add(key)
    }
  }

  public disconnect (): void {
    this.removeEventListeners()
  }

  public getItems (): Struct[] {
    let { items } = this

    if (
      this.filter !== '' ||
      this.sortKey !== ''
    ) {
      items = [...items]

      if (this.filter !== '') {
        items = this.filterItems(items, this.intl.parse(this.filter))
      }

      if (this.sortKey !== '') {
        items = this.sortItems(items, this.sortKey, this.sortOrder)
      }
    }

    return items
  }

  public getItemsByRow (): Struct[] {
    return Array.from(this.element.body
      .querySelectorAll<ScolaTableRowElement>('tr'))
      .map((row) => {
        return row.datamap
      })
  }

  public getKeysByRow (): unknown[] {
    return Array.from(this.element.body
      .querySelectorAll<ScolaTableRowElement>('tr'))
      .map((row) => {
        return row.datamap[this.element.list.key]
      })
  }

  public request (): void {
    this.setLimit()
    this.clearItems()
    this.requestItems()
  }

  public requestItems (): void {
    if (
      this.requestData !== undefined ||
      this.limit === 0 ||
      (this.items.length % this.limit) > 0
    ) {
      return
    }

    this.requestData = {
      limit: this.limit
    }

    switch (this.mode) {
      case 'cursor':
        this.requestData.cursor = this.cursor
        break
      case 'offset':
        this.requestData.offset = this.offset
        break
      default:
        break
    }

    this.element.propagator.dispatch('request', [this.requestData])
  }

  public reset (): void {
    this.axis = (this.element.getAttribute('sc-list-axis') as Axis | null) ?? 'y'
    this.factor = Number(this.element.getAttribute('sc-list-factor') ?? 2)
    this.filter = this.element.getAttribute('sc-list-filter') ?? ''
    this.key = this.element.getAttribute('sc-list-key') ?? 'id'
    this.mode = this.element.getAttribute('sc-list-mode') as Mode
    this.sortKey = this.element.getAttribute('sc-list-sort-key') ?? ''
    this.sortOrder = this.element.getAttribute('sc-list-sort-order') ?? ''
    this.threshold = Number(this.element.getAttribute('sc-list-threshold') ?? 0.75)
  }

  public setData (data: unknown): void {
    if (isArray(data)) {
      this.addItems(data)
    } else if (
      isStruct(data) &&
      isArray(data.items)
    ) {
      this.addItems(data.items)
    }
  }

  protected addEventListeners (): void {
    if (this.axis !== null) {
      this.element.body.addEventListener('scroll', this.handleScrollBound)
    }
  }

  protected addItems (items: unknown[]): void {
    items.forEach((item) => {
      if (isStruct(item)) {
        this.addItem(item)
      }
    })

    this.requestData = undefined
    this.element.update()
  }

  protected filterItems (items: Struct[], queries: Struct[]): Struct[] {
    return items.filter((item) => {
      if (isStruct(item)) {
        return queries.every(({ name, value }) => {
          if (typeof name === 'string') {
            return String(item[name]).includes(String(value))
          }

          return Object
            .entries(item)
            .some(([, itemValue]) => {
              return String(itemValue).includes(String(value))
            })
        })
      }

      return false
    })
  }

  protected handleScroll (): void {
    const {
      clientHeight: bodyHeight,
      clientWidth: bodyWidth,
      scrollHeight: bodyScrollHeight,
      scrollWidth: bodyScrollWidth,
      scrollLeft: bodyScrollLeft,
      scrollTop: bodyScrollTop
    } = this.element.body

    if ((
      bodyScrollHeight > bodyHeight &&
      (bodyScrollHeight - bodyHeight - bodyScrollTop) < (bodyHeight * this.threshold)
    ) || (
      bodyScrollWidth > bodyWidth &&
      (bodyScrollWidth - bodyWidth - bodyScrollLeft) < (bodyWidth * this.threshold)
    )) {
      this.requestItems()
    }
  }

  protected removeEventListeners (): void {
    if (this.axis !== null) {
      this.element.body.removeEventListener('scroll', this.handleScrollBound)
    }
  }

  protected setLimit (): void {
    let size: number | null = null

    if (
      this.axis === 'x' &&
      this.element.body.clientWidth > 0
    ) {
      size = this.element.body.clientWidth
    } else if (
      this.axis === 'y' &&
      this.element.body.clientHeight > 0
    ) {
      size = this.element.body.clientHeight
    }

    if (size !== null) {
      this.limit = Math.floor((size / (16 * this.factor)))
    }
  }

  protected sortItems (items: Struct[], sortKey: string, sortOrder: string): Struct[] {
    let factor = 1

    if (sortOrder === 'desc') {
      factor = -1
    }

    return items.sort((left, right) => {
      const lv = String(left[sortKey])
      const rv = String(right[sortKey])

      const compare = factor * lv.localeCompare(rv, undefined, {
        numeric: true,
        sensitivity: 'base'
      })

      return compare
    })
  }
}
