import type { CSSResultGroup, PropertyValues, TemplateResult } from 'lit'
import type { Log, NodeEvent } from './node'
import { css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
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
        overflow: hidden;
      }
    `
  ]

  @property({
    type: Number
  })
  public duration?: number

  @property({
    type: Number
  })
  public timeout?: number

  public logs: Log[]

  protected log?: Log

  protected templateElement?: NodeElement | null

  protected timeoutId?: number

  public constructor () {
    super()
    this.dir = document.dir
    this.addEventListener('scola-log-hide', this.handleHide.bind(this))
  }

  public connectedCallback (): void {
    this.templateElement = this.querySelector<NodeElement>(':scope > [slot="template"]')
    super.connectedCallback()
  }

  public hideLog (duration = this.duration): void {
    if (this.hidden) {
      return
    }

    if (this.logs.length > 0) {
      this.showNext()
      return
    }

    const { scrollHeight = 0 } = this.defaultSlotElement ?? {}

    this.ease(0, scrollHeight, ({ done, value }) => {
      this.defaultSlotElement?.style.setProperty('margin-top', `-${value}px`)

      if (done) {
        this.hidden = true
        this.log = undefined
      }
    }, {
      duration,
      name: 'log'
    })
  }

  public observedUpdated (properties: PropertyValues, target: NodeElement): void {
    if (properties.has('logs')) {
      if (this.timeout === undefined) {
        this.observedUpdatedImmediate(properties, target)
      } else {
        this.observedUpdatedTimeout(properties, target)
      }
    }

    super.observedUpdated(properties, target)
  }

  public render (): TemplateResult {
    const element = this.log?.template ?? this.templateElement?.cloneNode(true)

    if (element instanceof NodeElement) {
      element.removeAttribute('slot')

      element
        .querySelectorAll('scola-button')
        .forEach((buttonElement) => {
          buttonElement.data = this.log?.data as Record<string, unknown>
        })

      element
        .querySelectorAll('scola-format')
        .forEach((formatElement) => {
          formatElement.code = this.log?.code
          formatElement.data = this.log?.data as Record<string, unknown>
        })
    }

    return html`
      <slot name="body">
        <slot>${element}</slot>
      </slot>
    `
  }

  public showLog (log: Log, duration = this.duration): void {
    this.log = log
    this.requestUpdate()

    if (!this.hidden) {
      return
    }

    window.requestAnimationFrame(() => {
      const { scrollHeight = 0 } = this.defaultSlotElement ?? {}
      this.defaultSlotElement?.style.setProperty('margin-top', `-${scrollHeight}px`)
      this.hidden = false

      this.ease(scrollHeight, 0, ({ value }) => {
        this.defaultSlotElement?.style.setProperty('margin-top', `-${value}px`)
      }, {
        duration,
        name: 'log'
      })
    })
  }

  public showNext (): void {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }

    const log = this.logs.shift()

    if (log === undefined) {
      this.hideLog()
      return
    }

    this.showLog(log)
    const timeout = log.timeout ?? (this.timeout === 0 ? 3000 : this.timeout)
    this.timeoutId = window.setTimeout(this.showNext.bind(this), timeout)
  }

  protected handleHide (): void {
    this.hideLog()
  }

  protected observedUpdatedImmediate (properties: PropertyValues, target: NodeElement): void {
    const log = target.logs.splice(0).pop()

    if (log !== undefined) {
      this.showLog(log)
    }
  }

  protected observedUpdatedTimeout (properties: PropertyValues, target: NodeElement): void {
    this.logs.splice(this.logs.length, 0, ...target.logs.splice(0))

    if (this.hidden) {
      this.showNext()
    }
  }
}
