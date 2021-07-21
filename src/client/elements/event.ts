import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import { customElement } from 'lit/decorators.js'

declare global {
  interface HTMLElementTagNameMap {
    'scola-event': EventElement
  }
}

@customElement('scola-event')
export class EventElement extends NodeElement {
  protected updaters = EventElement.updaters

  public firstUpdated (properties: PropertyValues): void {
    this.dispatchEvents()
    super.firstUpdated(properties)
  }
}
