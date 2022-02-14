import { cast, isArray, isPrimitive } from '../../common'
import type { ScolaElement } from './element'
import { ScolaInputElement } from './input'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import { ScolaSelectElement } from './select'
import { ScolaTextAreaElement } from './textarea'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-form-clear': CustomEvent
    'sc-form-focus': CustomEvent
  }
}

export class ScolaFormElement extends HTMLFormElement implements ScolaElement {
  [key: string]: unknown

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleClearBound = this.handleClear.bind(this)

  protected handleFocusBound = this.handleFocus.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

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

  public clear (): void {
    Array
      .from(this.elements)
      .forEach((element) => {
        if (
          element instanceof ScolaInputElement ||
          element instanceof ScolaSelectElement ||
          element instanceof ScolaTextAreaElement
        ) {
          element.clear()
        }
      })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'hidden'
    ])

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
    return Array
      .from(new FormData(this).entries())
      .reduce<Struct>((data, [name, value]) => {
      /* eslint-disable @typescript-eslint/indent */
        let castValue: unknown = value

        if (isPrimitive(value)) {
          castValue = cast(value)
        }

        if (data[name] === undefined) {
          data[name] = castValue
        } else {
          let dataValue = data[name]

          if (!isArray(dataValue)) {
            data[name] = [data[name]]
            dataValue = data[name]
          }

          if (isArray(dataValue)) {
            dataValue.push(castValue)
          }
        }

        return data
      }, {})
      /* eslint-enable @typescript-eslint/indent */
  }

  public getErrors (): Struct {
    return Array
      .from(this.elements)
      .reduce<Struct<Struct>>((errors, element) => {
      /* eslint-disable @typescript-eslint/indent */
        let error = null

        if (
          element instanceof ScolaInputElement ||
          element instanceof ScolaSelectElement ||
          element instanceof ScolaTextAreaElement
        ) {
          error = element.getError()

          if (error !== null) {
            errors[element.name] = error
          }
        }

        return errors
      }, {})
      /* eslint-enable @typescript-eslint/indent */
  }

  public setData (data: unknown): void {
    this.toggleDisabled()
    this.changeFocus()
    this.propagator.set(data)
    this.update()
  }

  public update (): void {
    this.updateElements()
    this.updateAttributes()
    this.propagator.dispatch('update')
  }

  public updateAttributes (): void {
    this.setAttribute('sc-updated', Date.now().toString())
  }

  public updateElements (): void {
    this.focusErrorElement()
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-form-clear', this.handleClearBound)
    this.addEventListener('sc-form-focus', this.handleFocusBound)
    this.addEventListener('submit', this.handleSubmitBound)
  }

  protected changeFocus (): void {
    const element = this.querySelector('[sc-focus~="form"]')

    if (element instanceof HTMLElement) {
      element.focus()
    }
  }

  protected focusErrorElement (): void {
    const element = this.querySelector('[sc-field-error]')

    if (element instanceof HTMLElement) {
      if (element.parentElement?.hasAttribute('tabindex') === false) {
        element.parentElement.setAttribute('tabindex', '0')
        element.parentElement.focus()
        element.parentElement.removeAttribute('tabindex')
      }

      element.focus()
    }
  }

  protected handleClear (): void {
    this.clear()
  }

  protected handleFocus (): void {
    this.changeFocus()
  }

  protected handleObserver (): void {
    this.toggleDisabled()
    this.changeFocus()
  }

  protected handleSubmit (event: Event): void {
    event.preventDefault()

    if (this.checkValidity()) {
      this.setData({})
      this.propagator.dispatch('submit', [this.getData()], event)
    } else {
      this.setData(this.getErrors())
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-form-clear', this.handleClearBound)
    this.removeEventListener('sc-form-focus', this.handleFocusBound)
    this.removeEventListener('submit', this.handleSubmitBound)
  }

  protected toggleDisabled (): void {
    this
      .querySelectorAll('fieldset')
      .forEach((element) => {
        element.toggleAttribute('disabled', this.hasAttribute('hidden'))
      })
  }
}
