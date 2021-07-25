import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'

declare global {
  interface HTMLElementTagNameMap {
    'scola-event': EventElement
  }
}

@customElement('scola-event')
export class EventElement extends NodeElement {
  @property({
    type: Number
  })
  public interval?: number

  protected intervalHandle?: number

  protected updaters = EventElement.updaters

  public connectedCallback (): void {
    if (this.interval !== undefined) {
      this.intervalHandle = window.setInterval(this.dispatchEvents.bind(this), this.interval)
    }

    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    if (this.intervalHandle !== undefined) {
      window.clearInterval(this.intervalHandle)
    }

    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.dispatchEvents()
    super.firstUpdated(properties)
  }
}
