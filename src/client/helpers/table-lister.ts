import { I18n, isArray, isStruct } from '../../common'
import type { Query, Struct } from '../../common'
import type { ScolaTableElement, ScolaTableRowElement } from '../elements'
import { Breakpoint } from './breakpoint'

export class TableLister {
  public added = new Set()

  public axis: string | null

  public breakpoint: Breakpoint

  public deleted = new Set()

  public direction: string | null

  public element: ScolaTableElement

  public factor: number

  public i18n: I18n

  public items: Struct[] = []

  public limit: number

  public locked: boolean

  public order: string | null

  public pkey: string

  public query: boolean

  public requestData?: Query

  public rkey: string | null

  public search: string | null

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

    if ((
      this.query
    ) && (
      this.search !== null ||
      this.order !== null
    )) {
      items = [...items]

      if (this.search !== null) {
        items = this.i18n.filter(items, this.i18n.parse(this.search))
      }

      if (this.order !== null) {
        items = this.i18n.sort(items, this.order.split(' '), this.direction?.split(' '))
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
        return row.data[this.pkey]
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
      (this.items.length % this.limit) > 0 ||
      this.requestData !== undefined
    ) {
      return
    }

    this.requestData = {
      limit: this.limit,
      offset: this.items.length
    }

    const cursor = this.items.slice(-1)[0]?.cursor

    if (typeof cursor === 'string') {
      this.requestData.cursor = cursor
    }

    if (this.direction !== null) {
      this.requestData.direction = this.direction
    }

    if (this.order !== null) {
      this.requestData.order = this.order
    }

    if (this.rkey !== null) {
      this.requestData[this.rkey] = this.element.dataset[this.rkey]
    }

    if (this.search !== null) {
      this.requestData.search = this.search
    }

    this.element.propagator.dispatch<Query>('request', [this.requestData])
  }

  public reset (): void {
    this.axis = this.element.getAttribute('sc-list-axis') ?? 'y'
    this.direction = this.element.getAttribute('sc-list-direction')
    this.factor = Number(this.element.getAttribute('sc-list-factor') ?? 2)
    this.locked = this.element.hasAttribute('sc-list-locked')
    this.order = this.element.getAttribute('sc-list-order')
    this.pkey = this.element.getAttribute('sc-list-pkey') ?? 'id'
    this.query = this.element.hasAttribute('sc-list-query')
    this.rkey = this.element.getAttribute('sc-list-rkey')
    this.search = this.element.getAttribute('sc-list-search') ?? ''
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
