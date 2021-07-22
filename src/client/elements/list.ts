import type { PropertyValues, TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { ButtonElement } from './button'
import type { FormatElement } from './format'
import type { InputElement } from './input'
import { NodeElement } from './node'
import type { NodeEvent } from './node'
import { RequestElement } from './request'
import type { SourceElement } from './source'
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

export interface ListItem {
  [key: string]: unknown
}

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
  public static heightFactors: Partial<Record<string, number>> = {
    default: 1,
    large: 4.25,
    medium: 3.25,
    small: 2.25
  }

  public static updaters = {
    ...RequestElement.updaters,
    query: (source: ListElement, target: InputElement): void => {
      source.query = target.inputElement?.value
      source.restart()
    },
    source: (source: ListElement, target: SourceElement): void => {
      if (source.isArray<ListItem>(target.data)) {
        source.items.push(...target.data)
        source.requestUpdate('items')
        source.handleEmpty()
      }
    }
  }

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

  @property({
    attribute: false
  })
  public data?: ListItem[]

  @property()
  public direction?: 'asc' | 'desc'

  @property({
    attribute: false
  })
  public items: ListItem[] = []

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

  protected emptyElement?: NodeElement | null

  protected filters: Map<string, string> = new Map<string, string>()

  protected handleFilterBound: (event: ListFilterEvent) => void

  protected handleOrderBound: (event: ListOrderEvent) => void

  protected handleRestartBound: (event: NodeEvent) => void

  protected keyFunction: (item: ListItem) => unknown

  protected templateElement?: NodeElement | null

  protected templateFunction: (item: ListItem) => Node | TemplateResult | undefined

  protected updaters = ListElement.updaters

  public constructor () {
    super()
    this.emptyElement = this.querySelector<NodeElement>(':scope > [slot="empty"]')
    this.templateElement = this.querySelector<NodeElement>(':scope > [slot="template"]')
    this.handleFilterBound = this.handleFilter.bind(this)
    this.handleOrderBound = this.handleOrder.bind(this)
    this.handleRestartBound = this.handleRestart.bind(this)
    this.keyFunction = this.getKey.bind(this)
  }

  public connectedCallback (): void {
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
    if (this.templateElement instanceof NodeElement) {
      this.templateFunction = this.renderTemplate.bind(this)
    } else {
      this.templateFunction = this.renderItem.bind(this)
    }

    this.addEventListener('scola-list-filter', this.handleFilterBound)
    this.addEventListener('scola-list-order', this.handleOrderBound)
    this.addEventListener('scola-list-restart', this.handleRestartBound)
    this.bodySlotElement.addEventListener('scroll', this.handleScroll.bind(this))

    const { clientHeight = 0 } = this.bodySlotElement
    const heightName = this.templateElement?.height ?? 'default'
    const itemHeight = 16 * (ListElement.heightFactors[heightName] ?? 1)

    this.count = Math.ceil(clientHeight / itemHeight * this.countFactor)
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

  protected getKey (item: ListItem): string {
    return String(item.id)
  }

  protected handleEmpty (): void {
    if (this.emptyElement instanceof NodeElement) {
      if (this.items.length === 0) {
        this.emptyElement.slot = ''
      } else {
        this.emptyElement.slot = 'empty'
      }
    }
  }

  protected handleError (error: unknown): void {
    super.handleError(error)
    this.handleEmpty()
  }

  protected async handleFetch (): Promise<void> {
    await super.handleFetch()

    if (this.code === 'ok_200') {
      if (
        this.cursor !== undefined &&
        this.column !== undefined &&
        this.data !== undefined &&
        this.data.length > 0
      ) {
        this.cursor = String(this.data[this.data.length - 1][this.column])
      }

      if (this.offset !== undefined) {
        this.offset = this.items.length
      }

      this.items.push(...(this.data ?? []))
      this.requestUpdate('items')
    }

    this.handleEmpty()
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
      this.data === undefined ||
      this.data.length < this.count
    ) {
      return
    }

    const {
      clientHeight,
      scrollHeight,
      scrollTop
    } = this.bodySlotElement

    if (scrollHeight - scrollTop - clientHeight < this.scrollFactor * clientHeight) {
      this.start()
    }
  }

  protected renderItem (item: ListItem): TemplateResult {
    return html`
      <scola-node height="medium">${JSON.stringify(item)}</scola-node>
    `
  }

  protected renderTemplate (item: ListItem): Node | undefined {
    const element = this.templateElement?.cloneNode(true)

    if (element instanceof NodeElement) {
      element
        .removeAttribute('slot')

      element
        .querySelectorAll<ButtonElement>('scola-button')
        .forEach((buttonElement) => {
          buttonElement.data = item
        })

      element
        .querySelectorAll<FormatElement>('scola-format')
        .forEach((formatElement) => {
          formatElement.data = item
        })

      element
        .querySelectorAll<InputElement>('scola-input, scola-picker, scola-select, scola-slider')
        .forEach((inputElement) => {
          inputElement.setInput(item)
        })
    }

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
}
