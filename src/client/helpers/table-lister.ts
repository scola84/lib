import { ScolaIntl, isArray, isStruct } from '../../common'
import { ScolaBreakpoint } from './breakpoint'
import type { ScolaTableElement } from '../elements/table'
import type { ScolaTableRowElement } from '../elements/table-row'
import type { Struct } from '../../common'

type Axis = 'x' | 'y'

type Mode = 'cursor' | 'offset' | null

export class ScolaTableLister {
  public added = new Set()

  public axis: string | null

  public breakpoint: ScolaBreakpoint

  public deleted = new Set()

  public element: ScolaTableElement

  public factor: number

  public filter: string

  public intl: ScolaIntl

  public items: Struct[] = []

  public key: string

  public limit: number

  public locked: boolean

  public mode: Mode

  public requestData?: Struct

  public sortKey: string[]

  public sortOrder: string[]

  public threshold: number

  protected handleScrollXBound = this.handleScrollX.bind(this)

  protected handleScrollYBound = this.handleScrollY.bind(this)

  public constructor (element: ScolaTableElement) {
    this.element = element
    this.breakpoint = new ScolaBreakpoint(element)
    this.intl = new ScolaIntl()
    this.reset()
  }

  public add (item: Struct): void {
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

  public getDiff (): Struct {
    return {
      added: Array.from(this.added),
      deleted: Array.from(this.deleted)
    }
  }

  public getItems (): Struct[] {
    let { items } = this

    if (
      this.filter !== '' ||
      this.sortKey.length > 0
    ) {
      items = [...items]

      if (this.filter !== '') {
        items = this.filterItems(items, this.intl.parse(this.filter))
      }

      if (this.sortKey.length > 0) {
        items = this.sortItems(items, this.sortKey, this.sortOrder)
      }
    }

    return items
  }

  public getItemsByRow (): Struct[] {
    return Array.from(this.element.body
      .querySelectorAll<ScolaTableRowElement>('tr'))
      .map((row) => {
        return row.data
      })
  }

  public getKeysByRow (): unknown[] {
    return Array.from(this.element.body
      .querySelectorAll<ScolaTableRowElement>('tr'))
      .map((row) => {
        return row.data[this.element.lister.key]
      })
  }

  public put (item: Struct): void {
    const key = item[this.key]

    const index = this.items.findIndex((findItem) => {
      return key === findItem[this.key]
    })

    if (index > -1) {
      this.items[index] = item
    }
  }

  public request (): void {
    if (
      this.limit === 0 ||
      this.locked ||
      (this.items.length % this.limit) > 0 ||
      this.requestData !== undefined
    ) {
      return
    }

    this.requestData = {
      limit: this.limit
    }

    switch (this.mode) {
      case 'cursor':
        this.requestData.cursor = this.items.slice(-1)[0]?.cursor
        break
      case 'offset':
        this.requestData.offset = this.items.length
        break
      default:
        break
    }

    this.element.propagator.dispatch('request', [this.requestData])
  }

  public reset (): void {
    this.axis = (this.element.getAttribute('sc-list-axis') as Axis | null) ?? 'y'
    this.factor = Number(this.element.getAttribute('sc-list-item-factor') ?? 2)
    this.filter = this.element.getAttribute('sc-list-filter') ?? ''
    this.key = this.element.getAttribute('sc-list-key') ?? 'id'
    this.locked = this.element.hasAttribute('sc-list-locked')
    this.mode = this.element.getAttribute('sc-list-mode') as Mode
    this.sortKey = this.element.getAttribute('sc-list-sort-key')?.split(' ') ?? []
    this.sortOrder = this.element.getAttribute('sc-list-sort-order')?.split(' ') ?? []
    this.threshold = Number(this.element.getAttribute('sc-list-threshold') ?? 0.75)
  }

  public setData (data: unknown): void {
    if (isArray(data)) {
      this.addItems(data)
    } else if (isStruct(data)) {
      if (isArray(data.items)) {
        this.addItems(data.items)
      }
    }

    this.requestData = undefined
  }

  public start (): void {
    this.limit = this.calculateLimit()
    this.request()
  }

  protected addEventListeners (): void {
    if (this.axis === 'x') {
      this.element.body.addEventListener('scroll', this.handleScrollXBound)
    } else if (this.axis === 'y') {
      this.element.body.addEventListener('scroll', this.handleScrollYBound)
    }
  }

  protected addItems (items: unknown[]): void {
    items.forEach((item) => {
      if (isStruct(item)) {
        this.add(item)
      }
    })

    this.element.update()
  }

  protected calculateLimit (): number {
    let bodySize: number | null = null
    let limit = 0

    if (
      this.axis === 'x' &&
      this.element.body.clientWidth > 0
    ) {
      bodySize = this.element.body.clientWidth
    } else if (
      this.axis === 'y' &&
      this.element.body.clientHeight > 0
    ) {
      bodySize = this.element.body.clientHeight
    }

    const fontSize = parseFloat(window.getComputedStyle(this.element).getPropertyValue('font-size'))
    const itemSize = Number(this.breakpoint.parse('sc-list-item-size') ?? 2)

    if (bodySize !== null) {
      limit = Math.floor(bodySize / (itemSize * fontSize)) * this.factor
    }

    return limit
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

  protected handleScrollX (): void {
    const {
      clientWidth: bodyWidth,
      scrollWidth: bodyScrollWidth,
      scrollLeft: bodyScrollLeft
    } = this.element.body

    if (
      bodyScrollWidth > bodyWidth &&
      (bodyScrollWidth - bodyWidth - bodyScrollLeft) < (bodyWidth * this.threshold)
    ) {
      this.request()
    }
  }

  protected handleScrollY (): void {
    const {
      clientHeight: bodyHeight,
      scrollHeight: bodyScrollHeight,
      scrollTop: bodyScrollTop
    } = this.element.body

    if (
      bodyScrollHeight > bodyHeight &&
      (bodyScrollHeight - bodyHeight - bodyScrollTop) < (bodyHeight * this.threshold)
    ) {
      this.request()
    }
  }

  protected removeEventListeners (): void {
    if (this.axis === 'x') {
      this.element.body.removeEventListener('scroll', this.handleScrollXBound)
    } else if (this.axis === 'y') {
      this.element.body.removeEventListener('scroll', this.handleScrollYBound)
    }
  }

  protected sortItems (items: Struct[], sortKey: string[], sortOrder: string[]): Struct[] {
    items.sort((left, right) => {
      let equivalence = 0
      let key = ''
      let order = 1
      let lv = ''
      let rv = ''

      for (let index = 0; index < sortKey.length; index += 1) {
        key = sortKey[index]
        lv = String(left[key])
        rv = String(right[key])

        if (sortOrder[index] === 'desc') {
          order = -1
        } else {
          order = 1
        }

        equivalence = order * lv.localeCompare(rv, undefined, {
          caseFirst: 'upper',
          numeric: true,
          sensitivity: 'variant'
        })

        if (equivalence !== 0) {
          return equivalence
        }
      }

      return equivalence
    })

    return items
  }
}
