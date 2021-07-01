import { NodeElement } from './node'
import { customElement } from 'lit/decorators.js'

declare global {
  interface HTMLElementTagNameMap {
    'scola-event': EventElement
  }
}

@customElement('scola-event')
export class EventElement extends NodeElement {
  public firstUpdated (): void {
    this.dispatchEvents()
  }
}
