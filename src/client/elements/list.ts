import type {
  NodeEvent,
  NodeResult
} from './node'

import type {
  PropertyValues,
  TemplateResult
} from 'lit-element'

import {
  customElement,
  html,
  property
} from 'lit-element'

import type { InputElement } from './input'
import { NodeElement } from './node'
import { RequestElement } from './request'
import { repeat } from 'lit-html/directives/repeat'

declare global {
  interface HTMLElementEventMap {
    'scola-list-filter': ListFilterEvent
    'scola-list-order': ListOrderEvent
    'scola-list-restart': NodeEvent
  }

  interface HTMLElementTagNameMap {
    'scola-list': ListElement
  }

  interface WindowEventMap {
    'scola-list-filter': ListFilterEvent
    'scola-list-order': ListOrderEvent
    'scola-list-restart': NodeEvent
  }
}

export interface ListFilterEvent extends NodeEvent {
  detail: null | {
    filterName?: string
    filterValue?: string
    origin?: HTMLElement
    target?: string
  }
}

export type ListItem = Record<string, unknown>

export interface ListOrderEvent extends NodeEvent {
  detail: null | {
    orderCol?: string
    orderDir?: string
    origin?: HTMLElement
    target?: string
  }
}

export interface ListResult extends NodeResult {
  cursor?: string
  items?: ListItem[]
}

@customElement('scola-list')
export class ListElement extends RequestElement {
  @property({
    attribute: false
  })
  public filters: Map<string, string> = new Map<string, string>()

  @property({
    attribute: 'load-factor',
    type: Number
  })
  public loadFactor = 2

  @property({
    attribute: 'order-col'
  })
  public orderCol?: string

  @property({
    attribute: 'order-dir'
  })
  public orderDir?: string

  @property({
    attribute: 'page-size',
    type: Number
  })
  public pageSize?: number

  @property({
    attribute: 'scroll-factor',
    type: Number
  })
  public scrollFactor = 0.5

  @property()
  public search?: string

  public data: ListResult

  public method: RequestElement['method'] = 'GET'

  protected cursor?: string

  protected emptyElement?: NodeElement | null

  protected handleFilterBound: (event: ListFilterEvent) => void

  protected handleOrderBound: (event: ListOrderEvent) => void

  protected handleRestartBound: (event: NodeEvent) => void

  protected items: ListItem[] = []

  protected keyFunction: (item: ListItem) => unknown

  protected templateElement?: NodeElement | null

  protected templateFunction: (item: ListItem) => HTMLElement | TemplateResult

  protected get searchElement (): InputElement | null {
    return this.querySelector('[is="search"]')
  }

  public constructor () {
    super()
    this.handleFilterBound = this.handleFilter.bind(this)
    this.handleOrderBound = this.handleOrder.bind(this)
    this.handleRestartBound = this.handleRestart.bind(this)
    this.addEventListener('scola-list-filter', this.handleFilterBound)
    this.addEventListener('scola-list-order', this.handleOrderBound)
    this.addEventListener('scola-list-restart', this.handleRestartBound)
  }

  public connectedCallback (): void {
    this.keyFunction = this.getKey.bind(this)

    this.emptyElement = this.querySelector<NodeElement>(':scope > [slot="empty"]')
    this.templateElement = this.querySelector<NodeElement>(':scope > [slot="template"]')

    if (this.templateElement instanceof NodeElement) {
      this.templateFunction = this.renderTemplate.bind(this)
    } else {
      this.templateFunction = this.renderItem.bind(this)
    }

    this.searchElement?.addEventListener('scola-input', this.handleInput.bind(this))
    window.addEventListener('scola-list-filter', this.handleFilterBound)
    window.addEventListener('scola-list-order', this.handleOrderBound)
    window.addEventListener('scola-list-restart', this.handleRestartBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    window.removeEventListener('scola-list-filter', this.handleFilterBound)
    window.removeEventListener('scola-list-order', this.handleOrderBound)
    window.removeEventListener('scola-list-restart', this.handleRestartBound)
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.setPageSize()
    this.setSearch()
    super.firstUpdated(properties)
  }

  public render (): TemplateResult {
    return html`
      <slot name="header"></slot>
      <slot name="body">
        <slot name="before"></slot>
        <slot name="prefix"></slot>
        <slot>
          ${repeat(this.items, this.keyFunction, this.templateFunction)}
        </slot>
        <slot name="suffix"></slot>
        <slot name="after"></slot>
      </slot>
      <slot name="footer"></slot>
    `
  }

  protected cleanResult (): void {
    this.code = undefined
    this.data = { items: [] }
  }

  protected createURL (): string {
    const url = new URL(`${this.origin}${this.base}${this.url ?? ''}`)

    if (this.cursor !== undefined) {
      url.searchParams.append('cursor', this.cursor)
    }

    if (this.orderCol !== undefined) {
      url.searchParams.append('order-col', this.orderCol)
    }

    if (this.orderDir !== undefined) {
      url.searchParams.append('order-dir', this.orderDir)
    }

    if (this.search !== undefined) {
      url.searchParams.append('search', this.search)
    }

    if (this.pageSize !== undefined) {
      url.searchParams.append('page-size', String(this.pageSize))
    }

    this.filters.forEach((value, name) => {
      url.searchParams.append(name, value)
    })

    return String(url)
  }

  protected finishEmpty (): void {
    if (this.emptyElement instanceof NodeElement) {
      if (this.items.length === 0) {
        this.emptyElement.slot = ''
      } else {
        this.emptyElement.slot = 'empty'
      }
    }
  }

  protected finishError (error: unknown): void {
    super.finishError(error)
    this.finishEmpty()
  }

  protected async finishJSON (): Promise<void> {
    await super.finishJSON()

    this.cursor = this.data.cursor
    this.items.push(...this.data.items ?? [])

    this.finishEmpty()
  }

  protected async finishText (): Promise<void> {
    await super.finishText()

    if (this.response instanceof Response && this.response.status < 400) {
      this.code = 'ERR_RESPONSE_TYPE'
    }

    this.finishEmpty()
  }

  protected getKey (item: ListItem): unknown {
    return item.id
  }

  protected handleFilter (event: ListFilterEvent): void {
    if (this.isTarget(event)) {
      if (event.detail?.filterName !== undefined) {
        if (event.detail.filterValue === undefined) {
          this.filters.delete(event.detail.filterName)
        } else {
          this.filters.set(event.detail.filterName, event.detail.filterValue)
        }
      }

      this.restart()
    }
  }

  protected handleInput (): void {
    this.setSearch()
    this.restart()
  }

  protected handleOrder (event: ListOrderEvent): void {
    if (this.isTarget(event)) {
      this.orderCol = event.detail?.orderCol
      this.orderDir = event.detail?.orderDir
      this.restart()
    }
  }

  protected handleRestart (event: NodeEvent): void {
    if (this.isTarget(event)) {
      this.restart()
    }
  }

  protected handleScroll (): void {
    if (this.cursor === undefined) {
      return
    }

    if (this.bodySlotElement instanceof HTMLSlotElement) {
      const {
        clientHeight,
        scrollHeight,
        scrollTop
      } = this.bodySlotElement

      if (scrollHeight - scrollTop - clientHeight < this.scrollFactor * clientHeight) {
        this.start()
      }
    }
  }

  protected renderItem (item: ListItem): TemplateResult {
    return html`
      <scola-node height="medium">${JSON.stringify(item)}</scola-node>
    `
  }

  protected renderTemplate (item: ListItem): HTMLElement {
    const element = this.templateElement?.cloneNode(true) as NodeElement

    element
      .removeAttribute('slot')

    element
      .querySelectorAll('scola-button')
      .forEach((buttonElement) => {
        buttonElement.data = item
      })

    element
      .querySelectorAll('scola-format')
      .forEach((formatElement) => {
        formatElement.data = item
      })

    return element
  }

  protected restart (): void {
    this.cursor = undefined
    this.items = []
    this.start()
  }

  protected setPageSize (): void {
    const { clientHeight = 0 } = this.bodySlotElement ?? {}
    let itemHeight = 0

    switch (this.templateElement?.height) {
      case 'large':
        itemHeight = 4.25 * 16
        break
      case 'medium':
        itemHeight = 3.25 * 16
        break
      case 'small':
        itemHeight = 2.25 * 16
        break
      default:
        itemHeight = 16
        break
    }

    this.pageSize = Math.ceil(clientHeight / itemHeight * this.loadFactor)
  }

  protected setSearch (): void {
    const search = this.searchElement?.getValue()
    this.search = search === '' ? undefined : search
  }
}
