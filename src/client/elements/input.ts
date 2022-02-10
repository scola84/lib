import type { ScolaElement } from './element'
import { ScolaField } from '../helpers/field'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaInputElement extends HTMLInputElement implements ScolaElement {
  public error?: Struct

  public field: ScolaField

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.field = new ScolaField(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
    this.update()
  }

  public static define (): void {
    customElements.define('sc-input', ScolaInputElement, {
      extends: 'input'
    })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'value'
    ])

    this.field.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
  }

  public disconnectedCallback (): void {
    this.field.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public getData (): Struct {
    return this.field.getData()
  }

  public reset (): void {
    this.field.debounce = Number(this.getAttribute('sc-debounce') ?? 250)
  }

  public setData (data: unknown): void {
    this.field.setData(data)
  }

  public update (): void {
    this.updateAttributes()
    this.updateStyle()
  }

  public updateAttributes (): void {
    this.setAttribute('value', this.value)
  }

  public updateStyle (): void {
    if (this.type === 'range') {
      this.style.setProperty('--max', this.max)
      this.style.setProperty('--min', this.min)
      this.style.setProperty('--value', this.value)
    }
  }

  protected handleObserver (): void {
    this.updateStyle()
  }
}
