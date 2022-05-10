import { Mutator, Observer, Propagator } from '../helpers'
import { isStruct, merge } from '../../common'
import type { ScolaElement } from './element'

export class ScolaTableRowElement extends HTMLTableRowElement implements ScolaElement {
  public datamap: unknown

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public get data (): unknown {
    if (isStruct(this.datamap)) {
      return merge(this.datamap, this.dataset)
    }

    return this.datamap ?? {
      ...this.dataset
    }
  }

  public set data (data: unknown) {
    this.datamap = data
    this.propagator.setData(data)
  }

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
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

  public toJSON (): unknown {
    return {
      data: this.data,
      id: this.id,
      is: this.getAttribute('is'),
      nodeName: this.nodeName
    }
  }
}
