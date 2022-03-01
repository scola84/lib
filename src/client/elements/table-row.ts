import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

export class ScolaTableRowElement extends HTMLTableRowElement implements ScolaElement {
  public data: Struct = {}

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
  }

  public static define (): void {
    customElements.define('sc-table-row', ScolaTableRowElement, {
      extends: 'tr'
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
