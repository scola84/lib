import type { Primitive, Struct } from '../../common'
import { isPrimitive, isStruct } from '../../common'
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
  value: string | null
}

export interface FieldError extends Struct {
  code: string
  data?: unknown
}

export class Field {
  public debounce = 0

  public element: ScolaFieldElement

  public error?: FieldError

  public interactor: Interactor

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

  public reset (): void {
    this.interactor.keyboard = this.interactor.hasKeyboard
  }

  public setData (data: unknown): void {
    this.clear()

    if (isPrimitive(data)) {
      this.setValue(data)
    } else if (isStruct(data)) {
      if (typeof data.code === 'string') {
        this.setError({
          code: data.code,
          data: data.data
        })
      } else if (data.valid === true) {
        this.setValid()
      } else if (data.file instanceof File) {
        this.setFile(data.file)
      } else if (isPrimitive(data.value)) {
        this.setValue(data.value)
      }
    } else if (data instanceof Date) {
      this.setDate(data)
    } else if (data instanceof File) {
      this.setFile(data)
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

    this.element.propagator.dispatch('checked', [{
      [this.element.name]: checked
    }], event)
  }

  protected handleInputFiles (fileList: FileList, event?: Event): void {
    const files = Array.from(fileList)

    this.element.propagator.dispatch('file', files.map((file) => {
      return {
        file: file,
        name: file.name,
        size: file.size,
        type: file.type
      }
    }), event)

    this.element.propagator.dispatch('files', [{
      files
    }], event)
  }

  protected handleInputValue (event: Event): void {
    this.element.propagator.dispatch('value', [{
      [this.element.name]: this.element.value
    }], event)
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
  }

  protected setDate (date: Date): void {
    this.element.value = [
      [
        String(date.getFullYear()),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-'),
      [
        String(date.getHours()).padStart(2, '0'),
        String(date.getMinutes()).padStart(2, '0'),
        String(date.getSeconds()).padStart(2, '0')
      ].join(':')
    ].join('T')
  }

  protected setError (error: FieldError): void {
    this.clearDebounce()
    this.error = error
    this.element.toggleAttribute('sc-field-error', true)
  }

  protected setFile (file?: File): void {
    if (this.element instanceof HTMLInputElement) {
      const transfer = new DataTransfer()

      if (file !== undefined) {
        transfer.items.add(file)
      }

      this.element.files = transfer.files
    }

    this.verify()
    this.element.update()
  }

  protected setValid (): void {
    this.clear()
    this.element.toggleAttribute('sc-field-valid', true)
  }

  protected setValue (value: Primitive): void {
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
    }

    this.verify()
    this.element.update()
  }
}
