import { Field, Mutator, Observer, Propagator } from '../helpers'
import { I18n, cast, isError, isPrimitive, isStruct } from '../../common'
import type { Primitive, ScolaError, Struct } from '../../common'
import type { FieldValue } from '../helpers'
import type { ScolaFieldElement } from './field'

export class ScolaTextAreaElement extends HTMLTextAreaElement implements ScolaFieldElement {
  public field: Field

  public i18n: I18n

  public initialCode: string | null

  public initialInnerHtml: string

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public resize: boolean

  public get data (): unknown {
    return {
      name: this.name,
      value: this.valueAsCast
    }
  }

  public set data (data: unknown) {
    this.field.clear()
    this.valueAsCast = data
  }

  public get error (): ScolaError | undefined {
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

    return error ?? undefined
  }

  public set error (error: ScolaError | undefined) {
    if (error !== undefined) {
      this.field.setError(error)
    }
  }

  public get qualifiedName (): string {
    let name = this.name
    let fieldset = this.closest<HTMLFieldSetElement>('fieldset[name]')

    while (fieldset !== null) {
      name = `${fieldset.name}.${name}`
      fieldset = fieldset.closest<HTMLFieldSetElement>('fieldset[name]')
    }

    return name
  }

  public get valueAsCast (): FieldValue {
    return cast(this.value) ?? null
  }

  public set valueAsCast (value: unknown) {
    if (this.form?.valid === false) {
      if (isError(value)) {
        this.error = value
      }

      return
    }

    if (
      isStruct(value) &&
      value.valid === true
    ) {
      this.field.setValid()
    } else if (
      isStruct(value) &&
      isPrimitive(value.value)
    ) {
      this.setStruct(value)
    } else if (isPrimitive(value)) {
      this.setPrimitive(value)
    } else {
      this.setPrimitive('')
    }

    this.verify()
    this.update()
  }

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
    this.update()
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
      if (this.resize) {
        this.updateStyle()
      }
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

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.form?.toggleAttribute('sc-updated', true)
    this.form?.toggleAttribute('sc-updated', false)
    this.propagator.dispatch('update')
  }

  public reset (): void {
    this.resize = this.hasAttribute('sc-resize')
    this.data = this.initialInnerHtml
  }

  public toJSON (): unknown {
    return {
      error: this.error,
      id: this.id,
      is: this.getAttribute('is'),
      name: this.name,
      nodeName: this.nodeName,
      type: this.type,
      value: this.valueAsCast
    }
  }

  public update (): void {
    this.updatePlaceholder()

    if (this.resize) {
      this.updateStyle()
    }

    this.notify()
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
    this.propagator.dispatch('value', [this.valueAsCast], event)
    this.update()
  }

  protected removeEventListeners (): void {
    this.removeEventListener('input', this.handleInputBound)
  }

  protected setPrimitive (value: Primitive): void {
    this.innerHTML = value.toString()
  }

  protected setStruct (value: Struct): void {
    if (typeof value.name === 'string') {
      this.name = value.name
    }

    if (isPrimitive(value.value)) {
      this.setPrimitive(value.value)
    }
  }
}
