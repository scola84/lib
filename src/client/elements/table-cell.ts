import { absorb, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaTableCellElement extends HTMLTableCellElement implements ScolaElement {
  public datamap: Struct = {}

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleClickBound = this.handleClick.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
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
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public getData (): Struct {
    return absorb(this.dataset, this.datamap, true)
  }

  public reset (): void {}

  public setData (data: unknown): void {
    if (isStruct(data)) {
      Object.assign(this.datamap, data)
      this.propagator.set(data)
    }
  }

  public update (): void {}

  protected addEventListeners (): void {
    if (this.hasAttribute('sc-onclick')) {
      this.addEventListener('click', this.handleClickBound)
    }
  }

  protected handleClick (event: MouseEvent): void {
    this.propagator.dispatch('click', [this.getData()], event)
  }

  protected removeEventListeners (): void {
    if (this.hasAttribute('sc-onclick')) {
      this.removeEventListener('click', this.handleClickBound)
    }
  }
}
