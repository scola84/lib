import type { CSSResultGroup, PropertyValues, TemplateResult } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { html, svg } from 'lit'
import { NodeElement } from './node'
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
  public static styles: CSSResultGroup[] = [
    ...NodeElement.styles,
    styles
  ]

  public static updaters = {
    ...NodeElement.updaters,
    ...updaters
  }

  @property({
    reflect: true,
    type: Boolean
  })
  public busy?: boolean

  @property({
    type: Number
  })
  public fraction = 1 / 50

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
    reflect: true
  })
  public stroke?: 'large' | 'medium' | 'min' | 'small'

  @property({
    reflect: true
  })
  public type?: 'circle' | 'rect'

  @query('circle', true)
  protected circleElement: SVGCircleElement | null

  @query('rect', true)
  protected rectElement: SVGRectElement | null

  protected from?: number

  protected radius = 0

  protected updaters = ProgressElement.updaters

  public firstUpdated (properties: PropertyValues): void {
    if (this.type === 'circle') {
      this.firstUpdatedCircle()
    }

    super.firstUpdated(properties)
  }

  public render (): TemplateResult {
    let shape = svg``

    if (this.type === 'circle') {
      shape = svg`<circle cx="50%" cy="50%"/>`
    } else {
      shape = svg`<rect height="100%"/>`
    }

    return html`
      <slot name="body">
        <svg>
          ${shape}
        </svg>
      </slot>
    `
  }

  public async updateRequest (element: RequestElement): Promise<void> {
    if (
      this.method === undefined ||
      this.method === element.request?.method
    ) {
      if (this.mode === 'indeterminate') {
        this.busy = element.busy
      } else {
        this.busy = true

        if (this.type === 'circle') {
          await this.updateRequestCircle(element)
        } else {
          await this.updateRequestRect(element)
        }
      }
    }
  }

  protected firstUpdatedCircle (): void {
    if (this.circleElement instanceof SVGCircleElement) {
      const strokeWidth = parseFloat(window.getComputedStyle(this.circleElement).strokeWidth)
      const width = parseFloat(window.getComputedStyle(this.bodySlotElement).width)

      if (
        Number.isFinite(strokeWidth) &&
        Number.isFinite(width)
      ) {
        this.radius = (width - strokeWidth) / 2
      }

      const cf = this.radius * 2 * Math.PI

      this.circleElement.setAttribute('r', `${this.radius}`)
      this.circleElement.setAttribute('stroke-dasharray', `${cf}px ${cf}px`)
      this.circleElement.setAttribute('stroke-dashoffset', `${cf}px`)
    }
  }

  protected async updateRequestCircle (element: RequestElement): Promise<void> {
    let { fraction } = this

    if (
      element.loaded > 0 &&
      element.total > 0
    ) {
      fraction = element.loaded / element.total
    } else if (element.busy === false) {
      fraction = 0
    }

    const cf = this.radius * 2 * Math.PI
    const to = cf - (fraction * cf)
    const { from = cf } = this

    this.from = to

    await this
      .ease(from, to, (value) => {
        this.circleElement?.setAttribute('stroke-dashoffset', `${value}px`)
      })
      .then(() => {
        if (
          to === 0 ||
          to === cf
        ) {
          this.busy = false
          this.from = cf
          this.circleElement?.setAttribute('stroke-dashoffset', `${cf}px`)
        }
      })
  }

  protected async updateRequestRect (element: RequestElement): Promise<void> {
    let { fraction } = this

    if (
      element.loaded > 0 &&
      element.total > 0
    ) {
      fraction = element.loaded / element.total
    } else if (element.busy === false) {
      fraction = 0
    }

    const to = fraction * 100
    const { from = 0 } = this

    this.from = to

    await this
      .ease(from, to, (value) => {
        this.rectElement?.setAttribute('width', `${value}%`)
      })
      .then(() => {
        if (
          to === 0 ||
          to === 100
        ) {
          this.busy = false
          this.from = 0
          this.rectElement?.setAttribute('width', '0%')
        }
      })
  }
}
