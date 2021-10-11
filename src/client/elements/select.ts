import type { Primitive, Struct } from '../../common'
import { cast, isStruct } from '../../common'
import { customElement, property } from 'lit/decorators.js'
import { InputElement } from './input'
import type { PropertyValues } from 'lit'
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

  public cursor: InputElement['cursor'] = 'pointer'

  public get isChecked (): boolean {
    return this.fieldElement?.checked === true
  }

  public get isSuccessful (): boolean {
    return (
      super.isSuccessful &&
      this.isChecked
    )
  }

  protected labelItem: HTMLElement | null

  protected switchElement?: HTMLInputElement

  protected updaters = SelectElement.updaters

  public constructor () {
    super()
    this.labelItem = this.querySelector('[as="label"]')
  }

  public firstUpdated (properties: PropertyValues): void {
    this.checked = this.isChecked

    if (this.switch === true) {
      this.setUpSwitch()
    } else {
      this.duration = 0
    }

    super.firstUpdated(properties)
  }

  public setValueFromPrimitive (primitive: Primitive): void {
    if (primitive === cast(this.value)) {
      this.toggleChecked(true, 0).catch(() => {})
    } else {
      super.setValueFromPrimitive(primitive)
    }
  }

  public setValueFromStruct (struct: Struct): void {
    if (this.fieldElement?.getAttribute('value') === null) {
      super.setValueFromStruct(struct)
    } else if (struct.value === cast(this.value)) {
      this.toggleChecked(true, 0).catch(() => {})
    }
  }

  public async toggleChecked (force?: boolean, duration = this.duration): Promise<void> {
    if (
      force !== undefined &&
      this.isChecked === force
    ) {
      return
    }

    this.checked = force ?? !(this.checked === true)

    if (this.fieldElement instanceof HTMLInputElement) {
      this.fieldElement.checked = this.checked
    }

    let from = 0
    let to = 0

    if (this.isChecked) {
      to = 100
    } else {
      from = 100
    }

    await this.ease(from, to, (value) => {
      if (this.switchElement instanceof HTMLInputElement) {
        this.switchElement.value = value.toString()
      }
    }, duration)
  }

  protected createDispatchItems (): unknown[] {
    return super
      .createDispatchItems()
      .map((data) => {
        if (isStruct(data)) {
          return {
            ...data,
            label: this.labelItem?.textContent
          }
        }

        return data
      })
  }

  protected handleClick (event: MouseEvent): void {
    super.handleClick(event)

    if (this.fieldElement?.type === 'checkbox') {
      this.handleClickCheckbox()
    } else {
      this.handleClickRadio()
    }
  }

  protected handleClickCheckbox (): void {
    this
      .toggleChecked()
      .finally(() => {
        super.handleInput()
      })
  }

  protected handleClickRadio (): void {
    Promise
      .all(Array
        .from(this.parentElement?.querySelectorAll<SelectElement>('scola-select') ?? [])
        .map(async (selectElement: SelectElement) => {
          return selectElement.toggleChecked(selectElement === this)
        }))
      .finally(() => {
        super.handleInput()
      })
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
}
