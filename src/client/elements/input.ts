import type { CastValue, Primitive, ScolaError, ScolaFile } from '../../common'
import { Field, Mutator, Observer, Propagator } from '../helpers'
import { I18n, Struct, cast, isArray, isError, isFile, isPrimitive, isStruct, set } from '../../common'
import type { FieldValue } from '../helpers'
import type { ScolaFieldElement } from './field'
import { debounce } from 'throttle-debounce'

export class ScolaInputElement extends HTMLInputElement implements ScolaFieldElement {
  public debounce = 0

  public field: Field

  public filesAsCast?: Array<File | ScolaFile> | File | ScolaFile | null

  public i18n: I18n

  public initialChecked: boolean

  public initialValue: unknown

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

    return error ?? undefined
  }

  public set error (error: ScolaError | undefined) {
    if (error !== undefined) {
      this.field.setError(error)
    }
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

  public get valueAsCast (): FieldValue {
    if (
      this.type === 'checkbox' ||
      this.type === 'radio'
    ) {
      return this.getChecked() ?? null
    } else if (
      this.type === 'date' ||
      this.type === 'datetime-local' ||
      this.type === 'time'
    ) {
      return this.getDate()
    } else if (this.type === 'file') {
      return this.filesAsCast ?? null
    }

    return cast(this.value) ?? null
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
    } else if (
      isStruct(value) &&
      isPrimitive(value.value)
    ) {
      this.setStruct(value)
    } else if (
      this.type === 'checkbox' ||
      this.type === 'radio'
    ) {
      this.setChecked(value)
    } else if (
      this.type === 'date' ||
      this.type === 'datetime-local' ||
      this.type === 'time'
    ) {
      this.setDate(value)
    } else if (this.type === 'file') {
      this.setFiles(value)
    } else if (isPrimitive(value)) {
      this.setPrimitive(value)
    } else {
      this.setPrimitive('')
    }

    this.verify()
    this.update()
  }

  protected handleInputBound = debounce(0, this.handleInput.bind(this))

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.field = new Field(this)
    this.i18n = new I18n()
    this.initialChecked = this.checked
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

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.form?.toggleAttribute('sc-updated', true)
    this.form?.toggleAttribute('sc-updated', false)
    this.propagator.dispatchEvents('update')
  }

  public reset (): void {
    this.debounce = Number(this.getAttribute('sc-debounce') ?? 250)

    if (
      this.type === 'checkbox' ||
      this.type === 'radio'
    ) {
      this.data = this.initialChecked
    } else {
      this.data = this.initialValue
    }
  }

  public toJSON (): unknown {
    return {
      error: this.error,
      files: this.filesAsCast,
      id: this.id,
      is: this.getAttribute('is'),
      name: this.name,
      nodeName: this.nodeName,
      type: this.type,
      value: this.valueAsCast
    }
  }

  public update (): void {
    this.field.update()
    this.updateStyle()
    this.notify()
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

  protected getChecked (): CastValue {
    if (!this.checked) {
      if (this.value === 'true') {
        return false
      }

      return null
    }

    return cast(this.value)
  }

  protected getDate (): Date | null {
    if (this.value === '') {
      return null
    }

    if (this.type === 'time') {
      return new Date(`1970-01-01T${this.value}`)
    }

    return new Date(this.value)
  }

  protected handleInput (event: Event): void {
    this.field.clear()
    this.toggleAttribute('sc-changed', true)

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

    this.update()
  }

  protected handleInputChecked (checked: boolean, event?: Event): void {
    this.propagator.dispatchEvents('checked', [
      set(Struct.create(), this.name, checked)
    ], event)
  }

  protected handleInputFiles (fileList: FileList, event?: Event): void {
    const files = Array.from(fileList)

    if (this.multiple) {
      this.setFiles(files)
    } else {
      this.setFiles(files[0])
    }

    this.propagator.dispatchEvents<File | ScolaFile>('file', files, event)
    this.propagator.dispatchEvents<Struct<Array<File | ScolaFile>>>('files', [{ files }], event)
  }

  protected handleInputValue (event: Event): void {
    this.propagator.dispatchEvents('value', [this.valueAsCast], event)
  }

  protected handleObserver (): void {
    this.updateStyle()
  }

  protected removeEventListeners (): void {
    this.removeEventListener('input', this.handleInputBound)
  }

  protected setChecked (value: unknown): void {
    if (typeof value === 'boolean') {
      this.checked = value
    } else if (isArray(value)) {
      this.checked = value.includes(this.value)
    } else if (isPrimitive(value)) {
      this.checked = value.toString() === this.value
    } else if (
      isStruct(value) &&
      isPrimitive(value.value)
    ) {
      this.value = value.value.toString()
    } else {
      this.checked = false
    }
  }

  protected setDate (value: unknown): void {
    const dateTime = cast(value)

    if (dateTime instanceof Date) {
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
  }

  protected setFiles (value: unknown): void {
    this.value = ''

    if (
      this.multiple &&
      isArray(value)
    ) {
      this.filesAsCast = value.filter((file) => {
        return (
          file instanceof File ||
          isFile(file)
        )
      }) as Array<File | ScolaFile>
    } else if (
      value instanceof File ||
      isFile(value)
    ) {
      this.filesAsCast = value
    } else {
      this.filesAsCast = null
    }
  }

  protected setPrimitive (value: Primitive): void {
    this.value = value.toString()
  }

  protected setStruct (value: Struct): void {
    if (typeof value.name === 'string') {
      this.name = value.name
    }

    if (isPrimitive(value.value)) {
      this.setPrimitive(value.value)
    }
  }

  protected updateStyle (): void {
    if (this.type === 'range') {
      this.style.setProperty('--max', this.max)
      this.style.setProperty('--min', this.min)
      this.style.setProperty('--value', this.value)
    }
  }
}
