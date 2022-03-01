import type { ScolaFieldData, ScolaFieldError } from '../helpers/field'
import { ScolaField } from '../helpers/field'
import type { ScolaFieldElement } from './field'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaSelectElement extends HTMLSelectElement implements ScolaFieldElement {
  public error?: Struct

  public field: ScolaField

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public constructor () {
    super()
    this.field = new ScolaField(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.update()
  }

  public static define (): void {
    customElements.define('sc-select', ScolaSelectElement, {
      extends: 'select'
    })
  }

  public clear (): void {
    this.value = this.querySelector<HTMLOptionElement>('option[selected]')?.value ?? ''
    this.field.clear()
    this.update()
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

  public getData (): ScolaFieldData {
    return this.field.getData()
  }

  public getError (): ScolaFieldError | null {
    let error: ScolaFieldError | null = null

    if (this.validity.badInput) {
      error = {
        code: `err_form_bad_${this.type}`
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

  public reset (): void {}

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
    this.setAttribute('sc-updated', Date.now().toString())
    this.form?.setAttribute('sc-updated', Date.now().toString())
  }

  public verify (): void {
    this.field.verify()
  }
}
