import type { CSSResultGroup, PropertyValues, TemplateResult } from 'lit'
import { css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { ClipElement } from './clip'
import { InputElement } from './input'
import type { NodeElement } from './node'

declare global {
  interface HTMLElementTagNameMap {
    'scola-select': SelectElement
  }
}

@customElement('scola-select')
export class SelectElement extends InputElement {
  public static styles: CSSResultGroup[] = [
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

  public static updaters = {
    ...InputElement.updaters,
    'scola-clip': (source: SelectElement, target: NodeElement, properties: PropertyValues): void => {
      if (properties.has('hidden')) {
        source.toggleChecked(!target.hidden).catch(() => {})
      } else if (
        source.checked === true &&
        target.parentElement instanceof ClipElement
      ) {
        target.parentElement.toggleContentOrInner(target).catch(() => {})
      }
    },
    'scola-select': (source: SelectElement, target: SelectElement): void => {
      source.toggleChecked(target.checked).catch(() => {})
    }
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

    if (this.inputElement instanceof HTMLInputElement) {
      if (data.checked === true) {
        this.toggleChecked(true).catch(() => {})
      }
    }
  }

  public setValue (data: Record<string, unknown>): void {
    this.clearError()

    if (
      this.inputElement instanceof HTMLInputElement &&
      this.isDefined(this.inputElement, data)
    ) {
      if (data[this.inputElement.name] === this.inputElement.value) {
        this.toggleChecked(true).catch(() => {})
      }
    }
  }

  public async toggleChecked (force?: boolean): Promise<void> {
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
      this.rangeElement.value = `${value}`
    })
  }

  protected handleClick (): void {
    super.handleClick()

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
