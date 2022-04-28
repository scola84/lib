import { Formatter, Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'

export class ScolaLegendElement extends HTMLLegendElement implements ScolaElement {
  public formatter: Formatter

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public get data (): unknown {
    return this.formatter.data
  }

  public set data (data: unknown) {
    this.formatter.setData(data)
    this.propagator.setData(data)
    this.update()
  }

  public constructor () {
    super()
    this.formatter = new Formatter(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.update()
  }

  public static define (): void {
    customElements.define('sc-legend', ScolaLegendElement, {
      extends: 'legend'
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
      locale: this.formatter.locale,
      nodeName: this.nodeName,
      text: this.formatter.text,
      title: this.formatter.title
    }
  }

  public update (): void {
    this.formatter.update()
  }
}
