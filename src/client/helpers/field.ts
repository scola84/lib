import type { Primitive, ScolaError, Struct } from '../../common'
import { Interactor } from './interactor'
import type { InteractorEvent } from './interactor'
import type { ScolaFieldElement } from '../elements'

declare global {
  interface HTMLElementEventMap {
    'sc-field-clear': CustomEvent
    'sc-field-falsify': CustomEvent
    'sc-field-focus': CustomEvent
    'sc-field-verify': CustomEvent
  }
}

export interface FieldData extends Struct {
  name: string
  value: FieldValue
}

export type FieldValue = Array<Date | File | Primitive | Struct | null> | Date | File | File[] | Primitive | Struct | null

export class Field {
  public element: ScolaFieldElement

  public error?: ScolaError

  public interactor: Interactor

  public value: unknown = ''

  protected handleClearBound = this.handleClear.bind(this)

  protected handleFalsifyBound = this.handleFalsify.bind(this)

  protected handleFocusBound = this.handleFocus.bind(this)

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleResetBound = this.handleReset.bind(this)

  protected handleVerifyBound = this.handleVerify.bind(this)

  public constructor (element: ScolaFieldElement) {
    this.element = element
    this.interactor = new Interactor(element)
    this.reset()
  }

  public clear (): void {
    this.error = undefined
    this.element.toggleAttribute('sc-field-error', false)
    this.element.toggleAttribute('sc-field-valid', false)
  }

  public connect (): void {
    this.interactor.observe(this.handleInteractorBound)
    this.interactor.connect()
    this.addEventListeners()
  }

  public disconnect (): void {
    this.interactor.disconnect()
    this.removeEventListeners()
  }

  public falsify (): void {
    const error = this.element.getError()

    if (error !== null) {
      this.element.setData(error)
    }
  }

  public getData (): FieldData {
    return {
      name: this.element.name,
      value: this.element.getValue()
    }
  }

  public reset (): void {
    this.interactor.keyboard = this.interactor.hasKeyboard
  }

  public setError (error: ScolaError): void {
    this.error = error
    this.element.toggleAttribute('sc-field-error', true)
  }

  public setValid (): void {
    this.clear()
    this.element.toggleAttribute('sc-field-valid', true)
  }

  public setValue (value: unknown): void {
    this.element.setValue(value)
  }

  public toObject (): Struct {
    return {
      name: this.element.name,
      value: this.element.getValue()
    }
  }

  public verify (): void {
    const error = this.element.getError()

    if (error === null) {
      this.setValid()
    }
  }

  protected addEventListeners (): void {
    this.element.addEventListener('sc-field-clear', this.handleClearBound)
    this.element.addEventListener('sc-field-falsify', this.handleFalsifyBound)
    this.element.addEventListener('sc-field-focus', this.handleFocusBound)
    this.element.addEventListener('sc-field-reset', this.handleResetBound)
    this.element.addEventListener('sc-field-verify', this.handleVerifyBound)
  }

  protected handleClear (): void {
    this.clear()
  }

  protected handleFalsify (): void {
    const dispatched = this.element.propagator.dispatch('falsify', [this.getData()])

    if (!dispatched) {
      this.falsify()
    }
  }

  protected handleFocus (): void {
    this.element.focus()
  }

  protected handleInteractor (event: InteractorEvent): boolean {
    switch (event.type) {
      case 'start':
        return this.handleInteractorStart(event)
      default:
        return false
    }
  }

  protected handleInteractorStart (event: InteractorEvent): boolean {
    if (this.interactor.isKeyboard(event.originalEvent)) {
      return this.handleInteractorStartKeyboard(event.originalEvent)
    }

    return false
  }

  protected handleInteractorStartKeyboard (event: KeyboardEvent): boolean {
    if (this.interactor.isKey(event, 'Enter')) {
      this.handleInteractorStartKeyboardEnter(event)
      return true
    }

    return false
  }

  protected handleInteractorStartKeyboardEnter (event: KeyboardEvent): void {
    let on = 'enter'

    if (event.ctrlKey) {
      on = `ctrl${on}`
    }

    this.element.propagator.dispatch(on, [{
      [this.element.name]: this.element.value
    }], event)
  }

  protected handleReset (): void {
    this.element.reset()
  }

  protected handleVerify (): void {
    const dispatched = this.element.propagator.dispatch('verify', [this.getData()])

    if (!dispatched) {
      this.verify()
    }
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('sc-field-clear', this.handleClearBound)
    this.element.removeEventListener('sc-field-falsify', this.handleFalsifyBound)
    this.element.removeEventListener('sc-field-focus', this.handleFocusBound)
    this.element.removeEventListener('sc-field-reset', this.handleResetBound)
    this.element.removeEventListener('sc-field-verify', this.handleVerifyBound)
  }
}
