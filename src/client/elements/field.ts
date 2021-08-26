import { cast, isObject, isPrimitive } from '../../common'
import { customElement, property } from 'lit/decorators.js'
import { FormatElement } from './format'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import updaters from '../updaters/field'

declare global {
  interface HTMLElementTagNameMap {
    'scola-field': FieldElement
  }
}

@customElement('scola-field')
export class FieldElement extends NodeElement {
  public static storage: Storage = window.sessionStorage

  public static updaters = {
    ...NodeElement.updaters,
    ...updaters
  }

  @property({
    type: Boolean
  })
  public save?: boolean

  @property({
    type: Boolean
  })
  public skip?: boolean

  @property({
    attribute: false
  })
  public storage = FieldElement.storage

  public fieldElement: HTMLInputElement | HTMLTextAreaElement

  public get isEmpty (): boolean {
    return this.fieldElement.value === ''
  }

  public get isSuccessful (): boolean {
    return !(
      this.fieldElement.disabled ||
      this.isEmpty ||
      this.name === '' ||
      this.skip === true ||
      this.slot === 'template'
    )
  }

  public get name (): string {
    return this.fieldElement.name
  }

  public get value (): boolean | number | string {
    return cast(this.fieldElement.value)
  }

  public set value (value: boolean | number | string) {
    this.fieldElement.value = value.toString()
  }

  protected clearElement: NodeElement | null

  protected errorElement: FormatElement | null

  protected updaters = FieldElement.updaters

  public constructor () {
    super()

    const fieldElement = this.querySelector<HTMLInputElement | HTMLTextAreaElement>(':scope > input, :scope > textarea')

    if (fieldElement === null) {
      throw new Error('Input element is null')
    }

    this.clearElement = this.querySelector<NodeElement>('[as="clear"]')
    this.errorElement = this.querySelector<FormatElement>('[as="error"]')
    this.fieldElement = fieldElement
  }

  public appendValueTo (data: FormData | URLSearchParams): void {
    this.clearError()

    if (this.isSuccessful) {
      data.append(this.name, this.fieldElement.value)
    }
  }

  public clearError (): void {
    if (this.errorElement instanceof FormatElement) {
      this.errorElement.hidden = true
    }
  }

  public clearValue (value = ''): void {
    this.value = value
    this.toggleClear(true)
  }

  public connectedCallback (): void {
    if (this.save === true) {
      this.loadState()
    }

    super.connectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.addEventListener('click', this.handleClick.bind(this))
    this.addEventListener('scola-input-clear', this.handleClear.bind(this))
    this.fieldElement.addEventListener('input', this.handleInput.bind(this))

    if (this.cursor === undefined) {
      this.setCursor()
    }

    super.firstUpdated(properties)
  }

  public toggleClear (force?: boolean): void {
    if (this.clearElement instanceof NodeElement) {
      if (force === undefined) {
        this.clearElement.hidden = !this.clearElement.hidden
      } else {
        this.clearElement.hidden = force
      }
    }
  }

  public update (properties: PropertyValues): void {
    if (properties.has('disabled')) {
      this.fieldElement.disabled = this.disabled === true
    } else if (properties.has('data')) {
      if (isObject(this.data)) {
        this.setData(this.data)
      }
    }

    super.update(properties)
  }

  protected createEventData (): Record<string, unknown> {
    return {
      name: this.name,
      value: this.value
    }
  }

  protected handleClear (): void {
    this.clearValue()
  }

  protected handleClick (event: MouseEvent): void

  protected handleClick (): void {
    if (this !== document.activeElement) {
      this.fieldElement.focus()
    }

    this.clearError()
  }

  protected handleInput (): void {
    if (this.save === true) {
      this.saveState()
    }

    this.toggleClear(this.isEmpty)
    this.dispatchEvents(this.createEventData())
    this.requestUpdate('value')
  }

  protected loadState (): void {
    this.value = this.storage.getItem(`input-${this.id}`) ?? ''
  }

  protected saveState (): void {
    if (this.isEmpty) {
      this.storage.removeItem(`input-${this.id}`)
    } else {
      this.storage.setItem(`input-${this.id}`, this.fieldElement.value)
    }
  }

  protected setCursor (): void {
    switch (this.fieldElement.type) {
      case 'date':
      case 'datetime-local':
      case 'email':
      case 'month':
      case 'number':
      case 'password':
      case 'search':
      case 'tel':
      case 'text':
      case 'textarea':
      case 'time':
      case 'url':
      case 'week':
        this.cursor = 'text'
        break
      case 'checkbox':
      case 'color':
      case 'file':
      case 'radio':
        this.cursor = 'pointer'
        break
      default:
        this.cursor = 'default'
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
    } else if (data.value !== undefined) {
      this.setInput(data)
    } else if (value !== undefined) {
      this.setValue(value)
    }
  }

  protected setError (data: Record<string, unknown>): void {
    if (this.errorElement instanceof FormatElement) {
      Object.assign(this.errorElement, data)
      this.errorElement.hidden = false
    }
  }

  protected setInput (data: Record<string, unknown>): void {
    if (isPrimitive(data.value)) {
      this.value = data.value.toString()
      this.toggleClear(this.isEmpty)
    }
  }

  protected setValue (value: unknown): void {
    if (isPrimitive(value)) {
      this.value = value.toString()
      this.toggleClear(this.isEmpty)
    }
  }
}
