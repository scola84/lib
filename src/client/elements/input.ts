import { Field, Mutator, Observer, Propagator } from '../helpers'
import type { FieldData, FieldError } from '../helpers'
import type { ScolaFieldElement } from './field'
import type { Struct } from '../../common'

export class ScolaInputElement extends HTMLInputElement implements ScolaFieldElement {
  public error?: Struct

  public field: Field

  public initialChecked: boolean

  public initialValue: string

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.field = new Field(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.initialChecked = this.checked
    this.initialValue = this.value
    this.reset()
    this.update()
  }

  public static define (): void {
    customElements.define('sc-input', ScolaInputElement, {
      extends: 'input'
    })
  }

  public clear (): void {
    this.checked = this.initialChecked
    this.value = this.initialValue
    this.field.clear()
    this.update()
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'value'
    ])

    this.field.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
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
        code: `err_form_bad_input_${this.type}`
      }
    } else if (this.validity.patternMismatch) {
      error = {
        code: 'err_form_pattern_mismatch',
        data: { pattern: this.pattern }
      }
    } else if (this.validity.rangeOverflow) {
      error = {
        code: 'err_form_range_overflow',
        data: { max: this.max }
      }
    } else if (this.validity.rangeUnderflow) {
      error = {
        code: 'err_form_range_underflow',
        data: { min: this.min }
      }
    } else if (this.validity.stepMismatch) {
      error = {
        code: 'err_form_step_mismatch',
        data: { step: this.step }
      }
    } else if (this.validity.tooLong) {
      error = {
        code: 'err_form_too_long',
        data: { maxLength: this.maxLength }
      }
    } else if (this.validity.tooShort) {
      error = {
        code: 'err_form_too_short',
        data: { minLength: this.minLength }
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

  public getValue (): string | null {
    if (
      this.type === 'checkbox' ||
      this.type === 'radio'
    ) {
      if (!this.checked) {
        return null
      }
    }

    return this.value
  }

  public reset (): void {
    this.field.debounce = Number(this.getAttribute('sc-debounce') ?? 250)
  }

  public setData (data: unknown): void {
    this.field.setData(data)
  }

  public toObject (): Struct {
    return this.field.toObject()
  }

  public update (): void {
    this.updateAttributes()
    this.updateStyle()
  }

  public updateAttributes (): void {
    this.setAttribute('sc-updated', Date.now().toString())
    this.form?.setAttribute('sc-updated', Date.now().toString())
  }

  public updateStyle (): void {
    if (this.type === 'range') {
      this.style.setProperty('--max', this.max)
      this.style.setProperty('--min', this.min)
      this.style.setProperty('--value', this.value)
    }
  }

  public verify (): void {
    this.field.verify()
  }

  protected handleObserver (): void {
    this.updateStyle()
  }
}
