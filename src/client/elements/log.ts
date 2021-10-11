import { customElement, property } from 'lit/decorators.js'
import { FormatElement } from './format'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'
import { isStruct } from '../../common'
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
  public static updaters = {
    ...NodeElement.updaters,
    ...updaters
  }

  @property({
    attribute: false
  })
  public logs: Struct[]

  @property({
    type: Number
  })
  public timeout?: number

  protected element?: Node

  protected handleHideBound = this.handleHide.bind(this)

  protected log?: Struct

  protected templateElement: NodeElement

  protected timeoutId?: number

  protected updaters = LogElement.updaters

  public constructor () {
    super()

    const templateElement = this.querySelector<NodeElement>(':scope > [slot="template"]')

    if (templateElement === null) {
      throw new Error('Template element is null')
    }

    this.templateElement = templateElement
  }

  public async hide (duration = this.duration): Promise<void> {
    if (!this.hidden) {
      if (this.logs.length > 0) {
        this.showNext(duration)
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
        .finally(() => {
          this.hidden = true
        })
    }
  }

  public async show (duration = this.duration): Promise<void> {
    if (this.hidden) {
      this.style.setProperty('display', 'flex')
      this.style.setProperty('opacity', '0')
      this.style.setProperty('position', 'absolute')

      await new Promise((resolve) => {
        window.setTimeout(resolve)
      })

      this.hidden = false
      this.style.removeProperty('opacity')
      this.style.removeProperty('position')

      await this.defaultSlotElement
        .animate([{
          marginTop: `-${this.defaultSlotElement.scrollHeight}px`
        }, {
          marginTop: '0px'
        }], {
          duration,
          easing: this.easing,
          fill: 'forwards'
        })
        .finished
        .finally(() => {
          this.style.removeProperty('display')
        })
    }
  }

  public showNext (duration = this.duration): void {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }

    const log = this.logs.shift()

    if (!isStruct(log)) {
      this.hide(duration).catch(() => {})
      return
    }

    this.renderLog(log)
    this.show(duration).catch(() => {})

    let { timeout } = this

    if (typeof log.timeout === 'number') {
      ({ timeout } = log)
    }

    if (timeout === 0) {
      timeout = 3000
    }

    if (timeout !== undefined) {
      this.timeoutId = window.setTimeout(() => {
        this.showNext(duration)
      }, timeout)
    }
  }

  public update (properties: PropertyValues): void {
    if (properties.has('logs')) {
      this.handleLogs()
    }

    super.update(properties)
  }

  protected handleHide (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.hide().catch(() => {})
    }
  }

  protected handleLogs (): void {
    if (this.logs.length > 0) {
      if (
        this.timeout === undefined ||
        this.timeoutId === undefined
      ) {
        this.showNext()
      }
    } else {
      this.hide().catch(() => {})
    }
  }

  protected renderLog (log: Struct): void {
    if (this.element !== undefined) {
      this.element.parentElement?.removeChild(this.element)
    }

    this.element = this.renderTemplate(log)

    if (this.element !== undefined) {
      this.appendChild(this.element)
    }
  }

  protected renderTemplate (log: Struct): Node | undefined {
    let element = null

    if (log.template instanceof HTMLElement) {
      element = log.template
    } else {
      element = this.templateElement.cloneNode(true)
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

  protected setUpElementListeners (): void {
    this.addEventListener('scola-log-hide', this.handleHideBound)
    super.setUpElementListeners()
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-log-hide', this.handleHideBound)
    super.setUpWindowListeners()
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-log-hide', this.handleHideBound)
    super.tearDownWindowListeners()
  }
}
