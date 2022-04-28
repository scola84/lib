import { Formatter, Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'

export class ScolaTableCellElement extends HTMLTableCellElement implements ScolaElement {
  public datamap: unknown

  public formatter: Formatter

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public get data (): unknown {
    return this.datamap ?? {
      ...this.dataset
    }
  }

  public set data (data: unknown) {
    this.datamap = data
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
