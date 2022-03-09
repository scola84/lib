import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'

export class ScolaLabelElement extends HTMLLabelElement implements ScolaElement {
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
    customElements.define('sc-label', ScolaLabelElement, {
      extends: 'label'
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
    return {}
  }

  public reset (): void {}

  public setData (data: unknown): void {
    this.propagator.set(data)
  }

  public toObject (): Struct {
    return {}
  }

  public update (): void {}
}
