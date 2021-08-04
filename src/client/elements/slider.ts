import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FormatElement } from './format'
import { InputElement } from './input'
import styles from '../styles/slider'

declare global {
  interface HTMLElementEventMap {
    'scola-slider-max': CustomEvent
    'scola-slider-min': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-slider': SliderElement
  }

  interface WindowEventMap {
    'scola-slider-max': CustomEvent
    'scola-slider-min': CustomEvent
  }
}

// https://css-tricks.com/sliding-nightmare-understanding-range-input/
@customElement('scola-slider')
export class SliderElement extends InputElement {
  public static styles: CSSResultGroup[] = [
    ...InputElement.styles,
    styles
  ]

  @property({
    attribute: 'fill-progress',
    reflect: true
  })
  public fillProgress?: 'sig-1' | 'sig-2'

  protected handleMaxBound: (event: CustomEvent) => void

  protected handleMinBound: (event: CustomEvent) => void

  protected updaters = SliderElement.updaters

  protected valueElement: FormatElement | null

  public constructor () {
    super()
    this.dir = document.dir
    this.handleMaxBound = this.handleMax.bind(this)
    this.handleMinBound = this.handleMin.bind(this)
    this.valueElement = this.querySelector<FormatElement>('[is="value"]')
  }

  public appendValueTo (data: FormData | URLSearchParams): void {
    this.clearError()

    if (this.isSuccessful(this.inputElement)) {
      data.append(this.inputElement.name, this.inputElement.value)
    }
  }

  public connectedCallback (): void {
    window.addEventListener('scola-slider-max', this.handleMaxBound)
    window.addEventListener('scola-slider-min', this.handleMinBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    window.removeEventListener('scola-slider-max', this.handleMaxBound)
    window.removeEventListener('scola-slider-min', this.handleMinBound)
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.addEventListener('scola-slider-max', this.handleMaxBound)
    this.addEventListener('scola-slider-min', this.handleMinBound)
    this.inputElement.addEventListener('input', this.handleSlide.bind(this))
    this.inputElement.style.setProperty('--max', this.inputElement.max)
    this.inputElement.style.setProperty('--min', this.inputElement.min)
    this.setValueStyle()
    this.setValueText()
    super.firstUpdated(properties)
  }

  public async setMax (): Promise<void> {
    const {
      name,
      max = '',
      value = ''
    } = this.inputElement

    const from = parseFloat(value)
    const to = parseFloat(max)

    if (
      !Number.isNaN(from) &&
      !Number.isNaN(to)
    ) {
      await this.ease(from, to, (newValue) => {
        this.data = {
          [name]: newValue
        }
      })
    }
  }

  public async setMin (): Promise<void> {
    const {
      name,
      min = '',
      value = ''
    } = this.inputElement

    const from = parseFloat(value)
    const to = parseFloat(min)

    if (
      !Number.isNaN(from) &&
      !Number.isNaN(to)
    ) {
      await this.ease(from, to, (newValue) => {
        this.data = {
          [name]: newValue
        }
      })
    }
  }

  public update (properties: PropertyValues): void {
    super.update(properties)
    this.setValueStyle()
    this.setValueText()
  }

  protected handleInput (): void {
    super.handleInput()
    this.setValueStyle()
    this.setValueText()
  }

  protected handleMax (event: CustomEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.setMax().catch(() => {})
    }
  }

  protected handleMin (event: CustomEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.setMin().catch(() => {})
    }
  }

  protected handleSlide (): void {
    this.setValueStyle()
  }

  protected setValueStyle (): void {
    this.inputElement.style.setProperty('--val', this.inputElement.value)
  }

  protected setValueText (): void {
    if (this.valueElement instanceof FormatElement) {
      this.valueElement.data = {
        value: this.inputElement.value
      }
    }
  }
}
