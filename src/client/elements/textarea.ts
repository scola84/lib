import { Field, Mutator, Observer, Propagator } from '../helpers'
import type { FieldData, FieldValue } from '../helpers'
import { I18n, Struct, cast, isError, isPrimitive, isStruct, set } from '../../common'
import type { ScolaError } from '../../common'
import type { ScolaFieldElement } from './field'

export class ScolaTextAreaElement extends HTMLTextAreaElement implements ScolaFieldElement {
  public error?: Struct

  public field: Field

  public i18n: I18n

  public initialCode: string | null

  public initialInnerHtml: string

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public resize: boolean

  protected handleInputBound = this.handleInput.bind(this)

  public constructor () {
    super()
    this.field = new Field(this)
    this.i18n = new I18n()
    this.initialCode = this.getAttribute('sc-code')
    this.initialInnerHtml = this.value
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-textarea', ScolaTextAreaElement, {
      extends: 'textarea'
    })
  }

  public connectedCallback (): void {
    this.field.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()

    window.requestAnimationFrame(() => {
      this.update()
    })
  }

  public disconnectedCallback (): void {
    this.field.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public falsify (): void {
    this.field.falsify()
  }

  public getData (): FieldData {
    return this.field.getData()
  }

  public getError (): ScolaError | null {
    let error: ScolaError | null = null

    if (this.validity.badInput) {
      error = {
        code: `err_validator_bad_${this.type}`
      }
    } else if (this.validity.tooLong) {
      error = {
        code: 'err_validator_too_long',
        data: { maxLength: this.maxLength }
      }
    } else if (this.validity.tooShort) {
      error = {
        code: 'err_validator_too_short',
        data: { minLength: this.minLength }
      }
    } else if (this.validity.typeMismatch) {
      error = {
        code: `err_validator_type_mismatch_${this.type}`
      }
    } else if (this.validity.valueMissing) {
      error = {
        code: 'err_validator_value_missing'
      }
    }

    return error
  }

  public getValue (): FieldValue {
    return cast(this.value) ?? null
  }

  public isEmpty (): boolean {
    return this.innerHTML === ''
  }

  public reset (): void {
    this.resize = this.hasAttribute('sc-resize')
    this.setData(this.initialInnerHtml)
  }

  public setData (data: unknown): void {
    if (isError(data)) {
      this.setError(data)
    } else if (
      isStruct(data) &&
      data.valid === true
    ) {
      this.field.setValid()
    } else {
      this.setValue(data)
    }

    this.propagator.set(data)
  }

  public setError (error: ScolaError): void {
    this.field.setError(error)
  }

  public toObject (): Struct {
    return this.field.toObject()
  }

  public update (): void {
    this.updateAttributes()
    this.updatePlaceholder()

    if (this.resize) {
      this.updateStyle()
    }
  }

  public updateAttributes (): void {
    this.toggleAttribute('sc-empty', this.isEmpty())
    this.setAttribute('sc-updated', Date.now().toString())
    this.form?.setAttribute('sc-updated', Date.now().toString())
  }

  public updatePlaceholder (): void {
    if (this.initialCode !== null) {
      this.placeholder = this.i18n.format(this.initialCode)
    }
  }

  public updateStyle (): void {
    if (this.scrollHeight > 0) {
      this.style.setProperty('height', '0px')
      this.style.setProperty('height', `${this.scrollHeight}px`)
    }
  }

  public verify (): void {
    this.field.verify()
  }

  protected addEventListeners (): void {
    this.addEventListener('input', this.handleInputBound)
  }

  protected handleInput (event: Event): void {
    this.field.clear()
    this.update()

    this.propagator.dispatch('value', [
      set(Struct.create(), this.name, this.getValue())
    ], event)
  }

  protected removeEventListeners (): void {
    this.removeEventListener('input', this.handleInputBound)
  }

  protected setValue (value: unknown): void {
    if (isPrimitive(value)) {
      this.innerHTML = value.toString()
    } else {
      this.innerHTML = ''
    }

    this.verify()
    this.update()
  }
}
