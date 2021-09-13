import type { Primitive, Struct } from '../../common'
import { customElement, property } from 'lit/decorators.js'
import { InputElement } from './input'
import type { PropertyValues } from 'lit'
import { cast } from '../../common'
import styles from '../styles/select'
import updaters from '../updaters/select'

declare global {
  interface HTMLElementTagNameMap {
    'scola-select': SelectElement
  }
}

@customElement('scola-select')
export class SelectElement extends InputElement {
  public static styles = [
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

  public get isChecked (): boolean {
    return this.fieldElement.checked
  }

  public get isSuccessful (): boolean {
    return (
      super.isSuccessful &&
      this.isChecked
    )
  }

  protected switchElement?: HTMLInputElement

  protected updaters = SelectElement.updaters

  public firstUpdated (properties: PropertyValues): void {
    this.checked = this.isChecked

    if (this.switch === true) {
      this.setUpSwitch()
    } else {
      this.duration = 0
    }

    super.firstUpdated(properties)
  }

  public async toggleChecked (force?: boolean, duration = this.duration): Promise<void> {
    if (
      force !== undefined &&
      this.isChecked === force
    ) {
      return
    }

    this.checked = force ?? !(this.checked === true)
    this.fieldElement.checked = this.checked

    const { switchElement } = this

    if (switchElement === undefined) {
      return
    }

    let from = 0
    let to = 0

    if (this.isChecked) {
      to = 100
    } else {
      from = 100
    }

    await this.ease(from, to, (value) => {
      switchElement.value = value.toString()
    }, duration)
  }

  protected createEventData (): Struct {
    return {
      ...super.createEventData(),
      label: this.querySelector('[as="label"]')?.textContent
    }
  }

  protected handleClick (event: MouseEvent): void {
    super.handleClick(event)

    if (this.fieldElement.type === 'checkbox') {
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

  protected setUpSwitch (): void {
    this.switchElement = document.createElement('input')
    this.switchElement.type = 'range'

    if (this.isChecked) {
      this.switchElement.value = '100'
    } else {
      this.switchElement.value = '0'
    }

    this.shadowBody.insertBefore(this.switchElement, this.afterSlotElement)
  }

  protected setValueFromPrimitive (data: Primitive): void {
    if (data === cast(this.value)) {
      this.toggleChecked(true, 0).catch(() => {})
    }
  }

  protected setValueFromStruct (struct: Struct): void {
    if (this.fieldElement.getAttribute('value') === null) {
      super.setValueFromStruct(struct)
    } else if (struct.value === cast(this.value)) {
      this.toggleChecked(true, 0).catch(() => {})
    }
  }
}
