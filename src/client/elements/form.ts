import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'

export class ScolaFormElement extends HTMLFormElement implements ScolaElement {
  [key: string]: unknown

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public get hasFiles (): boolean {
    return this.querySelector('[type="file"]') !== null
  }

  protected handleSubmitBound = this.handleSubmit.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
  }

  public static define (): void {
    customElements.define('sc-form', ScolaFormElement, {
      extends: 'form'
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

  public getData (): FormData | URLSearchParams {
    const formData = new FormData(this)

    if (this.hasFiles) {
      return formData
    }

    return Array
      .from(formData.entries())
      .reduce((params, [name, value]) => {
        params.append(name, String(value))
        return params
      }, new URLSearchParams())
  }

  public reset (): void {}

  public setData (data: unknown): void {
    this.propagator.set(data)
    this.focusErrorElement()
  }

  public update (): void {}

  protected addEventListeners (): void {
    this.addEventListener('submit', this.handleSubmitBound)
  }

  protected focusErrorElement (): void {
    const errorElement = this.querySelector('[sc-error]')

    if (errorElement instanceof HTMLElement) {
      if (errorElement.parentElement?.hasAttribute('tabindex') === false) {
        errorElement.parentElement.setAttribute('tabindex', '0')
        errorElement.parentElement.focus()
        errorElement.parentElement.removeAttribute('tabindex')
      }

      errorElement.focus()
    }
  }

  protected handleSubmit (event: Event): void {
    event.preventDefault()

    this.propagator.dispatch('submit', [{
      body: this.getData(),
      method: this.method
    }], event)
  }

  protected removeEventListeners (): void {
    this.removeEventListener('submit', this.handleSubmitBound)
  }
}
