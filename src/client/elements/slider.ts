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
    this.valueElement = this.querySelector<FormatElement>('[as="value"]')
  }

  public appendValueTo (data: FormData | URLSearchParams): void {
    this.clearError()

    if (this.isSuccessful) {
      data.append(this.name, this.fieldElement.value)
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
    this.fieldElement.addEventListener('input', this.handleSlide.bind(this))
    this.setUpValue()
    super.firstUpdated(properties)
  }

  public async setMax (): Promise<void> {
    const {
      name,
      max = '',
      value = ''
    } = this.fieldElement

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
    } = this.fieldElement

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
      this.setMax().catch(() => {})
    }
  }

  protected handleMin (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.setMin().catch(() => {})
    }
  }

  protected handleSlide (): void {
    this.setValueStyle()
  }

  protected setUpValue (): void {
    this.fieldElement.style.setProperty('--max', this.fieldElement.max)
    this.fieldElement.style.setProperty('--min', this.fieldElement.min)
    this.setValueStyle()
    this.setValueText()
  }

  protected setValueStyle (): void {
    this.fieldElement.style.setProperty('--val', this.fieldElement.value)
  }

  protected setValueText (): void {
    if (this.valueElement instanceof FormatElement) {
      this.valueElement.data = {
        value: this.value
      }
    }
  }
}
