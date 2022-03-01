import { ScolaField, ScolaMutator, ScolaObserver, ScolaPropagator } from '../helpers'
import type { ScolaFieldData, ScolaFieldError } from '../helpers'
import type { ScolaFieldElement } from './field'
import type { Struct } from '../../common'

export class ScolaTextAreaElement extends HTMLTextAreaElement implements ScolaFieldElement {
  public error?: Struct

  public field: ScolaField

  public initialValue: string

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public resize: boolean

  public constructor () {
    super()
    this.field = new ScolaField(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.initialValue = this.value
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-textarea', ScolaTextAreaElement, {
      extends: 'textarea'
    })
  }

  public clear (): void {
    this.value = this.initialValue
    this.field.clear()
    this.update()
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

  public getData (): ScolaFieldData {
    return this.field.getData()
  }

  public getError (): ScolaFieldError | null {
    let error: ScolaFieldError | null = null

    if (this.validity.badInput) {
      error = {
        code: `err_form_bad_${this.type}`
      }
    } else if (this.validity.tooLong) {
      error = {
        code: 'err_form_too_long',
        data: { max: this.maxLength }
      }
    } else if (this.validity.tooShort) {
      error = {
        code: 'err_form_too_short',
        data: { min: this.minLength }
      }
    } else if (this.validity.typeMismatch) {
      error = {
        code: `err_form_type_mismatch_${this.type}`
      }
    } else if (this.validity.valueMissing) {
      error = {
        code: 'err_form_value_missing'
      }
    }

    return error
  }

  public getValue (): string {
    return this.value
  }

  public reset (): void {
    this.resize = this.hasAttribute('sc-resize')
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
