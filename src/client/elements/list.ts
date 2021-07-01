import type { PropertyValues, TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { InputElement } from './input'
import { NodeElement } from './node'
import type { NodeEvent } from './node'
import { RequestElement } from './request'
import { html } from 'lit'
import { repeat } from 'lit/directives/repeat.js'

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
  detail: {
    name?: string
    value?: string
    origin?: HTMLElement
    target?: string
  } | null
}

export type ListItem = Record<string, unknown>

export interface ListOrderEvent extends NodeEvent {
  detail: {
    column?: string
    direction?: 'asc' | 'desc'
    origin?: HTMLElement
    target?: string
  } | null
}

@customElement('scola-list')
export class ListElement extends RequestElement {
  @property()
  public column?: string

  @property({
    type: Number
  })
  public count?: number

  @property({
    attribute: 'count-factor',
    type: Number
  })
  public countFactor = 2

  @property()
  public cursor?: string

  @property()
  public direction?: 'asc' | 'desc'

  @property({
    type: Number
  })
  public offset?: number

  @property()
  public query?: string

  @property({
    attribute: 'scroll-factor',
    type: Number
  })
  public scrollFactor = 0.5

  public data: ListItem[] = []

  protected emptyElement?: NodeElement | null

  protected filters: Map<string, string> = new Map<string, string>()

  protected handleFilterBound: (event: ListFilterEvent) => void

  protected handleOrderBound: (event: ListOrderEvent) => void

  protected handleRestartBound: (event: NodeEvent) => void

  protected items: ListItem[] = []

  protected keyFunction: (item: ListItem) => unknown

  protected templateElement?: NodeElement | null

  protected templateFunction: (item: ListItem) => HTMLElement | TemplateResult

  protected get queryElement (): InputElement | null {
    return this.querySelector('[is="query"]')
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

    this.queryElement?.addEventListener('scola-input', this.handleInput.bind(this))
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
    this.setCount()
    this.setQuery()
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

  protected createURL (): URL {
    const url = super.createURL()

    if (this.column !== undefined) {
      url.searchParams.append('column', this.column)
    }

    if (this.count !== undefined) {
      url.searchParams.append('count', `${this.count}`)
    }

    if (this.cursor !== undefined) {
      url.searchParams.append('cursor', this.cursor)
    }

    if (this.direction !== undefined) {
      url.searchParams.append('direction', this.direction)
    }

    if (this.offset !== undefined) {
      url.searchParams.append('offset', `${this.offset}`)
    }

    if (this.query !== undefined) {
      url.searchParams.append('query', this.query)
    }

    this.filters.forEach((value, name) => {
      url.searchParams.append(name, value)
    })

    return url
  }

  protected async finish (): Promise<void> {
    await super.finish()

    if (this.code === 'OK_200') {
      this.finishData()
    }

    this.finishEmpty()
  }

  protected finishData (): void {
    if (
      this.cursor !== undefined &&
      this.column !== undefined &&
      this.data.length > 0
    ) {
      this.cursor = String(this.data[this.data.length - 1][this.column])
    }

    if (this.offset !== undefined) {
      this.offset = this.items.length
    }

    this.items.push(...this.data)
    this.requestUpdate('items')
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

  protected getKey (item: ListItem): string {
    return String(item.id)
  }

  protected handleFilter (event: ListFilterEvent): void {
    if (this.isTarget(event)) {
      if (event.detail?.name !== undefined) {
        if (event.detail.value === undefined) {
          this.filters.delete(event.detail.name)
        } else {
          this.filters.set(event.detail.name, event.detail.value)
        }
      }

      this.restart()
    }
  }

  protected handleInput (): void {
    this.setQuery()
    this.restart()
  }

  protected handleOrder (event: ListOrderEvent): void {
    if (this.isTarget(event)) {
      this.direction = event.detail?.direction
      this.column = event.detail?.column
      this.restart()
    }
  }

  protected handleRestart (event: NodeEvent): void {
    if (this.isTarget(event)) {
      this.restart()
    }
  }

  protected handleScroll (): void {
    if (
      this.count === undefined ||
      this.data.length < this.count
    ) {
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
    if (this.cursor !== undefined) {
      this.cursor = ''
    }

    if (this.offset !== undefined) {
      this.offset = 0
    }

    this.items = []
    this.start()
  }

  protected setCount (): void {
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

    this.count = Math.ceil(clientHeight / itemHeight * this.countFactor)
  }

  protected setQuery (): void {
    this.query = this.queryElement?.getValue()

    if (this.query === '') {
      this.query = undefined
    }
  }
}
