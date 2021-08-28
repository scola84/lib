import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'
import { customElement } from 'lit/decorators.js'

declare global {
  interface HTMLElementTagNameMap {
    'scola-struct': StructElement
  }

  interface WindowEventMap {
    'scola-struct-set-data': CustomEvent
  }
}

@customElement('scola-struct')
export class StructElement extends NodeElement {
  protected handleSetDataBound: (event: CustomEvent) => void

  protected updaters = StructElement.updaters

  public constructor () {
    super()
    this.handleSetDataBound = this.handleSetData.bind(this)
  }

  public connectedCallback (): void {
    window.addEventListener('scola-struct-set-data', this.handleSetDataBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    window.removeEventListener('scola-struct-set-data', this.handleSetDataBound)
    super.disconnectedCallback()
  }

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

  protected handleSetData (event: CustomEvent<Struct | null>): void {
    this.data = event.detail?.data
  }
}
