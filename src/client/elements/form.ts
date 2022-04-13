import { Mutator, Observer, Propagator } from '../helpers'
import { Struct, isStruct, setPush } from '../../common'
import type { ScolaElement } from './element'
import type { ScolaError } from '../../common'
import type { ScolaFieldElement } from './field'
import { ScolaInputElement } from './input'
import { ScolaSelectElement } from './select'
import { ScolaTextAreaElement } from './textarea'

declare global {
  interface HTMLElementEventMap {
    'sc-form-error': CustomEvent
    'sc-form-reset': CustomEvent
    'sc-form-focus': CustomEvent
  }
}

export class ScolaFormElement extends HTMLFormElement implements ScolaElement {
  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public valid = true

  public get data (): unknown {
    return this.serialize()
  }

  public set data (data: unknown) {
    this.valid = true
    this.toggleDisabled()
    this.changeFocus()
    this.propagator.set(data)
    this.notify()
  }

  public get fieldElements (): ScolaFieldElement[] {
    const elements: ScolaFieldElement[] = []

    for (const element of Array.from(this.elements)) {
      if (
        element instanceof ScolaInputElement ||
        element instanceof ScolaSelectElement ||
        element instanceof ScolaTextAreaElement
      ) {
        elements.push(element)
      }
    }

    return elements
  }

  protected handleErrorBound = this.handleError.bind(this)

  protected handleFocusBound = this.handleFocus.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleResetBound = this.handleReset.bind(this)

  protected handleSubmitBound = this.handleSubmit.bind(this)

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
  }

  public static define (): void {
    customElements.define('sc-form', ScolaFormElement, {
      extends: 'form'
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

  public getErrors (): Struct<ScolaError> {
    return this.fieldElements.reduce<Struct<ScolaError>>((errors, fieldElement) => {
      const { error } = fieldElement

      if (error !== undefined) {
        errors[fieldElement.name] = error
      }

      return errors
    }, Struct.create())
  }

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.propagator.dispatch('update')
  }

  public reset (): void {
    this.valid = true

    this.fieldElements.forEach((fieldElement) => {
      fieldElement.reset()
    })
  }

  public setErrors (data: unknown): void {
    this.valid = false
    this.propagator.set(data)
    this.notify()
  }

  public toJSON (): unknown {
    return {
      fieldElements: this.fieldElements.length,
      id: this.id,
      is: this.getAttribute('is'),
      nodeName: this.nodeName,
      valid: this.valid
    }
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-form-error', this.handleErrorBound)
    this.addEventListener('sc-form-focus', this.handleFocusBound)
    this.addEventListener('sc-form-reset', this.handleResetBound)
    this.addEventListener('submit', this.handleSubmitBound)
  }

  protected changeFocus (): void {
    if (!this.valid) {
      this.focusErrorElement()
    } else if (!this.hasAttribute('hidden')) {
      this.focusElement()
    }
  }

  protected focusElement (): void {
    const element = this.querySelector('[sc-focus~="form"]')

    if (element instanceof HTMLElement) {
      element.focus()
    }
  }

  protected focusErrorElement (): void {
    const element = this.querySelector('[sc-field-error]:not([hidden]')

    if (element instanceof HTMLElement) {
      if (element.parentElement?.hasAttribute('tabindex') === false) {
        element.parentElement.setAttribute('tabindex', '0')
        element.parentElement.focus()
        element.parentElement.removeAttribute('tabindex')
      }

      element.focus()
    }
  }

  protected handleError (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.setErrors(event.detail)
    }
  }

  protected handleFocus (): void {
    this.changeFocus()
  }

  protected handleObserver (): void {
    this.toggleDisabled()
    this.changeFocus()
  }

  protected handleReset (): void {
    this.reset()
  }

  protected handleSubmit (event: Event): void {
    event.preventDefault()
    this.setValues()

    if (!this.checkValidity()) {
      const errors = this.getErrors()

      this.setErrors(errors)
      this.propagator.dispatch<Struct<ScolaError>>('error', [errors], event)
      return
    }

    this.valid = true
    this.propagator.dispatch('submit', [this.data], event)
  }

  protected isFieldElement (element: Element): element is ScolaFieldElement {
    return (
      element instanceof ScolaInputElement ||
      element instanceof ScolaSelectElement ||
      element instanceof ScolaTextAreaElement
    )
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-form-error', this.handleErrorBound)
    this.removeEventListener('sc-form-focus', this.handleFocusBound)
    this.removeEventListener('sc-form-reset', this.handleResetBound)
    this.removeEventListener('submit', this.handleSubmitBound)
  }

  protected serialize (): Struct {
    const data = {}

    for (const element of this.fieldElements) {
      if (!(
        element.disabled ||
        element.name === ''
      )) {
        setPush(data, element.qualifiedName, element.valueAsCast)
      }
    }

    return data
  }

  protected setValues (): void {
    this.fieldElements.forEach((fieldElement) => {
      const value = fieldElement.getAttribute('sc-value')

      switch (value) {
        case '$created_local':
          fieldElement.data = new Date()
          break
        case '$updated_local':
          fieldElement.data = new Date()
          break
        default:
          break
      }
    })
  }

  protected toggleDisabled (): void {
    const force = this.hasAttribute('hidden')

    this
      .querySelectorAll('fieldset')
      .forEach((element) => {
        element.toggleAttribute('disabled', force)
      })
  }
}
