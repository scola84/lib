import type { Primitive, ScolaError } from '../../common'
import { Struct, cast, isArray, isError, isPrimitive, isStruct, set } from '../../common'
import { Interactor } from './interactor'
import type { InteractorEvent } from './interactor'
import type { ScolaFieldElement } from '../elements'
import { debounce } from 'throttle-debounce'

declare global {
  interface HTMLElementEventMap {
    'sc-field-clear': CustomEvent
    'sc-field-falsify': CustomEvent
    'sc-field-focus': CustomEvent
    'sc-field-verify': CustomEvent
  }
}

export interface FieldData extends Struct {
  name: string
  value: FieldValue
}

export type FieldValue = Array<Date | File | Primitive | Struct | null> | Date | File | File[] | Primitive | Struct | null

export class Field {
  public debounce = 0

  public element: ScolaFieldElement

  public error?: ScolaError

  public interactor: Interactor

  public value: unknown = ''

  protected handleClearBound = this.handleClear.bind(this)

  protected handleFalsifyBound = this.handleFalsify.bind(this)

  protected handleFocusBound = this.handleFocus.bind(this)

  protected handleInputBound = debounce(0, this.handleInput.bind(this))

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleResetBound = this.handleReset.bind(this)

  protected handleVerifyBound = this.handleVerify.bind(this)

  public constructor (element: ScolaFieldElement) {
    this.element = element
    this.interactor = new Interactor(element)
    this.reset()
  }

  public clear (): void {
    this.error = undefined
    this.element.toggleAttribute('sc-field-error', false)
    this.element.toggleAttribute('sc-field-valid', false)
  }

  public connect (): void {
    this.interactor.observe(this.handleInteractorBound)
    this.interactor.connect()
    this.addEventListeners()
  }

  public disconnect (): void {
    this.interactor.disconnect()
    this.removeEventListeners()
  }

  public falsify (): void {
    const error = this.element.getError()

    if (error !== null) {
      this.setData(error)
    }
  }

  public getData (): FieldData {
    return {
      name: this.element.name,
      value: this.element.getValue()
    }
  }

  public getValue (): FieldValue {
    if (this.element instanceof HTMLInputElement) {
      if (
        this.element.type === 'checkbox' ||
        this.element.type === 'radio'
      ) {
        if (!this.element.checked) {
          return null
        }
      } else if (this.element.type === 'file') {
        const files = Array.from(this.element.files ?? [])

        if (files.length === 0) {
          if (isArray(this.value)) {
            return this.value.filter((value) => {
              return (
                value instanceof File ||
                isStruct(value)
              )
            }) as File[] | Struct[]
          } else if (
            this.value instanceof File ||
            isStruct(this.value)
          ) {
            return this.value
          }

          return null
        }

        if (this.element.multiple) {
          return files
        }

        return files[0]
      }
    } else if (this.element instanceof HTMLSelectElement) {
      return Array
        .from(this.element.selectedOptions)
        .map((option) => {
          return cast(option.value) ?? null
        })
    }

    return cast(this.element.value) ?? null
  }

  public reset (): void {
    this.interactor.keyboard = this.interactor.hasKeyboard
  }

  public setData (data: unknown): void {
    this.clear()

    if (isPrimitive(data)) {
      this.setPrimitive(data)
    } else if (isError(data)) {
      this.setError(data)
    } else if (data instanceof Date) {
      this.setDate(data)
    } else if (data instanceof File) {
      this.setFile(data)
    } else if (isArray(data)) {
      this.setValue(data)
    } else if (isStruct(data)) {
      if (data.valid === true) {
        this.setValid()
      } else if (data.value === undefined) {
        this.setValue(data)
      } else {
        this.setData(data.value)
      }
    } else {
      this.setValue('')
    }
  }

  public toObject (): Struct {
    return {
      name: this.element.name,
      value: this.element.getValue()
    }
  }

  public verify (): void {
    const error = this.element.getError()

    if (error === null) {
      this.setValid()
    }
  }

  protected addEventListeners (): void {
    if (this.debounce > 0) {
      this.handleInputBound = debounce(this.debounce, this.handleInput.bind(this))
    }

    this.element.addEventListener('input', this.handleInputBound)
    this.element.addEventListener('sc-field-clear', this.handleClearBound)
    this.element.addEventListener('sc-field-falsify', this.handleFalsifyBound)
    this.element.addEventListener('sc-field-focus', this.handleFocusBound)
    this.element.addEventListener('sc-field-reset', this.handleResetBound)
    this.element.addEventListener('sc-field-verify', this.handleVerifyBound)
  }

  protected clearDebounce (): void {
    this.handleInputBound.cancel()
    this.removeEventListeners()
    this.addEventListeners()
  }

  protected handleClear (): void {
    this.clear()
  }

  protected handleFalsify (): void {
    const dispatched = this.element.propagator.dispatch('falsify', [this.getData()])

    if (!dispatched) {
      this.falsify()
    }
  }

  protected handleFocus (): void {
    this.element.focus()
  }

  protected handleInput (event: Event): void {
    this.clear()
    this.element.update()

    if (this.element instanceof HTMLInputElement) {
      if (
        this.element.files instanceof FileList &&
        this.element.files.length > 0
      ) {
        this.handleInputFiles(this.element.files, event)
      } else if (
        this.element.type === 'checkbox' ||
        this.element.type === 'radio'
      ) {
        this.handleInputChecked(this.element.checked, event)
      } else {
        this.handleInputValue(event)
      }
    } else {
      this.handleInputValue(event)
    }
  }

  protected handleInputChecked (checked: boolean, event?: Event): void {
    this.element.toggleAttribute('checked', checked)

    this.element.propagator.dispatch('checked', [
      set(Struct.create(), this.element.name, checked)
    ], event)
  }

  protected handleInputFiles (fileList: FileList, event?: Event): void {
    const files = Array.from(fileList)

    this.element.propagator.dispatch<File>('file', files, event)
    this.element.propagator.dispatch<Struct<File[]>>('files', [{ files }], event)
  }

  protected handleInputValue (event: Event): void {
    this.element.propagator.dispatch('value', [
      set(Struct.create(), this.element.name, this.getValue())
    ], event)
  }

  protected handleInteractor (event: InteractorEvent): boolean {
    switch (event.type) {
      case 'start':
        return this.handleInteractorStart(event)
      default:
        return false
    }
  }

  protected handleInteractorStart (event: InteractorEvent): boolean {
    if (this.interactor.isKeyboard(event.originalEvent)) {
      return this.handleInteractorStartKeyboard(event.originalEvent)
    }

    return false
  }

  protected handleInteractorStartKeyboard (event: KeyboardEvent): boolean {
    if (this.interactor.isKey(event, 'Enter')) {
      this.handleInteractorStartKeyboardEnter(event)
      return true
    }

    return false
  }

  protected handleInteractorStartKeyboardEnter (event: KeyboardEvent): void {
    let on = 'enter'

    if (event.ctrlKey) {
      on = `ctrl${on}`
    }

    this.element.propagator.dispatch(on, [{
      [this.element.name]: this.element.value
    }], event)
  }

  protected handleReset (): void {
    this.element.reset()
  }

  protected handleVerify (): void {
    const dispatched = this.element.propagator.dispatch('verify', [this.getData()])

    if (!dispatched) {
      this.verify()
    }
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('input', this.handleInputBound)
    this.element.removeEventListener('sc-field-clear', this.handleClearBound)
    this.element.removeEventListener('sc-field-falsify', this.handleFalsifyBound)
    this.element.removeEventListener('sc-field-focus', this.handleFocusBound)
    this.element.removeEventListener('sc-field-reset', this.handleResetBound)
    this.element.removeEventListener('sc-field-verify', this.handleVerifyBound)
  }

  protected setChecked (value: Primitive): void {
    this.element.toggleAttribute('checked', value.toString() === this.element.value)
    this.value = value
    this.verify()
    this.element.update()
  }

  protected setDate (value: Date): void {
    this.element.value = [
      [
        String(value.getFullYear()),
        String(value.getMonth() + 1).padStart(2, '0'),
        String(value.getDate()).padStart(2, '0')
      ].join('-'),
      [
        String(value.getHours()).padStart(2, '0'),
        String(value.getMinutes()).padStart(2, '0'),
        String(value.getSeconds()).padStart(2, '0')
      ].join(':')
    ].join('T')

    this.value = value
    this.verify()
    this.element.update()
  }

  protected setError (error: ScolaError): void {
    this.clearDebounce()
    this.error = error
    this.element.toggleAttribute('sc-field-error', true)
  }

  protected setFile (value: File): void {
    this.element.value = ''
    this.value = value
    this.verify()
    this.element.update()
  }

  protected setPrimitive (value: Primitive): void {
    if (
      this.element.type === 'checkbox' ||
      this.element.type === 'radio'
    ) {
      this.setChecked(value)
    } else if (
      this.element.type === 'date' ||
      this.element.type === 'datetime-local' ||
      this.element.type === 'time'
    ) {
      this.setDate(new Date(value.toString()))
    } else {
      this.element.value = value.toString()
      this.value = value
      this.verify()
      this.element.update()
    }
  }

  protected setValid (): void {
    this.clear()
    this.element.toggleAttribute('sc-field-valid', true)
  }

  protected setValue (value: unknown): void {
    this.element.value = ''
    this.value = value
    this.element.update()
  }
}
