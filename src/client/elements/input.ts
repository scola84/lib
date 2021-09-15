import { FieldElement } from './field'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'
import { customElement } from 'lit/decorators.js'
import styles from '../styles/input'

declare global {
  interface HTMLElementTagNameMap {
    'scola-input': InputElement
  }
}

@customElement('scola-input')
export class InputElement extends FieldElement {
  public static styles = [
    ...FieldElement.styles,
    styles
  ]

  public fieldElement: HTMLInputElement

  protected updaters = InputElement.updaters

  public appendValueTo (data: FormData | URLSearchParams): void {
    this.clearError()

    if (this.isSuccessful) {
      if (
        this.fieldElement.files instanceof FileList &&
        data instanceof FormData
      ) {
        Array
          .from(this.fieldElement.files)
          .forEach((file) => {
            data.append(this.name, file, file.name)
          })
      } else {
        data.append(this.name, this.fieldElement.value)
      }
    }
  }

  public firstUpdated (properties: PropertyValues): void {
    const fieldElement = this.fieldElement.cloneNode(true)

    if (fieldElement instanceof HTMLInputElement) {
      this.fieldElement = fieldElement
      this.bodySlotElement.insertBefore(fieldElement, this.suffixSlotElement)
    }

    super.firstUpdated(properties)
  }

  protected setFile (file: File): void {
    const transfer = new DataTransfer()

    transfer.items.add(file)
    this.fieldElement.files = transfer.files
  }

  protected setValueFromStruct (struct: Struct): void {
    if (struct.file instanceof File) {
      this.setFile(struct.file)
    } else {
      super.setValueFromStruct(struct)
    }
  }
}
