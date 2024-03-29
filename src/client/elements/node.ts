import type { CSSResultGroup, PropertyValues, TemplateResult } from 'lit'
import { LitElement, html } from 'lit'
import { cast, isObject, isPrimitive } from '../../common'
import { customElement, property, query } from 'lit/decorators.js'
import styles from '../styles/node'

declare global {
  interface HTMLElementEventMap {
    'scola-log': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-node': NodeElement
  }

  interface WindowEventMap {
    'scola-node-params-set': CustomEvent
    'scola-node-params-toggle': CustomEvent
    'scola-node-props-set': CustomEvent
    'scola-node-props-toggle': CustomEvent
  }
}

const LogLevel: Record<string, number> = {
  all: 1,
  err: 4,
  info: 2,
  off: 5,
  warn: 3
}

export interface Presets {
  ''?: Record<string, string | unknown>
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

  public static styles: CSSResultGroup[] = [
    styles
  ]

  public static updaters: Updaters = {}

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
    reflect: true
  })
  public dir: string

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

  @property({
    attribute: 'log-level'
  })
  public logLevel: keyof typeof LogLevel = 'off'

  @property({
    attribute: false
  })
  public logs: Array<Record<string, unknown>> = []

  @property({
    reflect: true
  })
  public margin?: string

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
  public parameters: Record<string, unknown> = {}

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
    return this.querySelectorAll<NodeElement>('scola-button, scola-format, scola-input, scola-media, scola-picker, scola-select, scola-slider')
  }

  public get dataNodeElements (): NodeListOf<NodeElement> {
    return this.querySelectorAll<NodeElement>('scola-form, scola-list, scola-svg')
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

  protected handleParamsSetBound: (event: CustomEvent) => void

  protected handleParamsToggleBound: (event: CustomEvent) => void

  protected handlePropsSetBound: (event: CustomEvent) => void

  protected handlePropsToggleBound: (event: CustomEvent) => void

  protected observers: Set<NodeElement> = new Set<NodeElement>()

  protected updaters = NodeElement.updaters

  public constructor () {
    super()
    this.handleParamsSetBound = this.handleParamsSet.bind(this)
    this.handleParamsToggleBound = this.handleParamsToggle.bind(this)
    this.handlePropsSetBound = this.handlePropsSet.bind(this)
    this.handlePropsToggleBound = this.handlePropsToggle.bind(this)
  }

  public addObserver (element: NodeElement): void {
    this.observers.add(element)
  }

  public connectedCallback (): void {
    window.addEventListener('scola-node-params-set', this.handleParamsSetBound)
    window.addEventListener('scola-node-params-toggle', this.handleParamsToggleBound)
    window.addEventListener('scola-node-props-set', this.handlePropsSetBound)
    window.addEventListener('scola-node-props-toggle', this.handlePropsToggleBound)
    this.setUpPresets()
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    if (!this.isConnected) {
      this.tearDownObservers()
    }

    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    if (this.logLevel !== 'off') {
      this.addEventListener('scola-log', this.handleLog.bind(this))
    }

    if (this.contextMenu !== undefined) {
      this.addEventListener('contextmenu', this.handleContextmenu.bind(this))
    }

    this.setUpObservers(properties)
    super.firstUpdated(properties)
  }

  public observedUpdate (properties: PropertyValues, element: NodeElement): void {
    this.observe
      ?.split(' ')
      .forEach((observe) => {
        const parts = observe.split('@')
        const updaterName = parts.shift()
        const id = parts.shift()

        if (
          id === element.id &&
          updaterName !== undefined
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

  public setParameters (parameters: Record<string, unknown>): void {
    Object
      .entries(parameters)
      .forEach(([name, value]) => {
        this.parameters[name] = cast(value)
      })

    this.requestUpdate('parameters')
  }

  public setProperties (properties: Record<string, unknown>): void {
    Object
      .entries(properties)
      .forEach(([name, value]) => {
        Object.assign(this, {
          [name]: cast(value)
        })
      })
  }

  public toggleParameters (parameters: Record<string, unknown>): void {
    Object
      .entries(parameters)
      .forEach(([name, value]) => {
        const castValue = cast(value)

        if (this.parameters[name] === castValue) {
          this.parameters[name] = undefined
        } else {
          this.parameters[name] = castValue
        }
      })

    this.requestUpdate('parameters')
  }

  public toggleProperties (properties: Record<string, unknown>): void {
    Object
      .entries(properties)
      .forEach(([name, value]) => {
        const castValue = cast(value)

        if (this[name as keyof NodeElement] === castValue) {
          Object.assign(this, {
            [name]: undefined
          })
        } else {
          Object.assign(this, {
            [name]: castValue
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

  protected dispatchEvents (data?: Record<string, unknown>, cause?: CustomEvent<Record<string, unknown> | null>): void {
    let filter = '.*'

    if (
      isObject(cause?.detail) &&
      typeof cause?.detail.filter === 'string'
    ) {
      ({ filter } = cause.detail)
    }

    this.dispatch
      ?.split(' ')
      .forEach((dispatch) => {
        if (new RegExp(filter, 'u').test(dispatch)) {
          const parts = dispatch.split('@')
          const eventType = parts.shift()
          const id = parts.shift()

          if (eventType !== undefined) {
            this.dispatchEvent(new CustomEvent(eventType, {
              bubbles: true,
              composed: true,
              detail: {
                data,
                filter: this.dispatchFilter,
                origin: this,
                target: id
              }
            }))
          }
        }
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

  protected handleLog (event: CustomEvent<Record<string, unknown> | null>): void {
    if (
      isObject(event.detail?.data) &&
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

  protected handleParamsSet (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isObject(data)) {
        if (
          typeof data.name === 'string' &&
          typeof data.value === 'string'
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

  protected handleParamsToggle (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isObject(data)) {
        if (
          typeof data.name === 'string' &&
          typeof data.value === 'string'
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

  protected handlePropsSet (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isObject(data)) {
        if (
          typeof data.name === 'string' &&
          typeof data.value === 'string'
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

  protected handlePropsToggle (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isObject(data)) {
        if (
          typeof data.name === 'string' &&
          typeof data.value === 'string'
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
      isObject(event.detail) &&
      event.detail.target !== undefined
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

  protected replaceParameters (string: string, parameters?: Record<string, unknown>): string {
    return string
      .match(/:[a-z]\w+/gu)
      ?.reduce((result, match) => {
        const regExp = new RegExp(match, 'gu')
        const value = parameters?.[match.slice(1)]

        if (isPrimitive(value)) {
          return result.replace(regExp, value.toString())
        }

        return result.replace(regExp, '')
      }, string) ?? ''
  }

  protected setUpObservers (properties: PropertyValues): void {
    this.observe
      ?.split(' ')
      .forEach((observe) => {
        const id = observe.split('@').pop()

        if (id !== undefined) {
          const element = document.getElementById(id)

          if (element instanceof NodeElement) {
            this.observedUpdate(properties, element)
            element.addObserver(this)
          }
        }
      })
  }

  protected setUpPresets (): void {
    this.preset
      ?.split(' ')
      .forEach((presetName) => {
        const properties: Record<string, unknown> = {}

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

  protected tearDownObservers (): void {
    this.observe
      ?.split(' ')
      .forEach((observe) => {
        const id = observe.split('@').pop()

        if (id !== undefined) {
          const element = document.getElementById(id)

          if (element instanceof NodeElement) {
            element.removeObserver(this)
          }
        }
      })

    this.observers.clear()
  }
}
