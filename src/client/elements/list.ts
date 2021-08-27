import type { PropertyValues, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { isArray, isObject, isPrimitive } from '../../common'
import { NodeElement } from './node'
import { RequestElement } from './request'
import { render } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import updaters from '../updaters/list'

declare global {
  interface HTMLElementEventMap {
    'scola-list-add': CustomEvent
    'scola-list-delete': CustomEvent
    'scola-list-start': CustomEvent
    'scola-list-toggle': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-list': ListElement
  }

  interface WindowEventMap {
    'scola-list-add': CustomEvent
    'scola-list-delete': CustomEvent
    'scola-list-start': CustomEvent
    'scola-list-toggle': CustomEvent
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
  public key = 'id'

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

  protected handleAddBound: (event: CustomEvent) => void

  protected handleDeleteBound: (event: CustomEvent) => void

  protected handleScrollBound: () => void

  protected handleStartBound: (event: CustomEvent) => void

  protected handleToggleBound: (event: CustomEvent) => void

  protected keyFunction: (item: unknown, index: number) => unknown

  protected scrollParentElement?: HTMLElement | null

  protected templateElement: NodeElement | null

  protected templateFunction: (item: unknown) => Node | TemplateResult | undefined

  protected updaters = ListElement.updaters

  public constructor () {
    super()

    const templateElement = this.querySelector<NodeElement>(':scope > [slot="template"]')

    if (templateElement === null) {
      throw new Error('Template element is null')
    }

    this.emptyElement = this.querySelector<NodeElement>(':scope > [slot="empty"]')
    this.handleAddBound = this.handleAdd.bind(this)
    this.handleDeleteBound = this.handleDelete.bind(this)
    this.handleScrollBound = this.handleScroll.bind(this)
    this.handleStartBound = this.handleStart.bind(this)
    this.handleToggleBound = this.handleToggle.bind(this)
    this.keyFunction = this.getKey.bind(this)
    this.templateElement = templateElement
    this.templateFunction = this.renderTemplate.bind(this)
  }

  public addItem (item: Record<string, unknown>): boolean {
    const index = this.items.findIndex((findItem) => {
      return this.getKey(item) === this.getKey(findItem)
    })

    if (index === -1) {
      this.items.push(item)
      this.requestUpdate('items')
      return true
    }

    return false
  }

  public connectedCallback (): void {
    this.scrollParentElement?.addEventListener('scroll', this.handleScrollBound)
    window.addEventListener('scola-list-add', this.handleAddBound)
    window.addEventListener('scola-list-delete', this.handleDeleteBound)
    window.addEventListener('scola-list-start', this.handleStartBound)
    window.addEventListener('scola-list-toggle', this.handleToggleBound)
    super.connectedCallback()
  }

  public deleteItem (item: Record<string, unknown>): boolean {
    const index = this.items.findIndex((findItem) => {
      return this.getKey(item) === this.getKey(findItem)
    })

    if (index > -1) {
      this.items.splice(index, 1)
      this.requestUpdate('items')
      return true
    }

    return false
  }

  public disconnectedCallback (): void {
    this.scrollParentElement?.removeEventListener('scroll', this.handleScrollBound)
    window.removeEventListener('scola-list-add', this.handleAddBound)
    window.removeEventListener('scola-list-delete', this.handleDeleteBound)
    window.removeEventListener('scola-list-start', this.handleStartBound)
    window.removeEventListener('scola-list-toggle', this.handleToggleBound)
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
    this.addEventListener('scola-list-add', this.handleAddBound)
    this.addEventListener('scola-list-delete', this.handleDeleteBound)
    this.addEventListener('scola-list-start', this.handleStartBound)
    this.addEventListener('scola-list-toggle', this.handleToggleBound)

    if (this.mode === undefined) {
      this.handleEmpty()
    }

    super.firstUpdated(properties)
  }

  public getKey (item: unknown, index?: number): unknown {
    if (
      isObject(item) &&
      isPrimitive(item[this.key])
    ) {
      return item[this.key]
    }

    return index
  }

  public start (): void {
    this.count = this.calculateCount()
    this.data = undefined
  }

  public toggleItem (item: Record<string, unknown>): void {
    const added = this.addItem(item)

    if (!added) {
      this.deleteItem(item)
    }
  }

  public update (properties: PropertyValues): void {
    if (properties.has('count')) {
      this.items = []
      this.dispatchRequestEvent()
    } else if (properties.has('data')) {
      if (isArray(this.data)) {
        this.items.push(...this.data)
        this.handleEmpty()
      } else if (this.data === undefined) {
        this.items = []
        this.dispatchRequestEvent()
      }
    } else if (properties.has('items')) {
      if (this.mode === undefined) {
        this.handleEmpty()
      }
    }

    render(repeat(this.items, this.keyFunction, this.templateFunction), this)
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

  protected handleAdd (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isObject(data)) {
        this.addItem(data)
      }
    }
  }

  protected handleDelete (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isObject(data)) {
        this.deleteItem(data)
      }
    }
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
      this.start()
    }
  }

  protected handleToggle (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isObject(data)) {
        this.toggleItem(data)
      }
    }
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
