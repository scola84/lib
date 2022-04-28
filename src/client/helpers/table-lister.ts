import { I18n, Struct, cast, isArray, isNumber, isStruct, isTransaction, set, toJoint } from '../../common'
import type { Query, Transaction } from '../../common'
import type { ScolaTableElement, ScolaTableRowElement } from '../elements'
import { Breakpoint } from './breakpoint'

export class TableLister {
  public added = new Set()

  public axis: string | null

  public breakpoint: Breakpoint

  public deleted = new Set()

  public element: ScolaTableElement

  public factor: number

  public i18n: I18n

  public items: Struct[] = []

  public limit: number

  public locked: boolean

  public mode: string | null

  public pkey: string

  public query: boolean

  public rkey: string | null

  public threshold: number

  protected handleScrollXBound = this.handleScrollX.bind(this)

  protected handleScrollYBound = this.handleScrollY.bind(this)

  public constructor (element: ScolaTableElement) {
    this.element = element
    this.breakpoint = new Breakpoint(element)
    this.i18n = new I18n()
    this.reset()
  }

  public add (item: Struct): void {
    let key = item[this.pkey]

    if (key === undefined) {
      key = `${Date.now()}-${this.items.length + 1}`

      Object.defineProperty(item, this.pkey, {
        enumerable: true,
        value: key,
        writable: false
      })
    }

    const index = this.findIndex(key)

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
    const key = item[this.pkey]

    const index = this.items.findIndex((findItem) => {
      return key === findItem[this.pkey]
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

  public findIndex (key: unknown): number {
    return this.items.findIndex((findItem) => {
      return key === findItem[this.pkey]
    })
  }

  public getDiff (): Struct {
    return {
      added: Array.from(this.added),
      deleted: Array.from(this.deleted)
    }
  }

  public getItems (): Struct[] {
    let { items } = this

    if (this.query) {
      items = [...items]

      const query = this.createQuery()

      if (query.join?.[this.rkey ?? ''] !== undefined) {
        items = items.filter((item) => {
          return cast(item[this.rkey ?? '']) === cast(query.join?.[this.rkey ?? ''])
        })
      }

      if (query.where !== undefined) {
        items = this.i18n.filter(items, query)
      }

      if (query.order !== undefined) {
        items = this.i18n.sort(items, query)
      }
    }

    return items
  }

  public getItemsByRow (): Struct[] {
    return Array.from(this.element.body
      .querySelectorAll<ScolaTableRowElement>('tr'))
      .map((row) => {
        if (isStruct(row.data)) {
          return row.data
        }

        return {}
      })
  }

  public getKeysByRow (): unknown[] {
    return Array.from(this.element.body
      .querySelectorAll<ScolaTableRowElement>('tr'))
      .map((row) => {
        if (isStruct(row.data)) {
          return row.data[this.pkey]
        }

        return null
      })
  }

  public put (item: Struct): void {
    const index = this.findIndex(item[this.pkey])

    if (index > -1) {
      this.items[index] = item
    }
  }

  public request (): void {
    if (
      this.limit === 0 ||
      this.locked ||
      (this.items.length % this.limit) > 0
    ) {
      return
    }

    const transaction = {
      commit: this.createQuery(),
      type: 'table-lister'
    }

    this.element.propagator.dispatchEvents<Transaction>('request', [transaction])
  }

  public reset (): void {
    this.axis = this.element.getAttribute('sc-list-axis') ?? 'y'
    this.factor = Number(this.element.getAttribute('sc-list-factor') ?? 2)
    this.query = this.element.hasAttribute('sc-list-query')
    this.locked = this.element.hasAttribute('sc-list-locked')
    this.mode = this.element.getAttribute('sc-list-mode')
    this.pkey = this.element.getAttribute('sc-list-pkey') ?? 'id'
    this.rkey = this.element.getAttribute('sc-list-rkey')
    this.threshold = Number(this.element.getAttribute('sc-list-threshold') ?? 0.75)
  }

  public setData (data: unknown): void {
    if (isTransaction(data)) {
      if (isArray(data.result)) {
        this.addItems(data.result)
      }
    } else if (isArray(data)) {
      this.addItems(data)
    } else if (isStruct(data)) {
      if (isArray(data.items)) {
        this.addItems(data.items)
      }
    }
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
    const itemSize = Number(this.breakpoint.parseAttribute('sc-list-item-size') ?? 2)

    if (bodySize !== null) {
      limit = Math.floor(bodySize / (itemSize * fontSize) * this.factor)
    }

    return limit
  }

  protected createQuery (): Query {
    const query = Struct.create<Query>({
      limit: this.limit
    })

    if (this.mode === 'cursor') {
      const cursor = this.items.slice(-1)[0]?.cursor

      if (
        isNumber(cursor) ||
        typeof cursor === 'string'
      ) {
        query.cursor = cursor
      }
    } else if (this.mode === 'offset') {
      query.offset = this.items.length
    }

    Object
      .entries(this.element.dataset)
      .forEach(([key, value]) => {
        const path = toJoint(key, {
          chars: null,
          separator: '.'
        })

        set(query, path, cast(value))
      })

    return query
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
}
