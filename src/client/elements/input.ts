import { Field, Mutator, Observer, Propagator } from '../helpers'
import type { FieldData, FieldValue } from '../helpers'
import { I18n, Struct, cast, isArray, isDate, isError, isPrimitive, isStruct, set } from '../../common'
import type { ScolaError } from '../../common'
import type { ScolaFieldElement } from './field'
import { debounce } from 'throttle-debounce'

export class ScolaInputElement extends HTMLInputElement implements ScolaFieldElement {
  public debounce = 0

  public error?: Struct

  public field: Field

  public file: unknown

  public i18n: I18n

  public initialChecked: boolean

  public initialCode: string | null

  public initialValue: string

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  protected handleInputBound = debounce(0, this.handleInput.bind(this))

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.field = new Field(this)
    this.i18n = new I18n()
    this.initialChecked = this.checked
    this.initialCode = this.getAttribute('sc-code')
    this.initialValue = this.value
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-input', ScolaInputElement, {
      extends: 'input'
    })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'value'
    ])

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
        code: `err_validator_bad_input_${this.type}`
      }
    } else if (this.validity.patternMismatch) {
      error = {
        code: 'err_validator_pattern_mismatch',
        data: { pattern: this.pattern }
      }
    } else if (this.validity.rangeOverflow) {
      error = {
        code: 'err_validator_range_overflow',
        data: { max: this.max }
      }
    } else if (this.validity.rangeUnderflow) {
      error = {
        code: 'err_validator_range_underflow',
        data: { min: this.min }
      }
    } else if (this.validity.stepMismatch) {
      error = {
        code: 'err_validator_step_mismatch',
        data: { step: this.step }
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

  public getValue (): FieldValue {
    if (
      this.type === 'checkbox' ||
      this.type === 'radio'
    ) {
      if (!this.checked) {
        return null
      }
    } else if (this.type === 'date') {
      return new Date(this.value)
    } else if (this.type === 'datetime-local') {
      return new Date(this.value)
    } else if (this.type === 'time') {
      return new Date(`1970-01-01T${this.value}`)
    } else if (this.type === 'file') {
      const files = Array.from(this.files ?? [])

      if (files.length === 0) {
        if (isArray(this.file)) {
          return this.file.filter((file) => {
            return (
              file instanceof File ||
              isStruct(file)
            )
          }) as File[] | Struct[]
        } else if (
          this.file instanceof File ||
          isStruct(this.file)
        ) {
          return this.file
        }

        return null
      }

      if (this.multiple) {
        return files
      }

      return files[0]
    }

    return cast(this.value) ?? null
  }

  public isEmpty (): boolean {
    return (
      this.value === '' &&
      this.field.value === ''
    )
  }

  public reset (): void {
    this.debounce = Number(this.getAttribute('sc-debounce') ?? 250)

    if (
      this.type === 'checkbox' ||
      this.type === 'radio'
    ) {
      this.setChecked(this.initialChecked)
    } else {
      this.setData(this.initialValue)
    }
  }

  public setData (data: unknown): void {
    this.field.clear()

    if (isError(data)) {
      this.setError(data)
    } else if (
      isStruct(data) &&
      data.valid === true
    ) {
      this.field.setValid()
    } else if (
      isStruct(data) &&
      data.value !== undefined
    ) {
      this.setValue(data.value)
    } else if (
      this.type === 'checkbox' ||
      this.type === 'radio'
    ) {
      this.setChecked(data)
    } else if (
      this.type === 'date' ||
      this.type === 'datetime-local' ||
      this.type === 'time'
    ) {
      this.setDate(data)
    } else if (this.type === 'file') {
      this.setFile(data)
    } else {
      this.setValue(data)
    }
  }

  public setError (error: ScolaError): void {
    this.clearDebounce()
    this.field.setError(error)
  }

  public toObject (): Struct {
    return this.field.toObject()
  }

  public update (): void {
    this.updateAttributes()
    this.updatePlaceholder()
    this.updateStyle()
  }

  public updateAttributes (): void {
    this.toggleAttribute('sc-empty', this.isEmpty())
    this.setAttribute('sc-updated', Date.now().toString())
    this.form?.setAttribute('sc-updated', Date.now().toString())
  }

  public updatePlaceholder (): void {
    if (this.initialCode !== null) {
      this.placeholder = this.i18n.format(this.initialCode)
    }
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

  protected addEventListeners (): void {
    if (this.debounce > 0) {
      this.handleInputBound = debounce(this.debounce, this.handleInput.bind(this))
    }

    this.addEventListener('input', this.handleInputBound)
  }

  protected clearDebounce (): void {
    this.handleInputBound.cancel()
    this.removeEventListeners()
    this.addEventListeners()
  }

  protected handleInput (event: Event): void {
    this.field.clear()
    this.update()

    if (
      this.files instanceof FileList &&
      this.files.length > 0
    ) {
      this.handleInputFiles(this.files, event)
    } else if (
      this.type === 'checkbox' ||
      this.type === 'radio'
    ) {
      this.handleInputChecked(this.checked, event)
    } else {
      this.handleInputValue(event)
    }
  }

  protected handleInputChecked (checked: boolean, event?: Event): void {
    this.propagator.dispatch('checked', [
      set(Struct.create(), this.name, checked)
    ], event)
  }

  protected handleInputFiles (fileList: FileList, event?: Event): void {
    const files = Array.from(fileList)

    this.propagator.dispatch<File>('file', files, event)
    this.propagator.dispatch<Struct<File[]>>('files', [{ files }], event)
  }

  protected handleInputValue (event: Event): void {
    this.propagator.dispatch('value', [
      set(Struct.create(), this.name, this.getValue())
    ], event)
  }

  protected handleObserver (): void {
    this.updateStyle()
  }

  protected removeEventListeners (): void {
    this.removeEventListener('input', this.handleInputBound)
  }

  protected setChecked (value: unknown): void {
    if (typeof value === 'boolean') {
      this.toggleAttribute('checked', value)
    } else if (isArray(value)) {
      this.toggleAttribute('checked', value.includes(this.value))
    } else if (isPrimitive(value)) {
      this.toggleAttribute('checked', value.toString() === this.value)
    } else if (
      isStruct(value) &&
      isPrimitive(value.value)
    ) {
      this.value = value.value.toString()
    } else {
      this.toggleAttribute('checked', false)
    }

    this.verify()
    this.update()
  }

  protected setDate (value: unknown): void {
    const dateTime = cast(value)

    if (isDate(dateTime)) {
      const date = [
        String(dateTime.getFullYear()),
        String(dateTime.getMonth() + 1).padStart(2, '0'),
        String(dateTime.getDate()).padStart(2, '0')
      ].join('-')

      const time = [
        String(dateTime.getHours()).padStart(2, '0'),
        String(dateTime.getMinutes()).padStart(2, '0'),
        String(dateTime.getSeconds()).padStart(2, '0')
      ].join(':')

      if (this.type === 'date') {
        this.value = date
      } else if (this.type === 'datetime-local') {
        this.value = `${date}T${time}`
      } else if (this.type === 'time') {
        this.value = time
      }
    } else {
      this.value = ''
    }

    this.verify()
    this.update()
  }

  protected setFile (value: unknown): void {
    this.value = ''
    this.file = value
    this.verify()
    this.update()
  }

  protected setValue (value: unknown): void {
    if (isPrimitive(value)) {
      this.value = value.toString()
    } else {
      this.value = ''
    }

    this.verify()
    this.update()
  }
}
