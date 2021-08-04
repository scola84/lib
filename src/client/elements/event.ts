import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import { isObject } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'scola-event': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-event': EventElement
  }

  interface WindowEventMap {
    'scola-event': CustomEvent
  }
}

@customElement('scola-event')
export class EventElement extends NodeElement {
  @property({
    type: Number
  })
  public interval?: number

  @property({
    type: Boolean
  })
  public wait?: boolean

  protected handleEventBound: (event: CustomEvent) => void

  protected intervalId?: number

  protected updaters = EventElement.updaters

  public constructor () {
    super()
    this.handleEventBound = this.handleEvent.bind(this)
  }

  public connectedCallback (): void {
    window.addEventListener('scola-event', this.handleEventBound)

    if (this.interval !== undefined) {
      this.intervalId = window.setInterval(() => {
        this.dispatchEvents(this.createEventData())
      }, this.interval)
    }

    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    window.removeEventListener('scola-event', this.handleEventBound)

    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId)
    }

    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.addEventListener('scola-event', this.handleEventBound)

    if (this.wait !== true) {
      this.dispatchEvents(this.createEventData())
    }

    super.firstUpdated(properties)
  }

  protected createEventData (event?: CustomEvent<Record<string, unknown> | null>): Record<string, unknown> {
    const data = {
      ...this.dataset
    }

    if (isObject(this.data)) {
      Object.assign(data, this.data)
    }

    if (isObject(event?.detail?.data)) {
      Object.assign(data, event?.detail?.data)
    }

    return data
  }

  protected handleEvent (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.dispatchEvents(this.createEventData(event), event)
    }
  }
}
