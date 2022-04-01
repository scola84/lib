import { Mutator, Observer, Propagator } from '../helpers'
import { Struct, setPush } from '../../common'
import type { ScolaElement } from './element'
import type { ScolaError } from '../../common'
import type { ScolaFieldElement } from './field'
import { ScolaInputElement } from './input'
import { ScolaSelectElement } from './select'
import { ScolaTextAreaElement } from './textarea'

declare global {
  interface HTMLElementEventMap {
    'sc-form-reset': CustomEvent
    'sc-form-focus': CustomEvent
  }
}

export class ScolaFormElement extends HTMLFormElement implements ScolaElement {
  [key: string]: unknown

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public get fieldElements (): ScolaFieldElement[] {
    return Array
      .from(this.elements)
      .filter((element) => {
        return (
          element instanceof ScolaInputElement ||
          element instanceof ScolaSelectElement ||
          element instanceof ScolaTextAreaElement
        )
      }) as ScolaFieldElement[]
  }

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

  public getData (): Struct {
    return this.serialize()
  }

  public getErrors (): Struct<ScolaError> {
    return this.fieldElements.reduce<Struct<ScolaError>>((errors, fieldElement) => {
      const error = fieldElement.getError()

      if (error !== null) {
        errors[fieldElement.name] = error
      }

      return errors
    }, Struct.create())
  }

  public reset (): void {
    this.fieldElements.forEach((fieldElement) => {
      fieldElement.reset()
    })
  }

  public setData (data: unknown): void {
    this.toggleDisabled()
    this.changeFocus()
    this.propagator.set(data)
    this.update()
  }

  public toObject (): Struct {
    return this.serialize()
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
    this.addEventListener('sc-form-focus', this.handleFocusBound)
    this.addEventListener('sc-form-reset', this.handleResetBound)
    this.addEventListener('submit', this.handleSubmitBound)
  }

  protected changeFocus (): void {
    if (!this.hasAttribute('hidden')) {
      const element = this.querySelector('[sc-focus~="form"]')

      if (element instanceof HTMLElement) {
        element.focus()
      }
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

      this.propagator.dispatch<Struct<ScolaError>>('error', [errors], event)
      this.setData(errors)
      return
    }

    this.propagator.dispatch('submit', [this.getData()], event)
  }

  protected isFieldElement (element: Element): element is ScolaFieldElement {
    return (
      element instanceof ScolaInputElement ||
      element instanceof ScolaSelectElement ||
      element instanceof ScolaTextAreaElement
    )
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-form-focus', this.handleFocusBound)
    this.removeEventListener('sc-form-reset', this.handleResetBound)
    this.removeEventListener('submit', this.handleSubmitBound)
  }

  protected serialize (): Struct {
    return this.fieldElements.reduce<Struct>((data, element) => {
      const value = element.getValue()

      if (
        element.type === 'radio' &&
        value === null
      ) {
        return data
      }

      return setPush(data, element.name, value)
    }, Struct.create())
  }

  protected setValues (): void {
    this.fieldElements.forEach((fieldElement) => {
      const value = fieldElement.getAttribute('sc-value')

      switch (value) {
        case '$created_local':
          fieldElement.setData(new Date())
          break
        case '$updated_local':
          fieldElement.setData(new Date())
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
