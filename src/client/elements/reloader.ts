import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import { customElement } from 'lit/decorators.js'
import { isStruct } from '../../common'

declare global {
  interface HTMLElementTagNameMap {
    'scola-reloader': ReloaderElement
  }
}

@customElement('scola-reloader')
export class ReloaderElement extends NodeElement {
  protected updaters = ReloaderElement.updaters

  public update (properties: PropertyValues): void {
    if (properties.has('data')) {
      this.handleData()
    }

    super.update(properties)
  }

  protected handleData (): void {
    if (
      isStruct(this.data) &&
      this.data.reload === true
    ) {
      window.location.reload()
    }
  }
}
