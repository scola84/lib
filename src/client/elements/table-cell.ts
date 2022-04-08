import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'

export class ScolaTableCellElement extends HTMLTableCellElement implements ScolaElement {
  public datamap: unknown

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public get data (): unknown {
    return this.datamap
  }

  public set data (data: unknown) {
    this.datamap = data
    this.propagator.set(data)
  }

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
  }

  public static define (): void {
    customElements.define('sc-table-cell', ScolaTableCellElement, {
      extends: 'td'
    })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public toJSON (): unknown {
    return {
      data: this.data,
      id: this.id,
      is: this.getAttribute('is'),
      nodeName: this.nodeName
    }
  }
}
