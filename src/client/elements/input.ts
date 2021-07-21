import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FormatElement } from './format'
import { NodeElement } from './node'
import { css } from 'lit'

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

  public inputElement?: HTMLInputElement | null

  protected clearElement?: NodeElement | null

  protected errorElement?: FormatElement | null

  protected storage = InputElement.storage

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

      if (this.clearElement instanceof NodeElement) {
        this.clearElement.hidden = true
      }

      this.requestUpdate()
    }
  }

  public connectedCallback (): void {
    if (this.save === true) {
      this.loadValue()
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
    super.firstUpdated(properties)
  }

  public setError (data: Record<string, unknown>): void {
    if (
      this.inputElement instanceof HTMLInputElement &&
      this.isDefined(this.inputElement, data)
    ) {
      if (this.errorElement instanceof FormatElement) {
        Object.assign(this.errorElement, data[this.inputElement.name])
        this.errorElement.hidden = false
      }
    }
  }

  public setInput (data: Record<string, unknown>): void {
    if (this.inputElement instanceof HTMLInputElement) {
      if (data.name !== undefined) {
        this.inputElement.name = String(data.name)
      }

      if (data.value !== undefined) {
        this.inputElement.value = String(data.value)
        this.requestUpdate()
      }
    }
  }

  public setValue (data: Record<string, unknown>): void {
    this.clearError()

    if (
      this.inputElement instanceof HTMLInputElement &&
      this.isDefined(this.inputElement, data)
    ) {
      this.inputElement.value = String(data[this.inputElement.name])

      if (this.clearElement instanceof NodeElement) {
        this.clearElement.hidden = this.inputElement.value === ''
      }

      this.requestUpdate()
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
      if (this.clearElement instanceof NodeElement) {
        this.clearElement.hidden = this.inputElement.value === ''
      }

      this.requestUpdate()
    }

    this.dispatchEvents()
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
      this.inputElement.value = this.storage.getItem(this.id) ?? ''
      this.requestUpdate()
    }
  }

  protected saveValue (): void {
    if (this.inputElement instanceof HTMLInputElement) {
      if (this.inputElement.value === '') {
        this.storage.removeItem(this.id)
      } else {
        this.storage.setItem(this.id, this.inputElement.value)
      }
    }
  }
}
