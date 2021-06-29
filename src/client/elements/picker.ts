import type { CSSResultGroup, PropertyValues } from 'lit'
import { FormatElement } from './format'
import { InputElement } from './input'
import { NodeElement } from './node'
import { css } from 'lit'
import { customElement } from 'lit/decorators.js'

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

  protected get previewElement (): NodeElement | null {
    return this.querySelector<NodeElement>('[is="preview"]')
  }

  protected get valueElement (): FormatElement | null {
    return this.querySelector<FormatElement>('[is="value"]')
  }

  public appendValueTo (data: FormData | URLSearchParams): void {
    this.clearError()

    if (this.inputElement instanceof HTMLInputElement && this.isSuccessful(this.inputElement)) {
      if (this.inputElement.files instanceof FileList && data instanceof FormData) {
        for (const file of Array.from(this.inputElement.files)) {
          data.append(this.inputElement.name, file, file.name)
        }
      } else {
        data.append(this.inputElement.name, this.inputElement.value)
      }
    }
  }

  public clearValue (): void {
    switch (this.inputElement?.type) {
      case 'color':
        super.clearValue('#000000')
        break
      default:
        super.clearValue()
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
    this.setValueText()
  }

  protected handleClick (): void {
    super.handleClick()
    this.inputElement?.dispatchEvent(new MouseEvent('click'))
  }

  protected handleInput (): void {
    super.handleInput()
    this.setValuePreview()
    this.setValueText()
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

  protected setValueText (): void {
    switch (this.inputElement?.type) {
      case 'color':
        this.setValueTextColor()
        break
      case 'file':
        this.setValueTextFile()
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

      this.valueElement.data = {
        blue,
        count: hex === '' ? 0 : 1,
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
}
