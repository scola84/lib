import type { PropertyValues, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { isArray, isObject, isPrimitive } from '../../common'
import { NodeElement } from './node'
import { RequestElement } from './request'
import { html } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import updaters from '../updaters/list'

declare global {
  interface HTMLElementEventMap {
    'scola-list-start': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-list': ListElement
  }

  interface WindowEventMap {
    'scola-list-start': CustomEvent
  }
}

@customElement('scola-list')
export class ListElement extends NodeElement {
  public static updaters = {
    ...RequestElement.updaters,
    ...updaters
  }

  @property({
    attribute: 'count-factor',
    type: Number
  })
  public countFactor = 2

  @property({
    attribute: false
  })
  public items: unknown[] = []

  @property()
  public mode?: 'cursor' | 'offset'

  @property({
    attribute: 'scroll-factor',
    type: Number
  })
  public scrollFactor = 0.5

  @property({
    attribute: 'scroll-parent'
  })
  public scrollParent?: string

  @state()
  protected count?: number

  protected emptyElement: NodeElement | null

  protected handleScrollBound: () => void

  protected handleStartBound: (event: CustomEvent) => void

  protected keyFunction: (item: unknown, index: number) => unknown

  protected scrollParentElement?: HTMLElement | null

  protected templateElement: NodeElement | null

  protected templateFunction: (item: unknown) => Node | TemplateResult | undefined

  protected updaters = ListElement.updaters

  public constructor () {
    super()
    this.emptyElement = this.querySelector<NodeElement>(':scope > [slot="empty"]')
    this.templateElement = this.querySelector<NodeElement>(':scope > [slot="template"]')
    this.handleScrollBound = this.handleScroll.bind(this)
    this.handleStartBound = this.handleStart.bind(this)
    this.keyFunction = this.getKey.bind(this)

    if (this.templateElement === null) {
      this.templateFunction = this.renderItem.bind(this)
    } else {
      this.templateFunction = this.renderTemplate.bind(this)
    }
  }

  public connectedCallback (): void {
    this.scrollParentElement?.addEventListener('scroll', this.handleScrollBound)
    window.addEventListener('scola-list-start', this.handleStartBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    this.scrollParentElement?.removeEventListener('scroll', this.handleScrollBound)
    window.removeEventListener('scola-list-start', this.handleStartBound)
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    if (this.scrollParent === undefined) {
      this.scrollParentElement = this.bodySlotElement
    } else {
      this.scrollParentElement = document
        .querySelector<NodeElement>(`#${this.scrollParent}`)
        ?.shadowBody
    }

    this.scrollParentElement?.addEventListener('scroll', this.handleScrollBound)
    this.addEventListener('scola-list-start', this.handleStartBound)
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

  public start (): void {
    this.count = this.calculateCount()
    this.data = undefined
  }

  public update (properties: PropertyValues): void {
    if (properties.has('data')) {
      if (isArray(this.data)) {
        this.items.push(...(this.data))
        this.handleEmpty()
      } else if (this.data === undefined) {
        this.items = []
        this.dispatchRequestEvent()
      }
    } else if (properties.has('count')) {
      this.items = []
      this.dispatchRequestEvent()
    }

    super.update(properties)
  }

  protected calculateCount (): number {
    const { clientHeight: parentHeight } = this.scrollParentElement ?? {}
    const templateHeight = parseFloat(this.templateElement?.height ?? '0')

    if (
      typeof parentHeight === 'number' &&
      typeof templateHeight === 'number'
    ) {
      return Math.ceil((parentHeight / (templateHeight * 16)) * this.countFactor)
    }

    return 0
  }

  protected dispatchRequestEvent (): void {
    if (
      this.count === undefined ||
      this.count === 0 || (
        isArray(this.data) &&
        this.data.length < this.count
      )
    ) {
      return
    }

    const data: Record<string, unknown> = {
      count: this.count
    }

    if (this.mode === 'cursor') {
      const item = this.items.slice(-1).pop()

      if (
        isObject(item) &&
        item.cursor !== undefined
      ) {
        data.cursor = item.cursor
      } else {
        data.cursor = ''
      }
    } else if (this.mode === 'offset') {
      data.offset = this.items.length
    }

    this.dispatchEvent(new CustomEvent('scola-request-start', {
      bubbles: true,
      composed: true,
      detail: {
        data,
        origin: this
      }
    }))
  }

  protected getKey (item: unknown, index: number): string {
    if (
      isObject(item) &&
      isPrimitive(item.id)
    ) {
      return item.id.toString()
    }

    return index.toString()
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

  protected handleScroll (): void {
    const {
      clientHeight = 0,
      scrollHeight = 0,
      scrollTop = 0
    } = this.scrollParentElement ?? {}

    if (scrollHeight - scrollTop - clientHeight < this.scrollFactor * clientHeight) {
      this.dispatchRequestEvent()
    }
  }

  protected handleStart (event: CustomEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.start()
    }
  }

  protected renderItem (item: unknown): TemplateResult {
    return html`
      <scola-node height="3">${JSON.stringify(item)}</scola-node>
    `
  }

  protected renderTemplate (item: unknown): Node | undefined {
    const element = this.templateElement?.cloneNode(true)

    if (element instanceof NodeElement) {
      element.removeAttribute('slot')
      element.data = item

      element.dataLeafElements.forEach((dataLeafElement) => {
        dataLeafElement.data = item
      })
    }

    return element
  }
}
