import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import { customElement } from 'lit/decorators.js'

declare global {
  interface HTMLElementTagNameMap {
    'scola-struct': StructElement
  }
}

@customElement('scola-struct')
export class StructElement extends NodeElement {
  protected updaters = StructElement.updaters

  public update (properties: PropertyValues): void {
    if (properties.has('data')) {
      this.handleData()
    }

    super.update(properties)
  }

  protected handleData (): void {
    if (this.hasDataNodeElements) {
      this.setNodeData()
    } else {
      this.setLeafData()
    }
  }
}
