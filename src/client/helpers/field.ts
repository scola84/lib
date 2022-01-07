import type { Primitive, Struct } from '../../common'
import { isPrimitive, isStruct } from '../../common'
import type { ScolaInputElement } from '../elements/input'
import { ScolaInteract } from './interact'
import type { ScolaInteractEvent } from './interact'
import type { ScolaSelectElement } from '../elements/select'
import type { ScolaTextAreaElement } from '../elements/textarea'
import { debounce } from 'throttle-debounce'

export class ScolaField {
  public debounce = 0

  public element: ScolaInputElement | ScolaSelectElement | ScolaTextAreaElement

  public interact: ScolaInteract

  protected handleFocusBound = this.handleFocus.bind(this)

  protected handleInputBound = this.handleInput.bind(this)

  protected handleInteractBound = this.handleInteract.bind(this)

  public constructor (element: ScolaInputElement | ScolaSelectElement | ScolaTextAreaElement) {
    this.element = element
    this.interact = new ScolaInteract(element)
    this.reset()
  }

  public connect (): void {
    this.interact.observe(this.handleInteractBound)
    this.interact.connect()
    this.addEventListeners()
  }

  public disconnect (): void {
    this.interact.disconnect()
    this.removeEventListeners()
  }

  public getData (): Struct {
    return {
      value: this.element.value
    }
  }

  public reset (): void {
    this.interact.keyboard = this.interact.hasKeyboard
  }

  public setData (data: unknown): void {
    if (isPrimitive(data)) {
      this.setValue(data)
    } else if (isStruct(data)) {
      if (isPrimitive(data.code)) {
        this.setError(data)
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

    this.element.addEventListener('focus', this.handleFocusBound)
    this.element.addEventListener('input', this.handleInputBound)
  }

  protected clearError (): void {
    if (this.element.error !== undefined) {
      this.element.error = undefined
      this.element.toggleAttribute('sc-error', false)
    }
  }

  protected handleFocus (): void {
    this.clearError()
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

  protected handleInteract (event: ScolaInteractEvent): boolean {
    if (this.interact.isKeyboard(event.originalEvent, 'down')) {
      return this.handleKeydown(event.originalEvent)
    }

    return false
  }

  protected handleKeydown (event: KeyboardEvent): boolean {
    if (this.interact.isKey(event, 'Enter')) {
      this.handleKeydownEnter(event)
      return true
    }

    return false
  }

  protected handleKeydownEnter (event: KeyboardEvent): void {
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
    this.element.removeEventListener('focus', this.handleFocusBound)
  }

  protected setError (error: Struct): void {
    this.element.error = error
    this.element.toggleAttribute('sc-error', true)
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
    this.element.value = value.toString()
    this.element.update()
  }
}
