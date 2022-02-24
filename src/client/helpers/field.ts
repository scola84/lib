import type { Primitive, Struct } from '../../common'
import { isPrimitive, isSame, isStruct } from '../../common'
import type { ScolaFieldElement } from '../elements/field'
import { ScolaInteractor } from './interactor'
import type { ScolaInteractorEvent } from './interactor'
import { debounce } from 'throttle-debounce'

export interface ScolaFieldData extends Struct {
  value: string
}

export interface ScolaFieldError extends Struct {
  code: string
  data: Struct
}

export class ScolaField {
  public debounce = 0

  public element: ScolaFieldElement

  public error?: ScolaFieldError

  public interactor: ScolaInteractor

  protected handleInputBound = debounce(0, this.handleInput.bind(this))

  protected handleInteractorBound = this.handleInteractor.bind(this)

  public constructor (element: ScolaFieldElement) {
    this.element = element
    this.interactor = new ScolaInteractor(element)
    this.reset()
  }

  public clear (): void {
    this.element.value = ''
    this.element.update()
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

  public getData (): ScolaFieldData | ScolaFieldError {
    if (this.error !== undefined) {
      return this.error
    }

    return {
      value: this.element.value
    }
  }

  public isSame (data: unknown): boolean {
    return isSame(data, {
      value: this.element.value
    })
  }

  public reset (): void {
    this.interactor.keyboard = this.interactor.hasKeyboard
  }

  public setData (data: unknown): void {
    this.clearError()

    if (isPrimitive(data)) {
      this.setValue(data)
    } else if (isStruct(data)) {
      if (
        typeof data.code === 'string' &&
        isStruct(data.data)
      ) {
        this.setError({
          code: data.code,
          data: data.data
        })
      } else if (data.file instanceof File) {
        this.setFile(data.file)
      } else if (isPrimitive(data.value)) {
        this.setValue(data.value)
      }
    }
  }

  protected addEventListeners (): void {
    if (this.debounce > 0) {
      this.handleInputBound = debounce(this.debounce, this.handleInputBound)
    }

    this.element.addEventListener('input', this.handleInputBound)
  }

  protected clearError (): void {
    if (this.error !== undefined) {
      this.error = undefined
      this.element.toggleAttribute('sc-field-error', false)
    }
  }

  protected handleInput (event: Event): void {
    this.clearError()

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
        file,
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
    this.element.update()

    this.element.propagator.dispatch('value', [{
      [this.element.name]: this.element.value
    }], event)
  }

  protected handleInteractor (event: ScolaInteractorEvent): boolean {
    switch (event.type) {
      case 'start':
        return this.handleInteractorStart(event)
      default:
        return false
    }
  }

  protected handleInteractorStart (event: ScolaInteractorEvent): boolean {
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

  protected removeEventListeners (): void {
    this.element.removeEventListener('input', this.handleInputBound)
  }

  protected setError (error: ScolaFieldError): void {
    this.handleInputBound.cancel()
    this.error = error
    this.element.toggleAttribute('sc-field-error', true)
  }

  protected setFile (file: File): void {
    if (this.element instanceof HTMLInputElement) {
      const transfer = new DataTransfer()

      transfer.items.add(file)
      this.element.files = transfer.files
    }
  }

  protected setValue (value: Primitive): void {
    this.clearError()

    if (
      this.element.type === 'checkbox' ||
      this.element.type === 'radio'
    ) {
      this.element.toggleAttribute('checked', value.toString() === this.element.value)
    } else {
      this.element.value = value.toString()
    }

    this.element.update()
  }
}
