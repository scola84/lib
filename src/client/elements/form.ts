import { Mutator, Observer, Propagator } from '../helpers'
import { isError, isStruct, setPush } from '../../common'
import type { ScolaElement } from './element'
import type { ScolaFieldElement } from './field'
import { ScolaInputElement } from './input'
import { ScolaSelectElement } from './select'
import { ScolaTextAreaElement } from './textarea'
import type { Struct } from '../../common'

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

  public get data (): unknown {
    return this.serialize()
  }

  public set data (data: unknown) {
    this.toggleDisabled()
    this.propagator.setData(data)
    this.focusElement()
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
    this.toggleDisabled()
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

  public falsify (): void {
    this.fieldElements.forEach((element) => {
      element.falsify()
    })
  }

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.propagator.dispatchEvents('update')
  }

  public reset (): void {
    this.fieldElements.forEach((fieldElement) => {
      fieldElement.reset()
    })
  }

  public toJSON (): unknown {
    return {
      fieldElements: this.fieldElements.length,
      id: this.id,
      is: this.getAttribute('is'),
      nodeName: this.nodeName
    }
  }

  public verify (): void {
    this.fieldElements.forEach((element) => {
      element.verify()
    })
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-form-error', this.handleErrorBound)
    this.addEventListener('sc-form-focus', this.handleFocusBound)
    this.addEventListener('sc-form-reset', this.handleResetBound)
    this.addEventListener('submit', this.handleSubmitBound)
  }

  protected focusElement (): void {
    if (!this.hasAttribute('hidden')) {
      const element = this.querySelector('[sc-focus~="form"]')

      if (element instanceof HTMLElement) {
        element.parentElement?.setAttribute('tabindex', '0')
        element.parentElement?.focus()
        element.parentElement?.removeAttribute('tabindex')
        element.focus()
      }
    }
  }

  protected focusInvalidElement (): void {
    if (!this.hasAttribute('hidden')) {
      const element = this.querySelector('[aria-invalid="true"]:not([hidden])')

      if (element instanceof HTMLElement) {
        element.parentElement?.setAttribute('tabindex', '0')
        element.parentElement?.focus()
        element.parentElement?.removeAttribute('tabindex')
        element.focus()
      }
    }
  }

  protected handleError (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.setErrors(event.detail)
      this.focusInvalidElement()
      this.notify()
    }
  }

  protected handleFocus (): void {
    this.focusElement()
  }

  protected handleObserver (): void {
    this.toggleDisabled()
    this.focusElement()
  }

  protected handleReset (): void {
    this.reset()
    this.notify()
  }

  protected handleSubmit (event: Event): void {
    event.preventDefault()
    this.setValues()

    if (this.checkValidity()) {
      this.propagator.dispatchEvents('submit', [this.data], event)
    } else {
      this.falsify()
      this.focusInvalidElement()
      this.notify()
    }
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

  protected setErrors (data: Struct): void {
    this.fieldElements.forEach((fieldElement) => {
      const error = data[fieldElement.name]

      if (isError(error)) {
        fieldElement.error = error
      } else {
        fieldElement.error = undefined
      }
    })
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
      .querySelectorAll('button, input, select, textarea')
      .forEach((element) => {
        element.toggleAttribute('disabled', force)
      })
  }
}
