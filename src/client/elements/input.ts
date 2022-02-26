import type { ScolaFieldData, ScolaFieldError } from '../helpers/field'
import { ScolaField } from '../helpers/field'
import type { ScolaFieldElement } from './field'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaInputElement extends HTMLInputElement implements ScolaFieldElement {
  public error?: Struct

  public field: ScolaField

  public initialChecked: boolean

  public initialValue: string

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.field = new ScolaField(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
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

  public getData (): ScolaFieldData | ScolaFieldError {
    return this.field.getData()
  }

  public getError (): ScolaFieldError | null {
    let error: ScolaFieldError | null = null

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

  public isSame (data: unknown): boolean {
    return this.field.isSame(data)
  }

  public reset (): void {
    this.field.debounce = Number(this.getAttribute('sc-debounce') ?? 250)
  }

  public setData (data: unknown): void {
    this.field.setData(data)
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

  protected handleObserver (): void {
    this.updateStyle()
  }
}
