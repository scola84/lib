import type { CSSResultGroup, PropertyValues } from 'lit'
import { DialogElement } from './dialog'
import { FormatElement } from './format'
import { InputElement } from './input'
import { NodeElement } from './node'
import type { NodeEvent } from './node'
import { SelectElement } from './select'
import { css } from 'lit'
import { customElement } from 'lit/decorators.js'

declare global {
  interface HTMLElementEventMap {
    'scola-picker-pick': NodeEvent
  }

  interface HTMLElementTagNameMap {
    'scola-picker': PickerElement
  }
}

@customElement('scola-picker')
export class PickerElement extends InputElement {
  public static styles: CSSResultGroup[] = [
    ...InputElement.styles,
    css`
      input {
        opacity: 0;
        position: absolute;
        width: 0;
        z-index: -1;
      }

      slot[name="body"] {
        cursor: pointer;
      }
    `
  ]

  protected dialogElement?: DialogElement | null

  protected previewElement?: NodeElement | null

  protected updaters = PickerElement.updaters

  protected valueElement?: FormatElement | null

  public constructor () {
    super()
    this.dialogElement = this.querySelector<DialogElement>('scola-dialog')
    this.previewElement = this.querySelector<NodeElement>('[is="preview"]')
    this.valueElement = this.querySelector<FormatElement>('[is="value"]')
    this.dialogElement?.addEventListener('scola-picker-pick', this.handlePick.bind(this))
  }

  public appendValueTo (data: FormData | URLSearchParams): void {
    this.clearError()

    if (
      this.inputElement instanceof HTMLInputElement &&
      this.isSuccessful(this.inputElement)
    ) {
      const {
        files,
        name
      } = this.inputElement

      if (
        files instanceof FileList &&
        data instanceof FormData
      ) {
        Array
          .from(files)
          .forEach((file) => {
            data.append(name, file, file.name)
          })
      } else {
        data.append(name, this.inputElement.value)
      }
    }
  }

  public clearValue (): void {
    switch (this.inputElement?.type) {
      case 'color':
        this.clearValueColor()
        break
      case 'file':
        this.clearValueFile()
        break
      case 'radio':
        this.clearValueRadio()
        break
      default:
        break
    }

    this.setValuePreview()
    this.setValueText()
  }

  public firstUpdated (properties: PropertyValues): void {
    super.firstUpdated(properties)
    this.setValuePreview()
    this.setValueText()
  }

  public setValue (data: Record<string, unknown>): void {
    super.setValue(data)
    this.setValuePreview()
    this.setValueText(data)
  }

  protected clearValueColor (): void {
    super.clearValue('#000000')
  }

  protected clearValueFile (): void {
    super.clearValue()
  }

  protected clearValueRadio (): void {
    Array.from(this.dialogElement
      ?.querySelectorAll<SelectElement>('scola-select') ?? [])
      .forEach((selectElement) => {
        selectElement.toggleChecked(false).catch(() => {})
      })

    super.clearValue()
  }

  protected handleClick (): void {
    switch (this.inputElement?.type) {
      case 'color':
        this.handleClickColor()
        break
      case 'file':
        this.handleClickFile()
        break
      case 'radio':
        this.handleClickRadio()
        break
      default:
        break
    }
  }

  protected handleClickColor (): void {
    super.handleClick()
    this.inputElement?.dispatchEvent(new MouseEvent('click'))
  }

  protected handleClickFile (): void {
    super.handleClick()
    this.inputElement?.dispatchEvent(new MouseEvent('click'))
  }

  protected handleClickRadio (): void {
    super.handleClick()

    if (this.dialogElement instanceof DialogElement) {
      this.dialogElement.anchorElement = this
      this.dialogElement.querySelector<HTMLElement>(':first-child')?.style.setProperty('max-width', `${this.getBoundingClientRect().width}px`)
      this.dialogElement.show().catch(() => {})
    }
  }

  protected handleInput (): void {
    super.handleInput()
    this.setValuePreview()
    this.setValueText()
  }

  protected handlePick (): void {
    this.dialogElement?.hide()

    const checkedElement = Array.from(this.dialogElement
      ?.querySelectorAll<SelectElement>('scola-select') ?? [])
      .find((element) => {
        return element.checked
      })

    if (
      this.inputElement instanceof HTMLInputElement &&
      checkedElement instanceof SelectElement
    ) {
      const data = {
        [this.inputElement.name]: checkedElement.inputElement?.value,
        [`${this.inputElement.name}_text`]: checkedElement.inputElement?.nextElementSibling?.textContent
      }

      super.setValue(data)
      super.handleInput()
      this.setValueText(data)
    }
  }

  protected setValuePreview (): void {
    switch (this.inputElement?.type) {
      case 'color':
        this.setValuePreviewColor()
        break
      default:
        break
    }
  }

  protected setValuePreviewColor (): void {
    if (
      this.inputElement instanceof HTMLInputElement &&
      this.previewElement instanceof NodeElement
    ) {
      this.previewElement.style.setProperty('background', this.inputElement.value)
    }
  }

  protected setValueText (data?: Record<string, unknown>): void {
    switch (this.inputElement?.type) {
      case 'color':
        this.setValueTextColor()
        break
      case 'file':
        this.setValueTextFile()
        break
      case 'radio':
        this.setValueTextRadio(data)
        break
      default:
        break
    }
  }

  protected setValueTextColor (): void {
    if (
      this.inputElement instanceof HTMLInputElement &&
      this.valueElement instanceof FormatElement
    ) {
      const { value: hex } = this.inputElement

      const [red, green, blue] =
        hex
          .slice(1)
          .match(/.{2}/gu)
          ?.map((part) => {
            return parseInt(part, 16)
          }) ?? []

      let count = 1

      if (hex === '') {
        count = 0
      }

      this.valueElement.data = {
        blue,
        count,
        green,
        hex,
        red
      }
    }
  }

  protected setValueTextFile (): void {
    if (
      this.inputElement instanceof HTMLInputElement &&
      this.valueElement instanceof FormatElement
    ) {
      const files = Array.from(this.inputElement.files ?? [])

      this.valueElement.data = {
        count: files.length,
        name: files[0]?.name,
        size: files.reduce((total, file) => {
          return total + file.size
        }, 0)
      }
    }
  }

  protected setValueTextRadio (data?: Record<string, unknown>): void {
    if (
      this.inputElement instanceof HTMLInputElement &&
      this.valueElement instanceof FormatElement
    ) {
      let count = 0

      if (data?.[`${this.inputElement.name}_text`] !== undefined) {
        count = 1
      }

      this.valueElement.data = {
        count,
        text: data?.[`${this.inputElement.name}_text`]
      }
    }
  }
}
