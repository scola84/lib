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

const LogLevel = {
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

  @property({
    attribute: 'at-large',
    reflect: true,
    type: Boolean
  })
  public atLarge?: boolean

  @property({
    attribute: 'at-medium',
    reflect: true,
    type: Boolean
  })
  public atMedium?: boolean

  @property({
    attribute: 'at-small',
    reflect: true,
    type: Boolean
  })
  public atSmall?: boolean

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
  public height?: string | 'auto' | 'flex' | 'max' | 'min'

  @property({
    reflect: true,
    type: Boolean
  })
  public hidden: boolean

  @property({
    reflect: true
  })
  public hmargin?: 'large' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public hpadding?: 'large' | 'medium' | 'small'

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
    reflect: true,
    type: Number
  })
  public innerHeight?: number | 'max' | 'min'

  @property({
    attribute: 'inner-shadow',
    reflect: true
  })
  public innerShadow?: 'large' | 'medium' | 'small'

  @property({
    attribute: 'inner-width',
    reflect: true,
    type: Number
  })
  public innerWidth?: number | 'max' | 'min'

  @property()
  public is?: string

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
  public margin?: 'large' | 'medium' | 'small'

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
  public outerShadow?: 'large' | 'medium' | 'min' | 'small'

  @property({
    reflect: true
  })
  public padding?: 'large' | 'medium' | 'small'

  @property({
    attribute: false
  })
  public parameters: Record<string, unknown> = {}

  @property()
  public preset?: keyof Presets

  @property({
    reflect: true
  })
  public round?: 'large' | 'max' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public scrollbar?: 'large' | 'small'

  @property({
    reflect: true
  })
  public spacing?: 'large' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public valign?: 'between' | 'center' | 'end' | 'evenly' | 'start'

  @property({
    reflect: true
  })
  public vmargin?: 'large' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public vpadding?: 'large' | 'medium' | 'small'

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
  public width?: string | 'auto' | 'flex' | 'max' | 'min'

  @property({
    reflect: true,
    type: Boolean
  })
  public wrap?: boolean

  public get shadowBody (): HTMLSlotElement {
    return this.bodySlotElement
  }

  public get dataLeafElements (): NodeListOf<NodeElement> {
    return this.querySelectorAll<NodeElement>('scola-button, scola-format, scola-input, scola-media, scola-picker, scola-select, scola-slider')
  }

  public get dataNodeElements (): NodeListOf<NodeElement> {
    return this.querySelectorAll<NodeElement>('scola-form, scola-list, scola-svg')
  }

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

  protected observeRootElement?: HTMLElement

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

    if (this.observe !== undefined) {
      this.observeRootElement = this.findObserveRootElement()
    }

    window.addEventListener('scola-node-params-set', this.handleParamsSetBound)
    window.addEventListener('scola-node-params-toggle', this.handleParamsToggleBound)
    window.addEventListener('scola-node-props-set', this.handlePropsSetBound)
    window.addEventListener('scola-node-props-toggle', this.handlePropsToggleBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    if (!this.isConnected) {
      this.observe
        ?.split(' ')
        .forEach((id) => {
          const element = this.observeRootElement?.querySelector(`#${id}`)

          if (element instanceof NodeElement) {
            element.removeObserver(this)
          }
        })

      this.observers.clear()
    }

    super.disconnectedCallback()
  }

  public findObserveRootElement (): HTMLElement {
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

  public firstUpdated (properties: PropertyValues): void {
    if (this.logLevel !== 'off') {
      this.addEventListener('scola-log', this.handleLog.bind(this))
    }

    if (this.contextMenu !== undefined) {
      this.addEventListener('contextmenu', this.handleContextmenu.bind(this))
    }

    this.observe
      ?.split(' ')
      .forEach((observe) => {
        const [id] = observe.split('.') as Array<string | undefined>

        if (id !== undefined) {
          const element = this.observeRootElement?.querySelector(`#${id}`)

          if (element instanceof NodeElement) {
            this.observedUpdate(properties, element)
            element.addObserver(this)
          }
        }
      })

    super.firstUpdated(properties)
  }

  public observedUpdate (properties: PropertyValues, element: NodeElement): void {
    this.observe
      ?.split(' ')
      .forEach((observe) => {
        const [
          id,
          name
        ] = observe.split('.') as Array<string | undefined>

        if (
          id === element.id &&
          name !== undefined
        ) {
          this.updaters[name]?.(this, element, properties)
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
      .forEach(([key, value]) => {
        this.parameters[key] = cast(value)
      })

    this.requestUpdate('parameters')
  }

  public setProperties (properties: Record<string, unknown>): void {
    Object
      .entries(properties)
      .forEach(([key, value]) => {
        Object.assign(this, {
          [key]: cast(value)
        })
      })
  }

  public toggleParameters (parameters: Record<string, unknown>): void {
    Object
      .entries(parameters)
      .forEach(([key, value]) => {
        const castValue = cast(value)

        if (this.parameters[key] === castValue) {
          this.parameters[key] = undefined
        } else {
          this.parameters[key] = castValue
        }
      })

    this.requestUpdate('parameters')
  }

  public toggleProperties (properties: Record<string, unknown>): void {
    Object
      .entries(properties)
      .forEach(([key, value]) => {
        const castValue = cast(value)

        if (this[key as keyof NodeElement] === castValue) {
          Object.assign(this, {
            [key]: undefined
          })
        } else {
          Object.assign(this, {
            [key]: castValue
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
        let [
          id,
          event
        ] = dispatch.split('.') as Array<string | undefined>

        if (id !== undefined) {
          if (event === undefined) {
            event = id
            id = undefined
          }

          if (new RegExp(filter, 'u').test(dispatch)) {
            this.dispatchEvent(new CustomEvent(event, {
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
          position: {
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
      LogLevel[event.detail.data.level as keyof typeof LogLevel] >= LogLevel[this.logLevel]
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
      event.cancelBubble = true

      if (isObject(event.detail?.data)) {
        this.setParameters(event.detail?.data ?? {})
      }
    }
  }

  protected handleParamsToggle (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true

      if (isObject(event.detail?.data)) {
        this.toggleParameters(event.detail?.data ?? {})
      }
    }
  }

  protected handlePropsSet (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true

      if (isObject(event.detail?.data)) {
        this.setProperties(event.detail?.data ?? {})
      }
    }
  }

  protected handlePropsToggle (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true

      if (isObject(event.detail?.data)) {
        this.toggleProperties(event.detail?.data ?? {})
      }
    }
  }

  protected isTarget (event: CustomEvent, element: Element = this): boolean {
    if (
      isObject(event.detail) &&
      event.detail.target !== undefined
    ) {
      if (event.detail.target !== element.id) {
        return false
      }
    } else if (!event.composedPath().includes(element)) {
      return false
    }

    return true
  }

  protected replaceParameters (string: string, parameters?: Record<string, unknown>): string {
    return string
      .match(/:\w+/gu)
      ?.reduce((result, match) => {
        const value = parameters?.[match.slice(1)]

        if (isPrimitive(value)) {
          return result.replace(new RegExp(match, 'gu'), value.toString())
        }

        return result
      }, string) ?? ''
  }
}
