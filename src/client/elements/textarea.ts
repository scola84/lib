import { Field, Mutator, Observer, Propagator } from '../helpers'
import type { FieldData, FieldError } from '../helpers'
import type { Primitive, Struct } from '../../common'
import type { ScolaFieldElement } from './field'

export class ScolaTextAreaElement extends HTMLTextAreaElement implements ScolaFieldElement {
  public error?: Struct

  public field: Field

  public initialValue: string

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public resize: boolean

  public constructor () {
    super()
    this.field = new Field(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.initialValue = this.value
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

    window.requestAnimationFrame(() => {
      this.update()
    })
  }

  public disconnectedCallback (): void {
    this.field.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public falsify (): void {
    this.field.falsify()
  }

  public getData (): FieldData {
    return this.field.getData()
  }

  public getError (): FieldError | null {
    let error: FieldError | null = null

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

  public getValue (): Date | File | File[] | Primitive | Primitive[] | Struct | Struct[] | null {
    return this.field.getValue()
  }

  public isEmpty (): boolean {
    return this.innerHTML === ''
  }

  public reset (): void {
    this.resize = this.hasAttribute('sc-resize')
    this.field.setData(this.initialValue)
  }

  public setData (data: unknown): void {
    this.field.setData(data)
  }

  public toObject (): Struct {
    return this.field.toObject()
  }

  public update (): void {
    this.updateAttributes()

    if (this.resize) {
      this.updateStyle()
    }
  }

  public updateAttributes (): void {
    this.toggleAttribute('sc-empty', this.isEmpty())
    this.setAttribute('sc-updated', Date.now().toString())
    this.form?.setAttribute('sc-updated', Date.now().toString())
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
}
