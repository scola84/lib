import { Field, Mutator, Observer, Propagator } from '../helpers'
import type { Primitive, ScolaError } from '../../common'
import { cast, isArray, isError, isPrimitive, isStruct } from '../../common'
import type { FieldValue } from '../helpers'
import type { ScolaFieldElement } from './field'

export class ScolaSelectElement extends HTMLSelectElement implements ScolaFieldElement {
  public field: Field

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

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

  public get isEmpty (): boolean {
    return this.value === ''
  }

  public get valueAsCast (): FieldValue {
    return Array
      .from(this.selectedOptions)
      .map((option) => {
        return cast(option.value) ?? null
      })
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
    } else if (isArray(value)) {
      this.setArray(value)
    } else if (isPrimitive(value)) {
      this.setPrimitive(value)
    } else {
      this.setPrimitive('')
    }

    this.verify()
    this.update()
    this.propagator.set(value)
  }

  protected handleInputBound = this.handleInput.bind(this)

  public constructor () {
    super()
    this.field = new Field(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.update()
  }

  public static define (): void {
    customElements.define('sc-select', ScolaSelectElement, {
      extends: 'select'
    })
  }

  public connectedCallback (): void {
    this.field.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
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
    this.data = Array
      .from(this.querySelectorAll<HTMLOptionElement>('option[selected]'))
      .map((option) => {
        return option.value
      })
  }

  public update (): void {
    this.notify()
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

  protected setArray (value: unknown[]): void {
    this
      .querySelectorAll<HTMLOptionElement>('option')
      .forEach((option) => {
        option.selected = value.includes(option.value)
      })
  }

  protected setPrimitive (value: Primitive): void {
    this
      .querySelectorAll<HTMLOptionElement>('option')
      .forEach((option) => {
        option.selected = option.value === value.toString()
      })
  }
}
