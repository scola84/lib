import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'

export class ScolaFieldSetElement extends HTMLFieldSetElement implements ScolaElement {
  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
  }

  public static define (): void {
    customElements.define('sc-fieldset', ScolaFieldSetElement, {
      extends: 'fieldset'
    })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'hidden'
    ])

    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public getData (): void {}

  public isSame (): void {}

  public reset (): void {}

  public setData (data: unknown): void {
    this.toggleDisabled()
    this.propagator.set(data)
  }

  public update (): void {}

  protected changeFocus (): void {
    if (!this.hasAttribute('hidden')) {
      const element = this.querySelector('[sc-focus~="fieldset"]')

      if (element instanceof HTMLElement) {
        element.focus()
      }
    }
  }

  protected handleObserver (): void {
    this.toggleDisabled()
    this.changeFocus()
  }

  protected toggleDisabled (): void {
    this.toggleAttribute('disabled', this.hasAttribute('hidden'))
  }
}
