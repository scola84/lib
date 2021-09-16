import { LitElement, html } from 'lit'
import type { PropertyValues, TemplateResult } from 'lit'
import { Struct, cast, isPrimitive, isStruct } from '../../common'
import { customElement, property, query } from 'lit/decorators.js'
import styles from '../styles/node'
import updaters from '../updaters/node'

declare global {
  interface HTMLElementEventMap {
    'scola-log': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-node': NodeElement
  }

  interface WindowEventMap {
    'scola-node-set-params': CustomEvent
    'scola-node-set-props': CustomEvent
    'scola-node-toggle-params': CustomEvent
    'scola-node-toggle-props': CustomEvent
  }
}

const LogLevel: Struct<number> = {
  all: 1,
  err: 4,
  info: 2,
  off: 5,
  warn: 3
}

export interface Presets {
  ''?: Struct<string | unknown>
}

export interface Updaters {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: ((observer: any, observable: any, properties: PropertyValues) => void) | undefined
}

@customElement('scola-node')
export class NodeElement extends LitElement {
  public static duration = 250

  public static easing = 'cubic-bezier(0.83, 0, 0.17, 1)'

  public static presets: Presets

  public static styles = [
    styles
  ]

  public static updaters: Updaters = updaters

  @property()
  public as?: string

  @property({
    reflect: true
  })
  public case?: 'lower' | 'title' | 'upper'

  @property({
    reflect: true
  })
  public color?: 'aux-1' | 'aux-2' | 'aux-3' | 'error' | 'sig-1' | 'sig-2'

  @property({
    attribute: 'context-menu'
  })
  public contextMenu?: string

  @property({
    reflect: true
  })
  public cursor?: 'default' | 'pointer' | 'text'

  @property({
    attribute: false
  })
  public data?: unknown

  @property({
    reflect: true,
    type: Boolean
  })
  public disabled?: boolean

  @property()
  public dispatch?: string

  @property({
    attribute: 'dispatch-filter'
  })
  public dispatchFilter?: string

  @property({
    reflect: true
  })
  public display?: string

  @property({
    type: Number
  })
  public duration = NodeElement.duration

  @property()
  public easing = NodeElement.easing

  @property({
    reflect: true
  })
  public fill?: 'aux-1' | 'aux-2' | 'aux-3' | 'error' | 'sig-1' | 'sig-2' | 'translucent'

  @property({
    attribute: 'fill-active',
    reflect: true
  })
  public fillActive?: 'aux-1' | 'aux-2' | 'aux-3' | 'sig-1' | 'sig-2'

  @property({
    attribute: 'fill-hover',
    reflect: true
  })
  public fillHover?: 'aux-1' | 'aux-2' | 'aux-3' | 'sig-1' | 'sig-2'

  @property({
    reflect: true
  })
  public flow?: 'column' | 'row'

  @property({
    reflect: true
  })
  public font?: 'large' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public halign?: 'between' | 'center' | 'end' | 'evenly' | 'start'

  @property({
    reflect: true
  })
  public height?: string

  @property({
    reflect: true,
    type: Boolean
  })
  public hidden: boolean

  @property({
    reflect: true
  })
  public hmargin?: string

  @property({
    reflect: true
  })
  public hpadding?: string

  @property({
    reflect: true
  })
  public hposition?: 'end' | 'start'

  @property({
    attribute: 'inner-backdrop',
    reflect: true
  })
  public innerBackdrop?: 'large' | 'medium' | 'small'

  @property({
    attribute: 'inner-height',
    reflect: true
  })
  public innerHeight?: string

  @property({
    attribute: 'inner-shadow',
    reflect: true
  })
  public innerShadow?: 'large' | 'medium' | 'small'

  @property({
    attribute: 'inner-spacing',
    reflect: true
  })
  public innerSpacing?: string

  @property({
    attribute: 'inner-width',
    reflect: true
  })
  public innerWidth?: string

  @property({
    reflect: true
  })
  public line?: 'large' | 'medium' | 'small'

  @property()
  public listen?: string

  @property({
    attribute: 'log-level'
  })
  public logLevel: keyof typeof LogLevel = 'off'

  @property({
    attribute: false
  })
  public logs: Struct[] = []

  @property({
    reflect: true
  })
  public margin?: string

  @property()
  public name = ''

  @property({
    attribute: 'no-data',
    type: Boolean
  })
  public noData?: boolean

  @property({
    attribute: 'no-wrap',
    reflect: true,
    type: Boolean
  })
  public noWrap?: boolean

  @property()
  public observe?: string

  @property({
    attribute: 'observe-scope'
  })
  public observeScope: 'body' | 'view' = 'view'

  @property({
    attribute: 'outer-backdrop',
    reflect: true
  })
  public outerBackdrop?: 'large' | 'medium' | 'small'

  @property({
    attribute: 'outer-shadow',
    reflect: true
  })
  public outerShadow?: string

  @property({
    attribute: false
  })
  public parameters: Struct = {}

  @property()
  public preset?: keyof Presets

  @property({
    reflect: true
  })
  public round?: string

  @property({
    reflect: true
  })
  public scrollbar?: 'large' | 'small'

  @property({
    reflect: true
  })
  public spacing?: string

  @property({
    reflect: true
  })
  public valign?: 'between' | 'center' | 'end' | 'evenly' | 'start'

  @property({
    reflect: true
  })
  public vmargin?: string

  @property({
    reflect: true
  })
  public vpadding?: string

  @property({
    reflect: true
  })
  public vposition?: 'bottom' | 'top'

  @property({
    reflect: true
  })
  public weight?: 'bold' | 'light' | 'medium'

  @property({
    reflect: true
  })
  public width?: string

  @property({
    reflect: true,
    type: Boolean
  })
  public wrap?: boolean

  public get breakpoint (): string {
    return window.getComputedStyle(this, '::after').content.slice(1, -1)
  }

  public get shadowBody (): HTMLSlotElement {
    return this.bodySlotElement
  }

  public get dataLeafElements (): NodeListOf<NodeElement> {
    return this.querySelectorAll<NodeElement>('scola-button, scola-format, scola-input, scola-media, scola-picker, scola-select, scola-slider, scola-svg, scola-textarea')
  }

  public get dataNodeElements (): NodeListOf<NodeElement> {
    return this.querySelectorAll<NodeElement>('scola-form, scola-list, scola-reloader, scola-struct')
  }

  public get hasDataLeafElements (): boolean {
    return this.querySelector<NodeElement>('scola-button, scola-format, scola-input, scola-media, scola-picker, scola-select, scola-slider, scola-svg, scola-textarea') !== null
  }

  public get hasDataNodeElements (): boolean {
    return this.querySelector<NodeElement>('scola-form, scola-list, scola-reloader, scola-struct') !== null
  }

  public get hasScopedNodeElements (): boolean {
    return this.querySelector<NodeElement>(':scope > scola-form, :scope > scola-list, :scope > scola-reloader, :scope > scola-struct') !== null
  }

  public get scopedDataNodeElements (): NodeListOf<NodeElement> {
    return this.querySelectorAll<NodeElement>(':scope > scola-form, :scope > scola-list, :scope > scola-reloader, :scope > scola-struct')
  }

  @query('slot[name="after"]', true)
  protected afterSlotElement: HTMLSlotElement

  @query('slot[name="before"]', true)
  protected beforeSlotElement: HTMLSlotElement

  @query('slot[name="body"]', true)
  protected bodySlotElement: HTMLSlotElement

  @query('slot:not([name])', true)
  protected defaultSlotElement: HTMLSlotElement

  @query('slot[name="footer"]', true)
  protected footerSlotElement: HTMLSlotElement

  @query('slot[name="header"]', true)
  protected headerSlotElement: HTMLSlotElement

  @query('slot[name="prefix"]', true)
  protected prefixSlotElement: HTMLSlotElement

  @query('slot[name="suffix"]', true)
  protected suffixSlotElement: HTMLSlotElement

  protected handleContextmenuBound = this.handleContextmenu.bind(this)

  protected handleLogBound = this.handleLog.bind(this)

  protected handleSetParamsBound = this.handleSetParams.bind(this)

  protected handleSetPropsBound = this.handleSetProps.bind(this)

  protected handleToggleParamsBound = this.handleToggleParams.bind(this)

  protected handleTogglePropsBound = this.handleToggleProps.bind(this)

  protected observeRootElement?: HTMLElement

  protected observers: Set<NodeElement> = new Set<NodeElement>()

  protected updaters = NodeElement.updaters

  public addObserver (element: NodeElement): void {
    this.observers.add(element)
  }

  public connectedCallback (): void {
    this.setUpWindowListeners()
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    this.tearDownWindowListeners()

    if (!this.isConnected) {
      this.tearDownObservers()
    }

    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.setUpElementListeners()
    this.setUpObservers(properties)
    this.setUpPresets()
    super.firstUpdated(properties)
  }

  public observedUpdate (properties: PropertyValues, element: NodeElement): void {
    this.observe
      ?.split(' ')
      .forEach((observe) => {
        const [
          updaterName,
          id
        ] = observe.split('@')

        if (
          id === element.id &&
          typeof updaterName === 'string'
        ) {
          this.updaters[updaterName]?.(this, element, properties)
        }
      })
  }

  public removeObserver (element: NodeElement): void {
    this.observers.delete(element)
  }

  public render (): TemplateResult {
    return html`
      <slot name="header"></slot>
      <slot name="body">
        <slot name="before"></slot>
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
        <slot name="after"></slot>
      </slot>
      <slot name="footer"></slot>
    `
  }

  public setDataOn (elements: NodeListOf<NodeElement>): void {
    elements.forEach((element) => {
      if (element.noData !== true) {
        if (element.name === '') {
          element.data = this.data
        } else if (
          isStruct(this.data) &&
          this.data[element.name] !== undefined
        ) {
          element.data = this.data[element.name]
        }
      }
    })
  }

  public setParameters (parameters: Struct): void {
    Object
      .entries(parameters)
      .forEach(([name, value]) => {
        this.parameters[name] = cast(value)
      })

    this.requestUpdate('parameters')
  }

  public setProperties (properties: Struct): void {
    Object
      .entries(properties)
      .forEach(([name, value]) => {
        Object.assign(this, {
          [name]: cast(value)
        })
      })
  }

  public toggleParameters (parameters: Struct): void {
    Object
      .entries(parameters)
      .forEach(([name, value]) => {
        const newValue = cast(value)

        if (newValue === this.parameters[name]) {
          this.parameters[name] = undefined
        } else {
          this.parameters[name] = newValue
        }
      })

    this.requestUpdate('parameters')
  }

  public toggleProperties (properties: Struct): void {
    Object
      .entries(properties)
      .forEach(([name, value]) => {
        const newValue = cast(value)

        if (newValue === this[name as keyof NodeElement]) {
          Object.assign(this, {
            [name]: undefined
          })
        } else {
          Object.assign(this, {
            [name]: newValue
          })
        }
      })
  }

  public update (properties: PropertyValues): void {
    this.observers.forEach((observer) => {
      observer.observedUpdate(properties, this)
    })

    super.update(properties)
  }

  protected dispatchEvents (items?: unknown[], cause?: CustomEvent<Struct | null>): void {
    let filter = /.*/u

    if (
      isStruct(cause?.detail) &&
      typeof cause?.detail.filter === 'string'
    ) {
      filter = new RegExp(cause.detail.filter, 'u')
    }

    const events = this.dispatch?.split(' ')

    items?.forEach((item) => {
      events?.forEach((event) => {
        if (filter.test(event)) {
          const [
            eventType,
            id
          ] = event.split('@')

          this.dispatchEvent(new CustomEvent(eventType, {
            bubbles: true,
            composed: true,
            detail: {
              data: item,
              filter: this.dispatchFilter,
              origin: this,
              target: id
            }
          }))
        }
      })
    })
  }

  protected async ease (from: number, to: number, callback: (value: number) => void, duration = this.duration): Promise<void> {
    return new Promise((resolve) => {
      const element = document.body.appendChild(document.createElement('div'))

      const animation = element.animate([{
        left: `${from}px`
      }, {
        left: `${to}px`
      }], {
        duration,
        easing: this.easing,
        fill: 'forwards'
      })

      function frame (): void {
        callback(parseFloat(window.getComputedStyle(element).left))

        if (animation.playState === 'finished') {
          element.remove()
          resolve()
        } else {
          window.requestAnimationFrame(frame)
        }
      }

      window.requestAnimationFrame(frame)
    })
  }

  protected findObserveRootElement (): HTMLElement {
    if (this.observeScope === 'body') {
      return document.body
    }

    let element: HTMLElement | null = this as HTMLElement

    while (element !== null) {
      if (element.parentNode?.nodeName.toLowerCase() === 'scola-view') {
        return element
      }

      if (element instanceof HTMLSlotElement) {
        const rootNode = element.getRootNode()

        if (
          rootNode instanceof ShadowRoot &&
             rootNode.host instanceof HTMLElement
        ) {
          element = rootNode.host
        } else {
          element = element.parentElement
        }
      } else {
        element = element.parentElement
      }
    }

    return document.body
  }

  protected handleContextmenu (event: MouseEvent): boolean {
    event.preventDefault()

    if (
      this.contextMenu === undefined ||
      this.contextMenu === 'off'
    ) {
      return false
    }

    this.dispatchEvent(new CustomEvent('scola-dialog-show', {
      bubbles: true,
      composed: true,
      detail: {
        data: {
          style: {
            left: event.clientX,
            top: event.clientY
          }
        },
        origin: this,
        target: this.contextMenu
      }
    }))

    return false
  }

  protected handleLog (event: CustomEvent<Struct | null>): void {
    if (
      isStruct(event.detail?.data) &&
      typeof event.detail?.data.level === 'string' &&
      LogLevel[event.detail.data.level] >= LogLevel[this.logLevel]
    ) {
      event.cancelBubble = true

      if (event.detail.data.code === undefined) {
        this.logs = []
      } else {
        this.logs = this.logs.concat(event.detail.data)
      }
    }
  }

  protected handleSetParams (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isStruct(data)) {
        if (
          typeof data.name === 'string' &&
          isPrimitive(data.value)
        ) {
          this.setParameters({
            [data.name]: data.value
          })
        } else {
          this.setParameters(data)
        }
      }
    }
  }

  protected handleSetProps (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isStruct(data)) {
        if (
          typeof data.name === 'string' &&
          isPrimitive(data.value)
        ) {
          this.setProperties({
            [data.name]: data.value
          })
        } else {
          this.setProperties(data)
        }
      }
    }
  }

  protected handleToggleParams (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isStruct(data)) {
        if (
          typeof data.name === 'string' &&
          isPrimitive(data.value)
        ) {
          this.toggleParameters({
            [data.name]: data.value
          })
        } else {
          this.toggleParameters(data)
        }
      }
    }
  }

  protected handleToggleProps (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isStruct(data)) {
        if (
          typeof data.name === 'string' &&
          isPrimitive(data.value)
        ) {
          this.toggleProperties({
            [data.name]: data.value
          })
        } else {
          this.toggleProperties(data)
        }
      }
    }
  }

  protected isTarget (event: CustomEvent, cancel = true): boolean {
    if (
      isStruct(event.detail) &&
      typeof event.detail.target === 'string'
    ) {
      if (event.detail.target !== this.id) {
        return false
      }
    } else if (!event.composedPath().includes(this)) {
      return false
    }

    event.cancelBubble = cancel
    return true
  }

  protected replaceParameters (string: string, parameters?: Struct): string {
    return string
      .match(/:[a-z]\w+/gu)
      ?.reduce((result, match) => {
        const regExp = new RegExp(match, 'gu')
        const value = parameters?.[match.slice(1)]

        if (isPrimitive(value)) {
          return result.replace(regExp, value.toString())
        }

        return result.replace(regExp, '')
      }, string) ?? string
  }

  protected setUpElementListeners (): void {
    if (this.logLevel !== 'off') {
      this.addEventListener('scola-log', this.handleLogBound)
    }

    if (this.contextMenu !== undefined) {
      this.addEventListener('contextmenu', this.handleContextmenuBound)
    }
  }

  protected setUpObservers (properties: PropertyValues): void {
    if (this.observe !== undefined) {
      this.observeRootElement = this.findObserveRootElement()

      this.observe
        .split(' ')
        .forEach((observe) => {
          const [,id] = observe.split('@')

          if (typeof id === 'string') {
            const element = this.observeRootElement?.querySelector(`#${id}`)

            if (element instanceof NodeElement) {
              this.observedUpdate(properties, element)
              element.addObserver(this)
            }
          }
        })
    }
  }

  protected setUpPresets (): void {
    this.preset
      ?.split(' ')
      .forEach((presetName) => {
        const properties: Struct = {}

        Object
          .entries(NodeElement.presets[presetName as keyof Presets] ?? {})
          .forEach(([propertyName, propertyValue]) => {
            if (this[propertyName as keyof NodeElement] === undefined) {
              properties[propertyName] = propertyValue
            }
          })

        Object.assign(this, properties)
      })
  }

  protected setUpWindowListeners (): void {
    if (this.listen?.includes('params') === true) {
      window.addEventListener('scola-node-set-params', this.handleSetParamsBound)
      window.addEventListener('scola-node-toggle-params', this.handleToggleParamsBound)
    }

    if (this.listen?.includes('props') === true) {
      window.addEventListener('scola-node-set-props', this.handleSetPropsBound)
      window.addEventListener('scola-node-toggle-props', this.handleTogglePropsBound)
    }
  }

  protected tearDownObservers (): void {
    if (this.observe !== undefined) {
      this.observe
        .split(' ')
        .forEach((observe) => {
          const [,id] = observe.split('@')

          if (typeof id === 'string') {
            const element = this.observeRootElement?.querySelector(`#${id}`)

            if (element instanceof NodeElement) {
              element.removeObserver(this)
            }
          }
        })

      this.observers.clear()
    }
  }

  protected tearDownWindowListeners (): void {
    if (this.listen?.includes('params') === true) {
      window.removeEventListener('scola-node-set-params', this.handleSetParamsBound)
      window.removeEventListener('scola-node-toggle-params', this.handleToggleParamsBound)
    }

    if (this.listen?.includes('props') === true) {
      window.removeEventListener('scola-node-set-props', this.handleSetPropsBound)
      window.removeEventListener('scola-node-toggle-props', this.handleTogglePropsBound)
    }
  }
}
