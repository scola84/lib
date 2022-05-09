import { Field, Mutator, Observer, Propagator } from '../helpers'
import type { Primitive, ScolaError, Struct } from '../../common'
import { cast, isArray, isPrimitive, isStruct } from '../../common'
import type { FieldValue } from '../helpers'
import type { ScolaFieldElement } from './field'

type Generator = () => Array<[number | string, string, boolean?]> | Promise<Array<[string, string, boolean?]>>

export class ScolaSelectElement extends HTMLSelectElement implements ScolaFieldElement {
  public static generators: Partial<Struct<Generator>> = {}

  public field: Field

  public generator: string | null

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
    return this.field.error
  }

  public set error (error: ScolaError | undefined) {
    this.field.setError(error)
  }

  public get optionElements (): HTMLOptionElement[] {
    return Array.from(this.querySelectorAll<HTMLOptionElement>('option'))
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

  public get validityError (): ScolaError | undefined {
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

  public get valueAsCast (): FieldValue {
    return Array
      .from(this.selectedOptions)
      .map((option) => {
        return cast(option.value) ?? null
      })
  }

  public set valueAsCast (value: unknown) {
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
    } else if (isArray(value)) {
      this.setArray(value)
    } else if (isPrimitive(value)) {
      this.setPrimitive(value)
    } else {
      this.setPrimitive('')
    }

    this.verify()
    this.update()
    this.propagator.setData(value)
  }

  protected handleInputBound = this.handleInput.bind(this)

  public constructor () {
    super()
    this.field = new Field(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
    this.update()
  }

  public static define (): void {
    customElements.define('sc-select', ScolaSelectElement, {
      extends: 'select'
    })
  }

  public static defineGenerators (generators: Struct<Generator>): void {
    Object
      .entries(generators)
      .forEach(([name, generator]) => {
        ScolaSelectElement.generators[name] = generator
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
    if (!this.checkValidity()) {
      this.error = this.validityError
    }
  }

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.form?.toggleAttribute('sc-updated', true)
    this.form?.toggleAttribute('sc-updated', false)
    this.propagator.dispatchEvents('update')
  }

  public reset (): void {
    this.generator = this.getAttribute('sc-generator')

    this.data = this.optionElements
      .filter((option) => {
        return option.hasAttribute('selected')
      })
      .map((option) => {
        return option.value
      })

    this.appendOptions()
  }

  public toJSON (): unknown {
    return {
      error: this.error,
      id: this.id,
      is: this.getAttribute('is'),
      name: this.name,
      nodeName: this.nodeName,
      optionElements: this.optionElements.length,
      type: this.type,
      value: this.valueAsCast
    }
  }

  public update (): void {
    this.field.update()
    this.notify()
  }

  public verify (): void {
    if (this.checkValidity()) {
      this.field.setValid()
    }
  }

  protected addEventListeners (): void {
    this.addEventListener('input', this.handleInputBound)
  }

  protected appendOptions (): void {
    Promise
      .resolve()
      .then(() => {
        if (
          this.generator !== null &&
          ScolaSelectElement.generators[this.generator] !== undefined
        ) {
          return ScolaSelectElement.generators[this.generator]?.() ?? []
        }

        return []
      })
      .then((options) => {
        this.innerHTML = ''

        options.forEach(([value, text, selected = false]) => {
          const option = document.createElement('option')

          option.value = value.toString()
          option.textContent = text
          option.toggleAttribute('selected', selected)
          this.appendChild(option)
        })
      })
      .catch(() => {})
      .finally(() => {
        this.update()
      })
  }

  protected handleInput (event: Event): void {
    this.field.clear()
    this.toggleAttribute('sc-changed', true)
    this.propagator.dispatchEvents('value', [this.valueAsCast], event)
    this.update()
  }

  protected removeEventListeners (): void {
    this.removeEventListener('input', this.handleInputBound)
  }

  protected setArray (value: unknown[]): void {
    this.optionElements.forEach((option) => {
      option.selected = value.includes(option.value)
    })
  }

  protected setPrimitive (value: Primitive): void {
    this.optionElements.forEach((option) => {
      option.selected = option.value === value.toString()
    })
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
