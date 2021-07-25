import type { CSSResultGroup, PropertyValues, TemplateResult } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { InputElement } from './input'
import { html } from 'lit'
import styles from '../styles/select'
import updaters from '../updaters/select'

declare global {
  interface HTMLElementTagNameMap {
    'scola-select': SelectElement
  }
}

@customElement('scola-select')
export class SelectElement extends InputElement {
  public static styles: CSSResultGroup[] = [
    ...InputElement.styles,
    styles
  ]

  public static updaters = {
    ...InputElement.updaters,
    ...updaters
  }

  @property({
    reflect: true,
    type: Boolean
  })
  public checked?: boolean

  @property({
    attribute: 'fill-checked',
    reflect: true
  })
  public fillChecked?: 'sig-1' | 'sig-2'

  @property({
    reflect: true,
    type: Boolean
  })
  public switch?: boolean

  @query('input[type="range"]', true)
  protected rangeElement: HTMLInputElement

  protected updaters = SelectElement.updaters

  public appendValueTo (formData: FormData | URLSearchParams): void {
    this.clearError()

    if (
      this.inputElement instanceof HTMLInputElement &&
      this.isSuccessful(this.inputElement)
    ) {
      if (this.inputElement.checked) {
        formData.append(this.inputElement.name, this.inputElement.value)
      }
    }
  }

  public connectedCallback (): void {
    this.inputElement = this.querySelector<HTMLInputElement>(':scope > input, :scope > textarea')
    super.connectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.checked = this.inputElement?.checked

    if (this.switch !== true) {
      this.duration = 0
    }

    if (this.inputElement?.checked === true) {
      this.rangeElement.value = '1'
    } else {
      this.rangeElement.value = '0'
    }

    super.firstUpdated(properties)
  }

  public render (): TemplateResult {
    return html`
      <slot name="header"></slot>
      <slot name="body">
        <slot name="before"></slot>
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
        <input type="range" min="0" max="1" step="0.01" value="0" disabled />
        <slot name="after"></slot>
      </slot>
      <slot name="footer"></slot>
    `
  }

  public setInput (data: Record<string, unknown>): void {
    super.setInput(data)

    if (
      this.inputElement instanceof HTMLInputElement &&
      data.checked === true
    ) {
      this.toggleChecked(true, 0).catch(() => {})
    }
  }

  public setValue (data: Record<string, unknown>): void {
    if (
      this.inputElement instanceof HTMLInputElement &&
      data[this.inputElement.name] === this.inputElement.value
    ) {
      this.toggleChecked(true, 0).catch(() => {})
    }
  }

  public async toggleChecked (force?: boolean, duration = this.duration): Promise<void> {
    if (
      force !== undefined &&
      this.checked === force
    ) {
      return
    }

    if (this.inputElement instanceof HTMLInputElement) {
      this.checked = force ?? !(this.checked === true)
      this.inputElement.checked = this.checked
    }

    let from = 0
    let to = 0

    if (this.inputElement?.checked === true) {
      to = 1
    } else {
      from = 1
    }

    await this.ease(from, to, (value) => {
      this.rangeElement.value = value.toString()
    }, duration)
  }

  protected handleClick (event: MouseEvent): void {
    super.handleClick(event)

    if (this.inputElement?.type === 'checkbox') {
      this.handleClickCheckbox()
    } else {
      this.handleClickRadio()
    }
  }

  protected handleClickCheckbox (): void {
    this
      .toggleChecked()
      .then(() => {
        super.handleInput()
      })
      .catch(() => {})
  }

  protected handleClickRadio (): void {
    Promise
      .all(Array
        .from(this.parentElement?.querySelectorAll<SelectElement>('scola-select') ?? [])
        .map(async (selectElement: SelectElement) => {
          return selectElement.toggleChecked(selectElement === this)
        }))
      .then(() => {
        super.handleInput()
      })
      .catch(() => {})
  }
}
