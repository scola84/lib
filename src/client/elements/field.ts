import type { Primitive, Struct } from '../../common'
import { cast, isPrimitive, isStruct } from '../../common'
import { customElement, property } from 'lit/decorators.js'
import { FormatElement } from './format'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import { debounce } from 'throttle-debounce'
import styles from '../styles/field'
import updaters from '../updaters/field'

declare global {
  interface HTMLElementTagNameMap {
    'scola-field': FieldElement
  }
}

@customElement('scola-field')
export class FieldElement extends NodeElement {
  public static storage: Storage = window.sessionStorage

  public static styles = [
    ...NodeElement.styles,
    styles
  ]

  public static updaters = {
    ...NodeElement.updaters,
    ...updaters
  }

  @property({
    type: Number
  })
  public debounce = 250

  @property({
    type: Boolean
  })
  public parse?: boolean

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

  public cursor: NodeElement['cursor'] = 'text'

  public fieldElement: HTMLInputElement | HTMLTextAreaElement

  public listen = 'input'

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

  public get value (): boolean | number | string {
    return cast(this.fieldElement.value) ?? ''
  }

  public set value (value: boolean | number | string) {
    this.fieldElement.value = value.toString()
  }

  protected clearElement: NodeElement | null

  protected errorElement: FormatElement | null

  protected handleClearBound = this.handleClear.bind(this)

  protected handleClickBound = this.handleClick.bind(this)

  protected handleInputBound = this.handleInput.bind(this)

  protected handleKeydownBound = this.handleKeydown.bind(this)

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
    if (properties.has('data')) {
      this.handleData()
    } else if (properties.has('disabled')) {
      this.handleDisabled()
    }

    super.update(properties)
  }

  protected createDispatchItems (): unknown[] {
    let { value } = this

    if (this.parse === true) {
      value = this.parseValue(this.value.toString())
    }

    return [{
      name: this.name,
      value
    }]
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

  protected handleData (): void {
    this.clearError()

    if (isPrimitive(this.data)) {
      this.setValueFromPrimitive(this.data)
    } else if (isStruct(this.data)) {
      if (isPrimitive(this.data.code)) {
        this.setError(this.data)
      } else {
        this.setValueFromStruct(this.data)
      }
    }

    this.toggleClear(this.isEmpty)
  }

  protected handleDisabled (): void {
    this.fieldElement.disabled = this.disabled === true
  }

  protected handleInput (): void {
    if (this.save === true) {
      this.saveState()
    }

    this.toggleClear(this.isEmpty)
    this.dispatchEvents(this.createDispatchItems())
    this.requestUpdate('value')
  }

  protected handleKeydown (event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.handleInput()
    }
  }

  protected loadState (): void {
    this.value = this.storage.getItem(`input-${this.id}`) ?? ''
  }

  protected parseValue (value: string): string {
    return FormatElement
      .parse(value)
      .map((query) => {
        let stringName = query.name
        let stringValue = query.value

        if (stringName?.includes(' ') === true) {
          stringName = `"${stringName}"`
        }

        if (stringValue.includes(' ')) {
          stringValue = `"${stringValue}"`
        }

        if (stringName === undefined) {
          return stringValue
        }

        return `${stringName}:${stringValue}`
      })
      .join(' ')
  }

  protected saveState (): void {
    if (this.isEmpty) {
      this.storage.removeItem(`input-${this.id}`)
    } else {
      this.storage.setItem(`input-${this.id}`, this.fieldElement.value)
    }
  }

  protected setError (value: Struct): void {
    Object.assign(this.errorElement, value)
    this.errorElement?.removeAttribute('hidden')
  }

  protected setUpElementListeners (): void {
    this.addEventListener('click', this.handleClickBound)
    this.addEventListener('scola-input-clear', this.handleClearBound)

    if (this.listen.includes('input')) {
      this.fieldElement.addEventListener('input', debounce(this.debounce, this.handleInputBound))
    }

    if (this.listen.includes('keydown')) {
      this.addEventListener('keydown', this.handleKeydownBound)
    }

    super.setUpElementListeners()
  }

  protected setValueFromPrimitive (primitive: Primitive): void {
    this.value = primitive.toString()
  }

  protected setValueFromStruct (struct: Struct): void {
    if (isPrimitive(struct.value)) {
      this.setValueFromPrimitive(struct.value)
    }
  }
}
