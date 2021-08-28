import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

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
    if (this.interval !== undefined) {
      this.setUpInterval()
    }

    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    if (this.interval !== undefined) {
      this.tearDownInterval()
    }

    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    if (this.wait !== true) {
      this.dispatchEvents(this.createEventData())
    }

    super.firstUpdated(properties)
  }

  protected createEventData (event?: CustomEvent<Struct | null>): Struct {
    const data = {
      ...this.dataset
    }

    if (isStruct(this.data)) {
      Object.assign(data, this.data)
    }

    if (isStruct(event?.detail?.data)) {
      Object.assign(data, event?.detail?.data)
    }

    return data
  }

  protected handleEvent (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.dispatchEvents(this.createEventData(event), event)
    }
  }

  protected setUpElementListeners (): void {
    this.addEventListener('scola-event', this.handleEventBound)
    super.setUpElementListeners()
  }

  protected setUpInterval (): void {
    this.intervalId = window.setInterval(() => {
      this.dispatchEvents(this.createEventData())
    }, this.interval)
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-event', this.handleEventBound)
    super.setUpWindowListeners()
  }

  protected tearDownInterval (): void {
    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId)
    }
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-event', this.handleEventBound)
    super.tearDownWindowListeners()
  }
}
