import { Field, Mutator, Observer, Propagator } from '../helpers'
import type { FieldData, FieldValue } from '../helpers'
import type { Primitive, ScolaError } from '../../common'
import { Struct, cast, isArray, isError, isPrimitive, isStruct, set } from '../../common'
import type { ScolaFieldElement } from './field'

export class ScolaSelectElement extends HTMLSelectElement implements ScolaFieldElement {
  public error?: Struct

  public field: Field

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

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

  public getData (): FieldData {
    return this.field.getData()
  }

  public getError (): ScolaError | null {
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

    return error
  }

  public getValue (): FieldValue {
    return Array
      .from(this.selectedOptions)
      .map((option) => {
        return cast(option.value) ?? null
      })
  }

  public isEmpty (): boolean {
    return this.value === ''
  }

  public reset (): void {
    this.setData(Array
      .from(this.querySelectorAll<HTMLOptionElement>('option[selected]'))
      .map((option) => {
        return option.value
      }))
  }

  public setData (data: unknown): void {
    this.field.clear()
    this.field.setValue(data)
  }

  public setError (error: ScolaError): void {
    this.field.setError(error)
  }

  public setValue (value: unknown): void {
    if (this.form?.valid === false) {
      if (isError(value)) {
        this.setError(value)
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

  public toObject (): Struct {
    return this.field.toObject()
  }

  public update (): void {
    this.updateAttributes()
  }

  public updateAttributes (): void {
    this.toggleAttribute('sc-empty', this.isEmpty())
    this.setAttribute('sc-updated', Date.now().toString())
    this.form?.setAttribute('sc-updated', Date.now().toString())
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
