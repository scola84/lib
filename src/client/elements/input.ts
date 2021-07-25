import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { isObject, isPrimitive } from '../../common'
import { FormatElement } from './format'
import { NodeElement } from './node'
import styles from '../styles/input'
import updaters from '../updaters/input'

declare global {
  interface HTMLElementTagNameMap {
    'scola-input': InputElement
  }
}

@customElement('scola-input')
export class InputElement extends NodeElement {
  public static storage: Storage = window.sessionStorage

  public static styles: CSSResultGroup[] = [
    ...NodeElement.styles,
    styles
  ]

  public static updaters = {
    ...NodeElement.updaters,
    ...updaters
  }

  @property({
    type: Boolean
  })
  public save?: boolean

  @property({
    attribute: false
  })
  public storage = InputElement.storage

  public inputElement?: HTMLInputElement | null

  protected clearElement?: NodeElement | null

  protected errorElement?: FormatElement | null

  protected updaters = InputElement.updaters

  public constructor () {
    super()
    this.clearElement = this.querySelector<NodeElement>('[is="clear"]')
    this.errorElement = this.querySelector<FormatElement>('[is="error"]')
    this.inputElement = this.querySelector<HTMLInputElement>(':scope > input, :scope > textarea')
  }

  public appendValueTo (data: FormData | URLSearchParams): void {
    this.clearError()

    if (
      this.inputElement instanceof HTMLInputElement &&
      this.isSuccessful(this.inputElement)
    ) {
      data.append(this.inputElement.name, this.inputElement.value)
    }
  }

  public clearError (): void {
    if (this.errorElement instanceof FormatElement) {
      this.errorElement.hidden = true
    }
  }

  public clearValue (value = ''): void {
    if (this.inputElement instanceof HTMLInputElement) {
      this.inputElement.value = value
      this.toggleClear(true)
    }
  }

  public connectedCallback (): void {
    if (this.save === true) {
      this.loadState()
    }

    super.connectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    const inputElement = this.inputElement?.cloneNode(true)

    if (inputElement instanceof HTMLInputElement) {
      this.inputElement = inputElement
      this.bodySlotElement.insertBefore(inputElement, this.suffixSlotElement)
    }

    this.addEventListener('click', this.handleClick.bind(this))
    this.addEventListener('scola-input-clear', this.handleClear.bind(this))
    this.inputElement?.addEventListener('input', this.handleInput.bind(this))

    if (this.cursor === undefined) {
      this.setCursor()
    }

    super.firstUpdated(properties)
  }

  public toggleClear (force?: boolean): void {
    if (this.clearElement instanceof NodeElement) {
      if (force === undefined) {
        this.clearElement.hidden = !this.clearElement.hidden
      } else {
        this.clearElement.hidden = force
      }
    }
  }

  public update (properties: PropertyValues): void {
    if (properties.has('disabled')) {
      if (this.inputElement instanceof HTMLInputElement) {
        this.inputElement.disabled = this.disabled === true
      }
    } else if (properties.has('data')) {
      if (isObject(this.data)) {
        this.setData(this.data)
      }
    }

    super.update(properties)
  }

  protected createEventData (): Record<string, unknown> {
    if (this.inputElement instanceof HTMLInputElement) {
      return {
        [this.inputElement.name]: this.inputElement.value
      }
    }

    return {}
  }

  protected handleClear (): void {
    this.clearValue()
  }

  protected handleClick (event: MouseEvent): void

  protected handleClick (): void {
    if (this !== document.activeElement) {
      this.inputElement?.focus()
    }

    this.clearError()
  }

  protected handleInput (): void {
    if (this.save === true) {
      this.saveState()
    }

    if (this.inputElement instanceof HTMLInputElement) {
      this.toggleClear(this.inputElement.value === '')
    }

    this.dispatchEvents(this.createEventData())
  }

  protected isSuccessful (inputElement: HTMLInputElement): boolean {
    return !(
      inputElement.name === '' ||
      inputElement.value === '' ||
      inputElement.disabled
    )
  }

  protected loadState (): void {
    if (this.inputElement instanceof HTMLInputElement) {
      this.inputElement.value = this.storage.getItem(`input-${this.id}`) ?? ''
    }
  }

  protected saveState (): void {
    if (this.inputElement instanceof HTMLInputElement) {
      if (this.inputElement.value === '') {
        this.storage.removeItem(`input-${this.id}`)
      } else {
        this.storage.setItem(`input-${this.id}`, this.inputElement.value)
      }
    }
  }

  protected setCursor (): void {
    switch (this.inputElement?.type) {
      case 'date':
      case 'datetime-local':
      case 'email':
      case 'month':
      case 'number':
      case 'password':
      case 'search':
      case 'tel':
      case 'text':
      case 'time':
      case 'url':
      case 'week':
        this.cursor = 'text'
        break
      case 'checkbox':
      case 'color':
      case 'file':
      case 'radio':
        this.cursor = 'pointer'
        break
      default:
        this.cursor = 'default'
        break
    }
  }

  protected setData (data: Record<string, unknown>): void {
    this.clearError()

    if (this.inputElement instanceof HTMLInputElement) {
      const datum = data[this.inputElement.name]

      if (isObject(datum)) {
        this.setError(datum)
      } else if (datum !== undefined) {
        this.setValue(data)
      } else if (data.value !== undefined) {
        this.setInput(data)
      }
    }

    this.dispatchEvents(this.createEventData())
  }

  protected setError (data: Record<string, unknown>): void {
    if (this.errorElement instanceof FormatElement) {
      Object.assign(this.errorElement, data)
      this.errorElement.hidden = false
    }
  }

  protected setInput (data: Record<string, unknown>): void {
    if (this.inputElement instanceof HTMLInputElement) {
      const { value } = data

      if (isPrimitive(value)) {
        this.inputElement.value = value.toString()
      }
    }
  }

  protected setValue (data: Record<string, unknown>): void {
    if (this.inputElement instanceof HTMLInputElement) {
      const value = data[this.inputElement.name]

      if (isPrimitive(value)) {
        this.inputElement.value = value.toString()
        this.toggleClear(this.inputElement.value === '')
      }
    }
  }
}
