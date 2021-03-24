import type { CSSResult, PropertyValues, TemplateResult } from 'lit-element'
import { css, customElement, html, property, query } from 'lit-element'
import { InputElement } from './input'
import type { InputEvent } from './input'

declare global {
  interface HTMLElementTagNameMap {
    'scola-select': SelectElement
  }
}

@customElement('scola-select')
export class SelectElement extends InputElement {
  public static styles: CSSResult[] = [
    ...InputElement.styles,
    css`
      input {
        display: none;
      }

      :host([switch]) input[type="range"] {
        border-radius: 0.875rem;
        box-sizing: border-box;
        display: inline-flex;
        height: 1.75rem;
        margin: 0;
        opacity: 1;
        padding: 0.125rem;
        pointer-events: none;
        transition: background 250ms cubic-bezier(0.83, 0, 0.17, 1);
        width: 2.75rem;
        -moz-appearance: none;
        -webkit-appearance: none;
      }

      :host([fill="aux-1"]) input[type="range"] {
        background: var(--scola-select-fill-aux-1, #ddd);
      }

      :host([fill="aux-2"]) input[type="range"] {
        background: var(--scola-select-fill-aux-2, #ccc);
      }

      :host([fill="aux-3"]) input[type="range"] {
        background: var(--scola-select-fill-aux-3, #bbb);
      }

      :host([checked]) input[type="range"] {
        background: var(--scola-select-fill-checked, #000);
      }

      :host([checked][fill-checked="sig-1"]) input[type="range"] {
        background: var(--scola-select-fill-checked-sig-1, #b22222);
      }

      :host([checked][fill-checked="sig-2"]) input[type="range"] {
        background: var(--scola-select-fill-checked-sig-2, #008000);
      }

      input[type="range"]::-moz-range-thumb {
        background: var(--scola-select-fill-thumb, #fff);
        border: none;
        border-radius: 50%;
        box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
        height: 1.5rem;
        width: 1.5rem;
        -moz-appearance: none;
        -webkit-appearance: none;
      }

      input[type="range"]::-webkit-slider-thumb {
        background: var(--scola-select-fill-thumb, #fff);
        border: none;
        border-radius: 50%;
        box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
        height: 1.5rem;
        width: 1.5rem;
        -moz-appearance: none;
        -webkit-appearance: none;
      }

      slot[name="after"]::slotted([is="off"]),
      slot[name="before"]::slotted([is="off"]),
      slot[name="after"]::slotted([is="on"]),
      slot[name="before"]::slotted([is="on"]) {
        display: none;
      }

      :host(:not([checked])) slot[name="after"]::slotted([is="off"]),
      :host(:not([checked])) slot[name="before"]::slotted([is="off"]),
      :host([checked]) slot[name="after"]::slotted([is="on"]),
      :host([checked]) slot[name="before"]::slotted([is="on"]) {
        display: inline-flex;
      }

      slot[name="body"] {
        cursor: pointer;
      }
    `
  ]

  @property({
    reflect: true,
    type: Boolean
  })
  public checked?: boolean

  @property({
    type: Number
  })
  public duration?: number

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

  public appendValueTo (formData: FormData | URLSearchParams): void {
    const { inputElement } = this

    if (inputElement instanceof HTMLInputElement && this.isSuccessful(inputElement)) {
      if (inputElement.checked) {
        formData.append(inputElement.name, inputElement.value)
      }
    }
  }

  public firstUpdated (properties: PropertyValues): void {
    super.firstUpdated(properties)
    this.checked = this.inputElement?.checked
    this.rangeElement.value = String(Number(this.inputElement?.checked))
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

  public setValue (data: Record<string, unknown>): void {
    this.clearError()
    const { inputElement } = this

    if (inputElement instanceof HTMLInputElement && this.isDefined(inputElement, data)) {
      if (data[inputElement.name] === inputElement.value) {
        this.toggleChecked(true)
      }
    }
  }

  public toggleChecked (force?: boolean): void {
    const { inputElement } = this

    if (inputElement instanceof HTMLInputElement) {
      this.checked = force ?? !(this.checked === true)
      inputElement.checked = this.checked
    }

    let from = 0
    let to = 0

    if (inputElement?.checked === true) {
      to = 1
    } else {
      from = 1
    }

    this.ease(from, to, ({ value }) => {
      this.rangeElement.value = String(value)
    }, {
      duration: this.duration,
      name: 'select'
    })
  }

  protected handleClick (): void {
    super.handleClick()

    switch (this.inputElement?.type) {
      case 'checkbox':
        this.handleClickCheckbox()
        break
      case 'radio':
        this.handleClickRadio()
        break
      default:
        break
    }
  }

  protected handleClickCheckbox (): void {
    const { inputElement } = this

    this.toggleChecked()
    this.dispatchEvent(new CustomEvent<InputEvent['detail']>('scola-input', {
      detail: {
        origin: this,
        text: inputElement?.nextElementSibling?.textContent,
        value: inputElement?.value
      }
    }))
  }

  protected handleClickRadio (): void {
    const { inputElement } = this

    this.parentElement
      ?.querySelectorAll<SelectElement>('scola-select')
      .forEach((selectElement: SelectElement) => {
        selectElement.toggleChecked(selectElement === this)
      })

    this.dispatchEvent(new CustomEvent<InputEvent['detail']>('scola-input', {
      detail: {
        origin: this,
        text: inputElement?.nextElementSibling?.textContent,
        value: inputElement?.value
      }
    }))
  }
}
