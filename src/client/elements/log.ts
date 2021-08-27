import type { CSSResultGroup, PropertyValues, TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FormatElement } from './format'
import { NodeElement } from './node'
import { isObject } from '../../common'
import { render } from 'lit'
import styles from '../styles/log'
import updaters from '../updaters/log'

declare global {
  interface HTMLElementEventMap {
    'scola-log-hide': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-log': LogElement
  }

  interface WindowEventMap {
    'scola-log-hide': CustomEvent
  }
}

@customElement('scola-log')
export class LogElement extends NodeElement {
  public static styles: CSSResultGroup[] = [
    ...NodeElement.styles,
    styles
  ]

  public static updaters = {
    ...NodeElement.updaters,
    ...updaters
  }

  @property({
    attribute: false
  })
  public logs: Array<Record<string, unknown>>

  @property({
    type: Number
  })
  public timeout?: number

  protected handleHideBound: (event: CustomEvent) => void

  protected log?: Record<string, unknown>

  protected templateElement: NodeElement | null

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

  public async hide (): Promise<void> {
    if (this.hidden) {
      return
    }

    if (this.logs.length > 0) {
      this.showNext()
      return
    }

    const { scrollHeight } = this.defaultSlotElement

    await this.defaultSlotElement
      .animate([{
        marginTop: '0px'
      }, {
        marginTop: `-${scrollHeight}px`
      }], {
        duration: this.duration,
        easing: this.easing
      })
      .finished
      .then(() => {
        this.defaultSlotElement.style.setProperty('margin-top', `-${scrollHeight}px`)
        this.hidden = true
      })
  }

  public async show (): Promise<void> {
    if (!this.hidden) {
      return
    }

    this.defaultSlotElement.style.setProperty('opacity', '0')
    this.defaultSlotElement.style.setProperty('position', 'absolute')

    await new Promise((resolve) => {
      window.setTimeout(resolve)
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
        duration: this.duration,
        easing: this.easing
      })
      .finished
      .then(() => {
        this.defaultSlotElement.style.removeProperty('opacity')
        this.defaultSlotElement.style.removeProperty('position')
        this.defaultSlotElement.style.setProperty('margin-top', '0px')
      })
  }

  public showNext (): void {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }

    const log = this.logs.shift()

    if (!isObject(log)) {
      this.hide().catch(() => {})
      return
    }

    render(this.renderTemplate(log), this)
    this.show().catch(() => {})

    let { timeout } = this

    if (typeof log.timeout === 'number') {
      ({ timeout } = log)
    }

    if (timeout === 0) {
      timeout = 3000
    }

    if (timeout !== undefined) {
      this.timeoutId = window.setTimeout(() => {
        this.showNext()
      }, timeout)
    }
  }

  public update (properties: PropertyValues): void {
    if (properties.has('logs')) {
      if (this.logs.length > 0) {
        if (
          this.timeout === undefined ||
          this.timeoutId === undefined
        ) {
          this.showNext()
        }
      }
    }

    super.update(properties)
  }

  protected handleHide (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.hide().catch(() => {})
    }
  }

  protected renderTemplate (log: Record<string, unknown>): Node | TemplateResult | undefined {
    let element = null

    if (log.template instanceof HTMLElement) {
      element = log.template
    } else {
      element = this.templateElement?.cloneNode(true)
    }

    if (element instanceof NodeElement) {
      element.removeAttribute('slot')

      element.dataLeafElements.forEach((dataLeafElement) => {
        dataLeafElement.data = log.data

        if (
          dataLeafElement instanceof FormatElement &&
          typeof log.code === 'string'
        ) {
          dataLeafElement.code = log.code
        }
      })
    }

    return element
  }
}
