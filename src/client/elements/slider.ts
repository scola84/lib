import { customElement, property } from 'lit/decorators.js'
import { FormatElement } from './format'
import { InputElement } from './input'
import type { PropertyValues } from 'lit'
import styles from '../styles/slider'
import updaters from '../updaters/slider'

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

@customElement('scola-slider')
export class SliderElement extends InputElement {
  public static styles = [
    ...InputElement.styles,
    styles
  ]

  public static updaters = {
    ...InputElement.updaters,
    ...updaters
  }

  @property({
    attribute: 'fill-progress',
    reflect: true
  })
  public fillProgress?: 'sig-1' | 'sig-2'

  @property({
    attribute: 'fill-track',
    reflect: true
  })
  public fillTrack?: 'aux-1' | 'aux-2' | 'aux-3'

  protected handleMaxBound = this.handleMax.bind(this)

  protected handleMinBound = this.handleMin.bind(this)

  protected labelElement: FormatElement | null

  protected updaters = SliderElement.updaters

  public constructor () {
    super()
    this.dir = document.dir
    this.labelElement = this.querySelector<FormatElement>('[as="label"]')
  }

  public firstUpdated (properties: PropertyValues): void {
    this.setUpValue()
    super.firstUpdated(properties)
  }

  public setMax (max: number): void {
    this.fieldElement?.setAttribute('max', max.toString())
    this.setStyle()
  }

  public setMin (min: number): void {
    this.fieldElement?.setAttribute('min', min.toString())
    this.setStyle()
  }

  public async setValue (value: number): Promise<void> {
    const from = parseFloat(this.fieldElement?.value ?? '')

    if (!Number.isNaN(from)) {
      await this.ease(from, value, (newValue) => {
        this.data = newValue
      })
    }
  }

  public update (properties: PropertyValues): void {
    super.update(properties)
    this.setLabel()
    this.setStyle()
  }

  protected handleInput (): void {
    super.handleInput()
    this.setLabel()
    this.setStyle()
  }

  protected handleMax (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this
        .setValue(parseFloat(this.fieldElement?.max ?? ''))
        .catch(() => {})
    }
  }

  protected handleMin (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this
        .setValue(parseFloat(this.fieldElement?.min ?? ''))
        .catch(() => {})
    }
  }

  protected setLabel (): void {
    if (this.labelElement instanceof FormatElement) {
      this.labelElement.data = {
        value: this.value
      }
    }
  }

  protected setStyle (): void {
    if (this.fieldElement instanceof HTMLInputElement) {
      this.fieldElement.style.setProperty('--max', this.fieldElement.max)
      this.fieldElement.style.setProperty('--min', this.fieldElement.min)
      this.fieldElement.style.setProperty('--val', this.fieldElement.value)
    }
  }

  protected setUpElementListeners (): void {
    this.addEventListener('scola-slider-max', this.handleMaxBound)
    this.addEventListener('scola-slider-min', this.handleMinBound)
    super.setUpElementListeners()
  }

  protected setUpValue (): void {
    this.setLabel()
    this.setStyle()
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-slider-max', this.handleMaxBound)
    window.addEventListener('scola-slider-min', this.handleMinBound)
    super.setUpWindowListeners()
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-slider-max', this.handleMaxBound)
    window.removeEventListener('scola-slider-min', this.handleMinBound)
    super.tearDownWindowListeners()
  }
}
