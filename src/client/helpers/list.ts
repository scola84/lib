import { ScolaIntl, isStruct } from '../../common'
import type { ScolaTableElement } from '../elements/table'
import type { ScolaTableRowElement } from '../elements/table-row'
import type { Struct } from '../../common'

export class ScolaList {
  public added = new Set()

  public deleted = new Set()

  public element: ScolaTableElement

  public factor: number

  public filter: string

  public intl: ScolaIntl

  public items: Struct[] = []

  public key: string

  public limit: number

  public mode?: string

  public scroll: boolean

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

  public add (item: Struct): void {
    let key = item[this.key]

    if (key === undefined) {
      key = `${Date.now()}-${this.items.length + 1}`
      item[this.key] = key
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

  public clear (): void {
    this.items = []
  }

  public connect (): void {
    this.addEventListeners()
  }

  public delete (item: Struct): void {
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

  public getKeys (): unknown[] {
    return Array.from(this.element.body
      .querySelectorAll<ScolaTableRowElement>('tr'))
      .map((row) => {
        return row.datamap[this.element.list.key]
      })
  }

  public load (): void {
    this.setLimit()
    this.clear()
    this.loadItems()
  }

  public loadItems (): void {
    if (
      this.limit === 0 ||
      (this.items.length % this.limit) > 0
    ) {
      return
    }

    const data: Struct = {
      limit: this.limit
    }

    switch (this.mode) {
      case 'cursor':
        data.cursor = this.cursor
        break
      case 'offset':
        data.offset = this.offset
        break
      default:
        break
    }

    this.element.propagator.dispatch('load', [data])
  }

  public reset (): void {
    this.factor = Number(this.element.getAttribute('sc-list-factor') ?? 2)
    this.filter = this.element.getAttribute('sc-list-filter') ?? ''
    this.key = this.element.getAttribute('sc-list-key') ?? 'id'
    this.mode = this.element.getAttribute('sc-list-mode') ?? undefined
    this.scroll = this.element.hasAttribute('sc-list-scroll')
    this.sortKey = this.element.getAttribute('sc-list-sort-key') ?? ''
    this.sortOrder = this.element.getAttribute('sc-list-sort-order') ?? ''
    this.threshold = Number(this.element.getAttribute('sc-list-threshold') ?? 0.75)
  }

  protected addEventListeners (): void {
    if (this.scroll) {
      this.element.body.addEventListener('scroll', this.handleScrollBound)
    }
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
    const { body } = this.element

    if ((body.scrollHeight - body.clientHeight - body.scrollTop) < (body.clientHeight * this.threshold)) {
      this.loadItems()
    }
  }

  protected removeEventListeners (): void {
    if (this.scroll) {
      this.element.body.removeEventListener('scroll', this.handleScrollBound)
    }
  }

  protected setLimit (): void {
    if (this.element.body.clientHeight > 0) {
      this.limit = Math.floor((this.element.body.clientHeight / 32) * this.factor)
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
