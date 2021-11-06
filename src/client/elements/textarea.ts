import type { ScolaElement } from './element'
import { ScolaField } from '../helpers/field'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaTextAreaElement extends HTMLTextAreaElement implements ScolaElement {
  public error?: Struct

  public field: ScolaField

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public resize: boolean

  protected handleMutationsBound = this.handleMutations.bind(this)

  public constructor () {
    super()
    this.field = new ScolaField(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-textarea', ScolaTextAreaElement, {
      extends: 'textarea'
    })
  }

  public connectedCallback (): void {
    this.observer.connect(this.handleMutationsBound, [
      'value'
    ])

    this.field.connect()
    this.mutator.connect()
    this.propagator.connect()

    window.setTimeout(() => {
      this.update()
    })
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
    this.resize = this.hasAttribute('sc-resize')
  }

  public setData (data: unknown): void {
    this.field.setData(data)
  }

  public update (): void {
    if (this.resize) {
      this.setHeight()
    }
  }

  public updateAttributes (): void {
    this.setAttribute('value', this.value)
  }

  protected handleMutations (): void {
    this.update()
  }

  protected setHeight (): void {
    if (this.scrollHeight > 0) {
      this.style.setProperty('height', '0px')
      this.style.setProperty('height', `${this.scrollHeight}px`)
    }
  }
}
