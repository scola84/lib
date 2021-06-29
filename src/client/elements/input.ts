import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FormatElement } from './format'
import { NodeElement } from './node'
import { css } from 'lit'

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
  public static styles: CSSResultGroup[] = [
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

    if (this.inputElement instanceof HTMLInputElement && this.isSuccessful(this.inputElement)) {
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
    }

    if (this.clearElement instanceof NodeElement) {
      this.clearElement.hidden = true
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
    if (this.inputElement instanceof HTMLInputElement && this.isDefined(this.inputElement, data)) {
      if (this.errorElement instanceof FormatElement) {
        Object.assign(this.errorElement, data[this.inputElement.name])
        this.errorElement.hidden = false
      }
    }
  }

  public setValue (data: Record<string, unknown>): void {
    this.clearError()

    if (this.inputElement instanceof HTMLInputElement && this.isDefined(this.inputElement, data)) {
      this.inputElement.value = String(data[this.inputElement.name])

      if (this.clearElement instanceof NodeElement) {
        this.clearElement.hidden = this.inputElement.value === ''
      }
    }
  }

  public updated (properties: PropertyValues): void {
    if (properties.has('disabled')) {
      if (this.inputElement instanceof HTMLInputElement) {
        this.inputElement.disabled = this.disabled === true
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

    if (this.inputElement instanceof HTMLInputElement) {
      this.dispatchEvent(new CustomEvent<InputEvent['detail']>('scola-input', {
        detail: {
          origin: this,
          value: this.inputElement.value
        }
      }))

      if (this.clearElement instanceof NodeElement) {
        this.clearElement.hidden = this.inputElement.value === ''
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
