import type { Primitive, Struct } from '../../common'
import { isArray, isPrimitive, isStruct } from '../../common'
import { DialogElement } from './dialog'
import { FormatElement } from './format'
import { InputElement } from './input'
import type { ListElement } from './list'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
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
  public static styles = [
    ...InputElement.styles,
    styles
  ]

  public cursor: InputElement['cursor'] = 'pointer'

  protected dialogElement: DialogElement | null

  protected handlePickBound = this.handlePick.bind(this)

  protected labelElement: FormatElement | null

  protected listElement: ListElement | null

  protected previewElement: NodeElement | null

  protected updaters = PickerElement.updaters

  public constructor () {
    super()
    this.dialogElement = this.querySelector<DialogElement>(':scope > scola-dialog')
    this.labelElement = this.querySelector<FormatElement>('[as="label"]')
    this.listElement = this.querySelector<ListElement>(':scope > scola-list')
    this.previewElement = this.querySelector<NodeElement>('[as="preview"]')
  }

  public clearValue (): void {
    switch (this.fieldElement?.type) {
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

    this.setPreview()
    this.setLabel()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.setUpValue()
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
    switch (this.fieldElement?.type) {
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
    this.fieldElement?.click()
  }

  protected handleClickDate (): void {
    this.fieldElement?.click()
  }

  protected handleClickFile (): void {
    this.fieldElement?.click()
  }

  protected handleClickRadio (): void {
    this.showDialog()
  }

  protected handleClickText (): void {
    this.showDialog()
  }

  protected handleClickTime (): void {
    this.fieldElement?.click()
  }

  protected handleData (): void {
    if (isArray(this.data)) {
      this.setList(this.data)
    }

    super.handleData()
  }

  protected handleInput (): void {
    switch (this.fieldElement?.type) {
      case 'text':
        this.handleInputText()
        break
      default:
        break
    }

    super.handleInput()
    this.setPreview()
    this.setLabel()
  }

  protected handleInputText (): void {
    this.showDialog()
  }

  protected handlePick (event: CustomEvent<Struct | null>): void {
    this.hideDialog()

    const data = event.detail?.data

    if (isStruct(data)) {
      this.setValueFromStruct(data)
    }

    if (this.save === true) {
      this.saveState()
    }

    this.toggleClear(this.isEmpty)
    this.dispatchEvents(this.createDispatchItems(), event)
  }

  protected hideDialog (): void {
    if (this.dialogElement instanceof DialogElement) {
      this.dialogElement.hide().catch(() => {})
    }
  }

  protected setCheckboxList (data: unknown[]): void {
    data.forEach((item) => {
      if (isStruct(item)) {
        this.listElement?.addItem(item)
      }
    })
  }

  protected setColorLabel (): void {
    if (this.labelElement instanceof FormatElement) {
      const { value = '' } = this.fieldElement ?? {}
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

      this.labelElement.data = {
        blue,
        count,
        green,
        hex,
        red
      }
    }
  }

  protected setColorPreview (): void {
    if (
      this.fieldElement instanceof HTMLInputElement &&
      this.previewElement instanceof NodeElement
    ) {
      this.previewElement.style.setProperty('background', this.fieldElement.value)
    }
  }

  protected setDateLabel (): void {
    if (this.labelElement instanceof FormatElement) {
      const { value = '' } = this.fieldElement ?? {}

      let count = 0
      let date = null

      if (value !== '') {
        count = 1
        date = new Date(value)
      }

      this.labelElement.data = {
        count,
        date
      }
    }
  }

  protected setFileLabel (): void {
    if (this.labelElement instanceof FormatElement) {
      const files = Array.from(this.fieldElement?.files ?? [])

      this.labelElement.data = {
        count: files.length,
        name: files[0]?.name,
        size: files.reduce((result, file) => {
          return result + file.size
        }, 0)
      }
    }
  }

  protected setLabel (data?: Struct): void {
    switch (this.fieldElement?.type) {
      case 'color':
        this.setColorLabel()
        break
      case 'date':
        this.setDateLabel()
        break
      case 'file':
        this.setFileLabel()
        break
      case 'radio':
        this.setRadioLabel(data)
        break
      case 'text':
        this.setTextLabel(data)
        break
      case 'time':
        this.setTimeLabel()
        break
      default:
        break
    }
  }

  protected setList (data: unknown[]): void {
    switch (this.fieldElement?.type) {
      case 'checkbox':
        this.setCheckboxList(data)
        break
      default:
        break
    }
  }

  protected setPreview (): void {
    switch (this.fieldElement?.type) {
      case 'color':
        this.setColorPreview()
        break
      default:
        break
    }
  }

  protected setRadioLabel (data?: Struct): void {
    if (this.labelElement instanceof FormatElement) {
      let count = 0

      if (data?.label !== undefined) {
        count = 1
      }

      this.labelElement.data = {
        count,
        label: data?.label
      }
    }
  }

  protected setTextLabel (data?: Struct): void {
    const value = data?.label

    if (isPrimitive(value)) {
      this.value = value.toString()
    }
  }

  protected setTimeLabel (): void {
    if (this.labelElement instanceof FormatElement) {
      const { value = '' } = this.fieldElement ?? {}

      let count = 0
      let time = null

      if (value !== '') {
        count = 1
        time = new Date(`${new Date().toDateString()} ${value}`)
      }

      this.labelElement.data = {
        count,
        time
      }
    }
  }

  protected setUpElementListeners (): void {
    this.dialogElement?.addEventListener('scola-picker-pick', this.handlePickBound)
    super.setUpElementListeners()
  }

  protected setUpValue (): void {
    this.setLabel()
    this.setPreview()
  }

  protected setValueFromPrimitive (primitive: Primitive): void {
    super.setValueFromPrimitive(primitive)
    this.setLabel({})
    this.setPreview()
  }

  protected setValueFromStruct (struct: Struct): void {
    super.setValueFromStruct(struct)
    this.setLabel(struct)
    this.setPreview()
  }

  protected showDialog (): void {
    if (this.dialogElement instanceof DialogElement) {
      this.dialogElement.anchorElement = this
      this.dialogElement.show().catch(() => {})
    }
  }
}
