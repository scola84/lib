import { FieldElement } from './field'
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

  public get hasFiles (): boolean {
    return this.fieldElement?.files instanceof FileList
  }

  public fieldElement: HTMLInputElement | null

  protected updaters = InputElement.updaters

  public appendValueTo (data: FormData | URLSearchParams): void {
    this.clearError()

    if (
      this.fieldElement instanceof HTMLInputElement &&
      this.isSuccessful
    ) {
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

  public setValueFromStruct (struct: Struct): void {
    if (struct.file instanceof File) {
      this.setFile(struct.file)
    } else {
      super.setValueFromStruct(struct)
    }
  }

  protected createDispatchItems (): unknown[] {
    if (this.fieldElement?.files instanceof FileList) {
      return Array
        .from(this.fieldElement.files)
        .map((file) => {
          return {
            file,
            filename: file.name,
            filesize: file.size,
            filetype: file.type,
            name: this.name
          }
        })
    }

    return super.createDispatchItems()
  }

  protected setFile (file: File): void {
    if (this.fieldElement instanceof HTMLInputElement) {
      const transfer = new DataTransfer()

      transfer.items.add(file)
      this.fieldElement.files = transfer.files
    }
  }
}
