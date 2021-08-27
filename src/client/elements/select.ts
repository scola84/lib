import type { CSSResultGroup, PropertyValues } from 'lit'
import { cast, isObject } from '../../common'
import { customElement, property } from 'lit/decorators.js'
import { InputElement } from './input'
import styles from '../styles/select'
import updaters from '../updaters/select'

declare global {
  interface HTMLElementTagNameMap {
    'scola-select': SelectElement
  }
}

@customElement('scola-select')
export class SelectElement extends InputElement {
  public static styles: CSSResultGroup[] = [
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

  protected switchElement?: HTMLInputElement

  protected updaters = SelectElement.updaters

  public appendValueTo (formData: FormData | URLSearchParams): void {
    this.clearError()

    if (this.isSuccessful) {
      if (this.isChecked) {
        formData.append(this.name, this.fieldElement.value)
      }
    }
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

  protected createEventData (): Record<string, unknown> {
    return {
      checked: this.checked,
      label: this.querySelector('[as="value"]')?.textContent,
      name: this.name,
      value: this.value
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

  protected setData (data: Record<string, unknown>): void {
    this.clearError()

    const value = data[this.name]

    if (isObject(value)) {
      if (value.code !== undefined) {
        this.setError(value)
      } else if (value.value !== undefined) {
        this.setValue(value.value)
      }
    } else if (data.value !== undefined) {
      this.setInput(data)
    } else if (value !== undefined) {
      this.setValue(value)
    }
  }

  protected setInput (data: Record<string, unknown>): void {
    super.setInput(data)

    if (cast(data.checked) === true) {
      this.toggleChecked(true, 0).catch(() => {})
    }
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

  protected setValue (value: unknown): void {
    if (value === this.value) {
      this.toggleChecked(true, 0).catch(() => {})
    }
  }
}
