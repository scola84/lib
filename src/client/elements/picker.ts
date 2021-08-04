import type { CSSResultGroup, PropertyValues } from 'lit'
import { isArray, isObject, isPrimitive } from '../../common'
import { DialogElement } from './dialog'
import { FormatElement } from './format'
import { InputElement } from './input'
import type { ListElement } from './list'
import { NodeElement } from './node'
import type { SelectElement } from './select'
import { customElement } from 'lit/decorators.js'
import styles from '../styles/picker'

declare global {
  interface HTMLElementEventMap {
    'scola-picker-pick': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-picker': PickerElement
  }
}

@customElement('scola-picker')
export class PickerElement extends InputElement {
  public static styles: CSSResultGroup[] = [
    ...InputElement.styles,
    styles
  ]

  protected dialogElement: DialogElement | null

  protected listElement: ListElement | null

  protected previewElement: NodeElement | null

  protected updaters = PickerElement.updaters

  protected valueElement: FormatElement | null

  public constructor () {
    super()
    this.dialogElement = this.querySelector<DialogElement>(':scope > scola-dialog')
    this.listElement = this.querySelector<ListElement>(':scope > scola-list')
    this.previewElement = this.querySelector<NodeElement>('[as="preview"]')
    this.valueElement = this.querySelector<FormatElement>('[as="value"]')
  }

  public appendValueTo (data: FormData | URLSearchParams): void {
    this.clearError()

    if (this.isSuccessful) {
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
    switch (this.inputElement.type) {
      case 'checkbox':
        this.clearValueCheckbox()
        break
      case 'color':
        this.clearValueColor()
        break
      case 'date':
        this.clearValueDate()
        break
      case 'file':
        this.clearValueFile()
        break
      case 'radio':
        this.clearValueRadio()
        break
      case 'text':
        this.clearValueText()
        break
      case 'time':
        this.clearValueTime()
        break
      default:
        break
    }

    this.setValuePreview()
    this.setValueText()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.dialogElement?.addEventListener('scola-picker-pick', this.handlePick.bind(this))
    this.setValuePreview()
    this.setValueText()
    super.firstUpdated(properties)
  }

  protected clearValueCheckbox (): void {
    Array
      .from(this.dialogElement?.querySelectorAll<SelectElement>('scola-select') ?? [])
      .forEach((selectElement) => {
        selectElement.toggleChecked(false).catch(() => {})
      })

    super.clearValue()
  }

  protected clearValueColor (): void {
    super.clearValue('#000000')
  }

  protected clearValueDate (): void {
    super.clearValue()
  }

  protected clearValueFile (): void {
    super.clearValue()
  }

  protected clearValueRadio (): void {
    Array
      .from(this.dialogElement?.querySelectorAll<SelectElement>('scola-select') ?? [])
      .forEach((selectElement) => {
        selectElement.toggleChecked(false).catch(() => {})
      })

    super.clearValue()
  }

  protected clearValueText (): void {
    Array
      .from(this.dialogElement?.querySelectorAll<SelectElement>('scola-select') ?? [])
      .forEach((selectElement) => {
        selectElement.toggleChecked(false).catch(() => {})
      })

    super.clearValue()
  }

  protected clearValueTime (): void {
    super.clearValue()
  }

  protected handleClick (event: MouseEvent): void {
    switch (this.inputElement.type) {
      case 'checkbox':
        this.handleClickCheckbox()
        break
      case 'color':
        this.handleClickColor()
        break
      case 'date':
        this.handleClickDate()
        break
      case 'file':
        this.handleClickFile()
        break
      case 'radio':
        this.handleClickRadio()
        break
      case 'text':
        this.handleClickText()
        break
      case 'time':
        this.handleClickTime()
        break
      default:
        break
    }

    super.handleClick(event)
  }

  protected handleClickCheckbox (): void {
    this.showDialog()
  }

  protected handleClickColor (): void {
    this.inputElement.click()
  }

  protected handleClickDate (): void {
    this.inputElement.click()
  }

  protected handleClickFile (): void {
    this.inputElement.click()
  }

  protected handleClickRadio (): void {
    this.showDialog()
  }

  protected handleClickText (): void {
    this.showDialog()
  }

  protected handleClickTime (): void {
    this.inputElement.click()
  }

  protected handleInput (): void {
    switch (this.inputElement.type) {
      case 'text':
        this.handleInputText()
        break
      default:
        break
    }

    super.handleInput()
    this.setValuePreview()
    this.setValueText()
  }

  protected handleInputText (): void {
    this.showDialog()
  }

  protected handlePick (event: CustomEvent<Record<string, unknown> | null>): void {
    this.hideDialog()

    const data = event.detail?.data

    if (isObject(data)) {
      super.setInput(data)
      this.setValuePreview()
      this.setValueText(data)
    }

    if (this.save === true) {
      this.saveState()
    }

    this.toggleClear(this.isEmpty)
    this.dispatchEvents(this.createEventData(), event)
  }

  protected hideDialog (): void {
    if (this.dialogElement instanceof DialogElement) {
      this.dialogElement.hide().catch(() => {})
    }
  }

  protected setCursor (): void {
    switch (this.inputElement.type) {
      case 'checkbox':
      case 'color':
      case 'date':
      case 'file':
      case 'radio':
      case 'time':
        this.cursor = 'pointer'
        break
      default:
        super.setCursor()
        break
    }
  }

  protected setData (data: Record<string, unknown>): void {
    this.clearError()

    const value = data[this.name]

    if (isObject(value)) {
      if (value.code !== undefined) {
        this.setError(value)
      } else if (value.value !== undefined) {
        this.setInput(value)
      }
    } else if (isArray(value)) {
      this.setList(value)
    } else if (data.value !== undefined) {
      this.setInput(data)
    } else if (value !== undefined) {
      this.setValue(value)
    }
  }

  protected setInput (data: Record<string, unknown>): void {
    super.setInput(data)
    this.setValuePreview()
    this.setValueText(data)
  }

  protected setList (data: unknown[]): void {
    switch (this.inputElement.type) {
      case 'checkbox':
        this.setListCheckbox(data)
        break
      default:
        break
    }
  }

  protected setListCheckbox (data: unknown[]): void {
    data.forEach((item) => {
      if (isObject(item)) {
        this.listElement?.addItem(item)
      }
    })
  }

  protected setValue (value: unknown): void {
    super.setValue(value)
    this.setValuePreview()
    this.setValueText({})
  }

  protected setValuePreview (): void {
    switch (this.inputElement.type) {
      case 'color':
        this.setValuePreviewColor()
        break
      default:
        break
    }
  }

  protected setValuePreviewColor (): void {
    if (this.previewElement instanceof NodeElement) {
      this.previewElement.style.setProperty('background', this.inputElement.value)
    }
  }

  protected setValueText (data?: Record<string, unknown>): void {
    switch (this.inputElement.type) {
      case 'color':
        this.setValueTextColor()
        break
      case 'date':
        this.setValueTextDate()
        break
      case 'file':
        this.setValueTextFile()
        break
      case 'radio':
        this.setValueTextRadio(data)
        break
      case 'text':
        this.setValueTextText(data)
        break
      case 'time':
        this.setValueTextTime()
        break
      default:
        break
    }
  }

  protected setValueTextColor (): void {
    if (this.valueElement instanceof FormatElement) {
      const { value } = this.inputElement
      const hex = value

      const [
        red,
        green,
        blue
      ] = value
        .slice(1)
        .match(/.{2}/gu)
        ?.map((part) => {
          return parseInt(part, 16)
        }) ?? []

      let count = 0

      if (value !== '') {
        count = 1
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

  protected setValueTextDate (): void {
    if (this.valueElement instanceof FormatElement) {
      const { value } = this.inputElement

      let count = 0
      let date = null

      if (value !== '') {
        count = 1
        date = new Date(value)
      }

      this.valueElement.data = {
        count,
        date
      }
    }
  }

  protected setValueTextFile (): void {
    if (this.valueElement instanceof FormatElement) {
      const files = Array.from(this.inputElement.files ?? [])

      this.valueElement.data = {
        count: files.length,
        name: files[0]?.name,
        size: files.reduce((result, file) => {
          return result + file.size
        }, 0)
      }
    }
  }

  protected setValueTextRadio (data?: Record<string, unknown>): void {
    if (this.valueElement instanceof FormatElement) {
      let count = 0

      if (data?.label !== undefined) {
        count = 1
      }

      this.valueElement.data = {
        count,
        label: data?.label
      }
    }
  }

  protected setValueTextText (data?: Record<string, unknown>): void {
    const value = data?.label

    if (isPrimitive(value)) {
      this.value = value.toString()
    }
  }

  protected setValueTextTime (): void {
    if (this.valueElement instanceof FormatElement) {
      const { value } = this.inputElement

      let count = 0
      let time = null

      if (value !== '') {
        count = 1
        time = new Date(`${new Date().toDateString()} ${value}`)
      }

      this.valueElement.data = {
        count,
        time
      }
    }
  }

  protected showDialog (): void {
    if (this.dialogElement instanceof DialogElement) {
      this.dialogElement.anchorElement = this
      this.dialogElement.show().catch(() => {})
    }
  }
}
