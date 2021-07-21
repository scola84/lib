import type { CSSResultGroup, PropertyValues, TemplateResult } from 'lit'
import { css, html, svg } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { RequestElement } from './request'

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
    css`
      :host {
        align-items: center;
        justify-content: center;
      }

      :host(:not([started])) {
        display: none;
      }

      :host([type="circle"][size="large"]) slot[name="body"] {
        height: 2rem;
        width: 2rem;
      }

      :host([type="circle"][size="medium"]) slot[name="body"] {
        height: 1.5rem;
        width: 1.5rem;
      }

      :host([type="circle"][size="small"]) slot[name="body"] {
        height: 1rem;
        width: 1rem;
      }

      :host([type="rect"][stroke="large"]) slot[name="body"] {
        height: 0.5rem;
      }

      :host([type="rect"][stroke="medium"]) slot[name="body"] {
        height: 0.25rem;
      }

      :host([type="rect"][stroke="min"]) slot[name="body"] {
        height: 1px;
      }

      :host([type="rect"][stroke="small"]) slot[name="body"] {
        height: 0.125rem;
      }

      :host([fill]) slot[name="body"] {
        background: none;
      }

      :host([type="rect"]) svg {
        display: flex;
        flex: 1;
      }

      circle {
        fill: transparent;
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
      }

      :host([started][mode="indeterminate"]) circle {
        animation: spin 1s infinite ease-in-out;
        stroke-dashoffset: 1rem !important;
      }

      :host([started][mode="indeterminate"]) rect {
        animation: flow 1s infinite ease-in-out;
        width: 33% !important;
      }

      :host([type="circle"][stroke="large"]) circle {
        stroke-width: 0.5rem;
      }

      :host([type="circle"][stroke="medium"]) circle {
        stroke-width: 0.25rem;
      }

      :host([type="circle"][stroke="min"]) circle {
        stroke-width: 1px;
      }

      :host([type="circle"][stroke="small"]) circle {
        stroke-width: 0.125rem;
      }

      :host([fill="aux-1"][type="circle"]) circle {
        stroke: var(--scola-node-fill-aux-1, #fff);
      }

      :host([fill="aux-2"][type="circle"]) circle {
        stroke: var(--scola-node-fill-aux-2, #eee);
      }

      :host([fill="aux-3"][type="circle"]) circle {
        stroke: var(--scola-node-fill-aux-3, #ddd);
      }

      :host([fill="aux-4"][type="circle"]) circle {
        stroke: var(--scola-node-fill-aux-4, rgba(255, 255, 255, 0.25));
      }

      :host([fill="sig-1"][type="circle"]) circle {
        stroke: var(--scola-node-fill-sig-1, #b22222);
      }

      :host([fill="sig-2"][type="circle"]) circle {
        stroke: var(--scola-node-fill-sig-2, #008000);
      }

      :host([fill="aux-1"][type="rect"]) rect {
        fill: var(--scola-node-fill-aux-1, #fff);
      }

      :host([fill="aux-2"][type="rect"]) rect {
        fill: var(--scola-node-fill-aux-2, #eee);
      }

      :host([fill="aux-3"][type="rect"]) rect {
        fill: var(--scola-node-fill-aux-3, #ddd);
      }

      :host([fill="aux-4"][type="rect"]) rect {
        fill: var(--scola-node-fill-aux-4, rgba(255, 255, 255, 0.25));
      }

      :host([fill="sig-1"][type="rect"]) rect {
        fill: var(--scola-node-fill-sig-1, #b22222);
      }

      :host([fill="sig-2"][type="rect"]) rect {
        fill: var(--scola-node-fill-sig-2, #008000);
      }

      @keyframes flow {
        0% {
          transform: translateX(-33%);
        }

        100% {
          transform: translateX(100%);
        }
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }

        100% {
          transform: rotate(360deg);
        }
      }
    `
  ]

  public static updaters = {
    ...NodeElement.updaters,
    request: (source: ProgressElement, target: RequestElement, properties: PropertyValues): void => {
      if (
        properties.has('loaded') ||
        properties.has('total')
      ) {
        source.updateRequest(target).catch(() => {})
      }
    }
  }

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
  public started?: boolean

  @property({
    reflect: true
  })
  public stroke?: 'large' | 'medium' | 'min' | 'small'

  @property({
    reflect: true
  })
  public type?: 'circle' | 'rect'

  @query('circle', true)
  protected circleElement?: SVGCircleElement

  @query('rect', true)
  protected rectElement?: SVGRectElement

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
        this.started = element.started
      } else {
        this.started = true

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
    if (element.total === 0) {
      return
    }

    const cf = this.radius * 2 * Math.PI
    const to = cf - element.loaded / element.total * cf

    let { from = cf } = this

    if (from < to) {
      from = to
    }

    this.from = to

    await this
      .ease(from, to, (value) => {
        this.circleElement?.setAttribute('stroke-dashoffset', `${value}px`)
      })
      .then(() => {
        if (element.loaded === element.total) {
          this.circleElement?.setAttribute('stroke-dashoffset', `${cf}px`)
          this.from = cf
          this.started = false
        }
      })
  }

  protected async updateRequestRect (element: RequestElement): Promise<void> {
    if (element.total === 0) {
      return
    }

    const to = Math.round(element.loaded / element.total * 100)

    let { from = 0 } = this

    if (from > to) {
      from = to
    }

    this.from = to

    await this
      .ease(from, to, (value) => {
        this.rectElement?.setAttribute('width', `${value}%`)
      })
      .then(() => {
        if (element.loaded === element.total) {
          this.rectElement?.setAttribute('width', '0%')
          this.from = 0
          this.started = false
        }
      })
  }
}
