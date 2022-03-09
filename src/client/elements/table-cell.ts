import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

export class ScolaTableCellElement extends HTMLTableCellElement implements ScolaElement {
  public data: Struct = {}

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

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

  public getData (): Struct {
    return this.data
  }

  public reset (): void {}

  public setData (data: unknown): void {
    if (isStruct(data)) {
      this.data = data
    }

    this.propagator.set(data)
    this.update()
  }

  public toObject (): Struct {
    return this.data
  }

  public update (): void {}
}
