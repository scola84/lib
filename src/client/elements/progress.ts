import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import type { RequestElement } from './request'
import styles from '../styles/progress'
import updaters from '../updaters/progress'

declare global {
  interface HTMLElementTagNameMap {
    'scola-progress': ProgressElement
  }
}

// https://css-tricks.com/building-progress-ring-quickly/
@customElement('scola-progress')
export class ProgressElement extends NodeElement {
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
  public fraction = 1 / 50

  @property({
    type: Number
  })
  public loaded?: number

  @property()
  public method?: RequestElement['method']

  @property({
    reflect: true
  })
  public mode: 'determinate' | 'indeterminate' = 'indeterminate'

  @property({
    reflect: true
  })
  public size?: 'large' | 'medium' | 'small'

  @property({
    reflect: true,
    type: Boolean
  })
  public started = false

  @property({
    reflect: true
  })
  public stroke?: 'large' | 'medium' | 'min' | 'small'

  @property({
    type: Number
  })
  public total?: number

  @property({
    reflect: true
  })
  public type?: 'circle' | 'rect'

  protected from?: number

  protected progressElement: SVGCircleElement | SVGRectElement

  protected radius = 0

  protected updaters = ProgressElement.updaters

  public async extend (): Promise<void> {
    if (this.progressElement instanceof SVGCircleElement) {
      await this.extendCircle()
    } else {
      await this.extendRect()
    }
  }

  public firstUpdated (properties: PropertyValues): void {
    if (this.type === 'circle') {
      this.setUpCircle()
    } else {
      this.setUpRect()
    }

    super.firstUpdated(properties)
  }

  public update (properties: PropertyValues): void {
    if (properties.has('loaded')) {
      this.handleLoaded()
    }

    super.update(properties)
  }

  protected async extendCircle (): Promise<void> {
    let { fraction } = this

    if (
      this.loaded !== undefined &&
      this.total !== undefined &&
      this.loaded > 0 &&
      this.total > 0
    ) {
      fraction = this.loaded / this.total
    }

    const cf = this.radius * 2 * Math.PI
    const to = cf - (fraction * cf)
    const { from = cf } = this

    this.from = to

    await this
      .ease(from, to, (value) => {
        this.progressElement.setAttribute('stroke-dashoffset', `${value}px`)
      })
      .finally(() => {
        if (
          to === 0 ||
          to === cf
        ) {
          this.progressElement.setAttribute('stroke-dashoffset', `${cf}px`)
          this.from = cf
          this.started = false
        }
      })
  }

  protected async extendRect (): Promise<void> {
    let { fraction } = this

    if (
      this.loaded !== undefined &&
      this.total !== undefined &&
      this.loaded > 0 &&
      this.total > 0
    ) {
      fraction = this.loaded / this.total
    }

    const to = fraction * 100
    const { from = 0 } = this

    this.from = to

    await this
      .ease(from, to, (value) => {
        this.progressElement.setAttribute('width', `${value}%`)
      })
      .finally(() => {
        if (
          to === 0 ||
          to === 100
        ) {
          this.progressElement.setAttribute('width', '0%')
          this.from = 0
          this.started = false
        }
      })
  }

  protected handleLoaded (): void {
    if (this.mode === 'indeterminate') {
      this.started = (
        this.total === 0 ||
        this.loaded !== this.total
      )
    } else {
      this.started = true
      this.extend().catch(() => {})
    }
  }

  protected setUpCircle (): void {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')

    svg.appendChild(circle)
    circle.setAttribute('cx', '50%')
    circle.setAttribute('cy', '50%')

    if (circle instanceof SVGCircleElement) {
      this.bodySlotElement.insertBefore(svg, this.suffixSlotElement)
      this.progressElement = circle
    }

    const strokeWidth = parseFloat(window.getComputedStyle(this.progressElement).strokeWidth)
    const width = parseFloat(window.getComputedStyle(this.bodySlotElement).width)

    if (
      Number.isFinite(strokeWidth) &&
      Number.isFinite(width)
    ) {
      this.radius = (width - strokeWidth) / 2
    }

    const cf = this.radius * 2 * Math.PI

    this.progressElement.setAttribute('r', `${this.radius}`)
    this.progressElement.setAttribute('stroke-dasharray', `${cf}px ${cf}px`)
    this.progressElement.setAttribute('stroke-dashoffset', `${cf}px`)
  }

  protected setUpRect (): void {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')

    svg.appendChild(rect)
    rect.setAttribute('height', '100%')

    if (rect instanceof SVGRectElement) {
      this.bodySlotElement.insertBefore(svg, this.suffixSlotElement)
      this.progressElement = rect
    }
  }
}
