import type {
  CSSResult,
  PropertyValues
} from 'lit-element'

import {
  css,
  customElement,
  property
} from 'lit-element'

import { FormatElement } from './format'
import { NodeElement } from './node'

declare global {
  interface HTMLElementEventMap {
    'scola-input': InputEvent
  }

  interface HTMLElementTagNameMap {
    'scola-input': InputElement
  }
}

export interface InputEvent {
  detail: {
    origin: InputElement
    text?: string | null
    value?: string
  } | null
}

@customElement('scola-input')
export class InputElement extends NodeElement {
  public static styles: CSSResult[] = [
    ...NodeElement.styles,
    css`
      input,
      textarea {
        background: none;
        border: none;
        border-radius: 0;
        box-shadow: none;
        color: inherit;
        font-family: inherit;
        font-size: inherit;
        outline: none;
        padding: 0;
        width: 100%;
        -moz-appearance: textfield;
        -webkit-appearance: textfield;
      }

      input::placeholder,
      textarea::placeholder {
        color: inherit;
        opacity: 0.35;
      }

      input[type="search"]::-webkit-search-decoration,
      input[type="search"]::-webkit-search-cancel-button,
      input[type="search"]::-webkit-search-results-button,
      input[type="search"]::-webkit-search-results-decoration {
        display: none;
      }

      slot:not([name])::slotted(input),
      slot:not([name])::slotted(textarea) {
        opacity: 0;
        position: absolute;
        width: 0;
        z-index: -1;
      }

      slot::slotted([hidden]) {
        display: none;
      }
    `
  ]

  @property({
    type: Boolean
  })
  public save?: boolean

  protected handleInputBound: () => void

  protected inputElement?: HTMLInputElement | null

  protected get clearElement (): NodeElement | null {
    return this.querySelector('[is="clear"]')
  }

  protected get errorElement (): FormatElement | null {
    return this.querySelector('[is="error"]')
  }

  public constructor () {
    super()
    this.handleInputBound = this.throttle(this.handleInput.bind(this), { once: true })
    this.addEventListener('click', this.handleClick.bind(this))
    this.addEventListener('scola-input-clear', this.handleClear.bind(this))
  }

  public appendValueTo (data: FormData | URLSearchParams): void {
    this.clearError()
    const { inputElement } = this

    if (inputElement instanceof HTMLInputElement && this.isSuccessful(inputElement)) {
      data.append(inputElement.name, inputElement.value)
    }
  }

  public clearError (): void {
    const { errorElement } = this

    if (errorElement instanceof FormatElement) {
      errorElement.hidden = true
    }
  }

  public clearValue (value = ''): void {
    const {
      clearElement,
      inputElement
    } = this

    if (inputElement instanceof HTMLInputElement) {
      inputElement.value = value
    }

    if (clearElement instanceof NodeElement) {
      clearElement.hidden = true
    }
  }

  public connectedCallback (): void {
    this.inputElement = this
      .querySelector<HTMLInputElement>(':scope > input, :scope > textarea')

    if (this.save === true) {
      this.loadValue()
    }

    super.connectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.inputElement = this.inputElement?.cloneNode(true) as HTMLInputElement | undefined

    if (
      this.inputElement instanceof HTMLInputElement &&
      this.suffixSlotElement instanceof HTMLSlotElement
    ) {
      this.bodySlotElement?.insertBefore(this.inputElement, this.suffixSlotElement)
    }

    this.inputElement?.addEventListener('input', this.handleInputBound)
    super.firstUpdated(properties)
  }

  public getValue (): string | undefined {
    return this.inputElement?.value
  }

  public setError (data: Record<string, unknown>): void {
    const {
      errorElement,
      inputElement
    } = this

    if (inputElement instanceof HTMLInputElement && this.isDefined(inputElement, data)) {
      if (errorElement instanceof FormatElement) {
        Object.assign(errorElement, data[inputElement.name])
        errorElement.hidden = false
      }
    }
  }

  public setValue (data: Record<string, unknown>): void {
    this.clearError()

    const {
      clearElement,
      inputElement
    } = this

    if (inputElement instanceof HTMLInputElement && this.isDefined(inputElement, data)) {
      inputElement.value = String(data[inputElement.name])

      if (clearElement instanceof NodeElement) {
        clearElement.hidden = inputElement.value === ''
      }
    }
  }

  public updated (properties: PropertyValues): void {
    if (properties.has('disabled')) {
      const { inputElement } = this

      if (inputElement instanceof HTMLInputElement) {
        inputElement.disabled = this.disabled === true
      }
    }

    super.updated(properties)
  }

  protected handleClear (): void {
    this.clearValue()
  }

  protected handleClick (): void {
    this.clearError()
  }

  protected handleInput (): void {
    this.clearError()

    if (this.save === true) {
      this.saveValue()
    }

    const {
      clearElement,
      inputElement
    } = this

    if (inputElement instanceof HTMLInputElement) {
      this.dispatchEvent(new CustomEvent<InputEvent['detail']>('scola-input', {
        detail: {
          origin: this,
          value: inputElement.value
        }
      }))

      if (clearElement instanceof NodeElement) {
        clearElement.hidden = inputElement.value === ''
      }
    }
  }

  protected isDefined (inputElement: HTMLInputElement, data: Record<string, unknown>): boolean {
    return data[inputElement.name] !== undefined
  }

  protected isSuccessful (inputElement: HTMLInputElement): boolean {
    return !(
      inputElement.name === '' ||
      inputElement.value === '' ||
      inputElement.disabled
    )
  }

  protected loadValue (): void {
    if (this.inputElement instanceof HTMLInputElement) {
      this.inputElement.value = window.sessionStorage.getItem(this.id) ?? ''
    }
  }

  protected saveValue (): void {
    if (this.inputElement instanceof HTMLInputElement) {
      if (this.inputElement.value === '') {
        window.sessionStorage.removeItem(this.id)
      } else {
        window.sessionStorage.setItem(this.id, this.inputElement.value)
      }
    }
  }
}
