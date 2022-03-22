import { Field, Mutator, Observer, Propagator } from '../helpers'
import type { FieldData, FieldError } from '../helpers'
import type { ScolaFieldElement } from './field'
import type { Struct } from '../../common'

export class ScolaSelectElement extends HTMLSelectElement implements ScolaFieldElement {
  public error?: Struct

  public field: Field

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

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

  public getValue (): string {
    return Array
      .from(this.selectedOptions)
      .map((option) => {
        return option.value
      })
      .join(', ')
  }

  public isEmpty (): boolean {
    return this.value === ''
  }

  public reset (): void {
    this.field.setData(this.querySelector<HTMLOptionElement>('option[selected]')?.value ?? '')
  }

  public setData (data: unknown): void {
    this.field.setData(data)
    this.propagator.set(data)
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
}
