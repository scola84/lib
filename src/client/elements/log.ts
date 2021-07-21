import type { CSSResultGroup, PropertyValues, TemplateResult } from 'lit'
import type { Log, NodeEvent } from './node'
import { css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { ButtonElement } from './button'
import type { FormatElement } from './format'
import { NodeElement } from './node'

declare global {
  interface HTMLElementEventMap {
    'scola-log-hide': NodeEvent
  }

  interface HTMLElementTagNameMap {
    'scola-log': LogElement
  }
}

@customElement('scola-log')
export class LogElement extends NodeElement {
  public static styles: CSSResultGroup[] = [
    ...NodeElement.styles,
    css`
      :host([hidden]) {
        display: flex;
        height: 0;
      }
    `
  ]

  public static updaters = {
    ...NodeElement.updaters,
    node: (source: LogElement, target: NodeElement, properties: PropertyValues): void => {
      if (properties.has('logs')) {
        source.updateNode(target).catch(() => {})
      }
    }
  }

  @property({
    type: Number
  })
  public timeout?: number

  public logs: Log[]

  protected handleHideBound: (event: NodeEvent) => void

  protected log?: Log

  protected templateElement?: NodeElement | null

  protected timeoutId?: number

  protected updaters = LogElement.updaters

  public constructor () {
    super()
    this.handleHideBound = this.handleHide.bind(this)
    this.templateElement = this.querySelector<NodeElement>(':scope > [slot="template"]')
  }

  public connectedCallback (): void {
    window.addEventListener('scola-log-hide', this.handleHideBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    window.removeEventListener('scola-log-hide', this.handleHideBound)
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.addEventListener('scola-log-hide', this.handleHideBound)
    super.firstUpdated(properties)
  }

  public async hide (duration = this.duration): Promise<void> {
    if (this.hidden) {
      return
    }

    if (this.logs.length > 0) {
      await this.showNext(duration)
      return
    }

    await this.defaultSlotElement
      .animate([{
        marginTop: '0px'
      }, {
        marginTop: `-${this.defaultSlotElement.scrollHeight}px`
      }], {
        duration,
        easing: this.easing,
        fill: 'forwards'
      })
      .finished
      .then(() => {
        this.hidden = true
        this.log = undefined
      })
  }

  public render (): TemplateResult {
    const element = this.log?.template ?? this.templateElement?.cloneNode(true)

    if (element instanceof NodeElement) {
      element.removeAttribute('slot')

      element
        .querySelectorAll<ButtonElement>('scola-button')
        .forEach((buttonElement) => {
          if (LogElement.isObject(this.log?.data)) {
            buttonElement.data = this.log?.data
          }
        })

      element
        .querySelectorAll<FormatElement>('scola-format')
        .forEach((formatElement) => {
          formatElement.code = this.log?.code

          if (LogElement.isObject(this.log?.data)) {
            formatElement.data = this.log?.data
          }
        })
    }

    return html`
      <slot name="body">
        <slot>${element}</slot>
      </slot>
    `
  }

  public async show (log: Log, duration = this.duration): Promise<void> {
    this.log = log
    this.requestUpdate()

    if (!this.hidden) {
      return
    }

    this.defaultSlotElement.style.setProperty('opacity', '0')
    this.defaultSlotElement.style.setProperty('position', 'absolute')

    await new Promise((resolve) => {
      setTimeout(resolve)
    })

    this.hidden = false

    await this.defaultSlotElement
      .animate([{
        marginTop: `-${this.defaultSlotElement.scrollHeight}px`,
        opacity: 1,
        position: 'relative'
      }, {
        marginTop: '0px',
        opacity: 1,
        position: 'relative'
      }], {
        duration,
        easing: this.easing,
        fill: 'forwards'
      })
      .finished
      .then(() => {
        this.defaultSlotElement.style.removeProperty('opacity')
        this.defaultSlotElement.style.removeProperty('position')
      })
  }

  public async showNext (duration = this.duration): Promise<void> {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }

    const log = this.logs.shift()

    if (log === undefined) {
      await this.hide(duration)
      return
    }

    await this.show(log, duration)

    let { timeout = this.timeout } = log

    if (timeout === 0) {
      timeout = 3000
    }

    this.timeoutId = window.setTimeout(() => {
      this.showNext(duration).catch(() => {})
    }, timeout)
  }

  public async updateNode (element: NodeElement, duration = this.duration): Promise<void> {
    if (this.timeout === undefined) {
      await this.updateNodeImmediate(element, duration)
    } else {
      await this.updateNodeTimeout(element, duration)
    }
  }

  protected handleHide (event: NodeEvent): void {
    if (this.isTarget(event)) {
      this.hide().catch(() => {})
    }
  }

  protected async updateNodeImmediate (element: NodeElement, duration = this.duration): Promise<void> {
    const log = element.logs
      .splice(0)
      .pop()

    if (log === undefined) {
      await this.hide(duration)
      return
    }

    await this.show(log, duration)
  }

  protected async updateNodeTimeout (element: NodeElement, duration = this.duration): Promise<void> {
    this.logs.splice(this.logs.length, 0, ...element.logs.splice(0))

    if (this.hidden) {
      await this.showNext(duration)
    }
  }
}
