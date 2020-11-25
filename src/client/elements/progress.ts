import type {
  CSSResult,
  PropertyValues,
  TemplateResult
} from 'lit-element'

import {
  css,
  customElement,
  html,
  property,
  query,
  svg
} from 'lit-element'

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
  public static styles: CSSResult[] = [
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

      :host([started][mode="indeterminate"]) circle,
      :host([started][mode="mixed"][indeterminate]) circle {
        animation: spin 1s infinite ease-in-out;
        stroke-dashoffset: 1rem !important;
      }

      :host([started][mode="indeterminate"]) rect,
      :host([started][mode="mixed"][indeterminate]) rect {
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

  @property({
    type: Number
  })
  public duration?: number

  @property({
    reflect: true,
    type: Boolean
  })
  public indeterminate?: boolean

  @property()
  public method: RequestElement['method'] = 'GET'

  @property({
    reflect: true
  })
  public mode?: 'determinate' | 'indeterminate' | 'mixed'

  @property({
    reflect: true
  })
  public position?: 'bottom' | 'center' | 'top'

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
  protected rectangleElement?: SVGRectElement

  protected from?: number

  protected radius = 0

  public firstUpdated (properties: PropertyValues): void {
    if (this.type === 'circle') {
      this.firstUpdatedCircle()
    }

    super.firstUpdated(properties)
  }

  public observedUpdated (properties: PropertyValues, target: RequestElement): void {
    if (target.method === this.method) {
      if (properties.has('loaded') || properties.has('total')) {
        this.started = target.started
        this.indeterminate = target.indeterminate

        if (this.indeterminate === false) {
          if (this.type === 'circle') {
            this.observedUpdatedCircle(target)
          } else {
            this.observedUpdatedRect(target)
          }
        }
      }
    }

    super.observedUpdated(properties, target)
  }

  public render (): TemplateResult {
    const shape = this.type === 'circle'
      ? svg`<circle cx="50%" cy="50%"/>`
      : svg`<rect height="100%"/>`

    return html`
      <slot name="body">
        <svg>
          ${shape}
        </svg>
      </slot>
    `
  }

  protected firstUpdatedCircle (): void {
    const { width = '0' } = this.bodySlotElement instanceof HTMLSlotElement
      ? window.getComputedStyle(this.bodySlotElement)
      : {}

    const { strokeWidth = '2' } = this.circleElement instanceof SVGCircleElement
      ? window.getComputedStyle(this.circleElement)
      : {}

    this.radius = (parseFloat(width) - parseFloat(strokeWidth)) / 2
    const cf = this.radius * 2 * Math.PI

    this.circleElement?.setAttribute('r', String(this.radius))
    this.circleElement?.style.setProperty('stroke-dasharray', `${cf}px ${cf}px`)
    this.circleElement?.style.setProperty('stroke-dashoffset', `${cf}px`)
  }

  protected observedUpdatedCircle (element: RequestElement): void {
    const cf = this.radius * 2 * Math.PI
    const to = cf - element.loaded / element.total * cf
    const { from = cf } = this
    this.from = to

    const duration = from <= to
      ? 0
      : this.duration

    this.ease(from, to, ({ done, value }) => {
      this.circleElement?.style.setProperty('stroke-dashoffset', `${value}px`)

      if (done && to === 0) {
        this.circleElement?.style.setProperty('stroke-dashoffset', `${cf}px`)
        this.from = cf
        this.started = element.started
      }
    }, {
      duration,
      name: 'circle'
    })
  }

  protected observedUpdatedRect (element: RequestElement): void {
    const to = Math.round(element.loaded / element.total * 100)
    const { from = 0 } = this
    this.from = to

    const duration = from >= to
      ? 0
      : this.duration

    this.ease(from, to, ({ done, value }) => {
      this.rectangleElement?.setAttribute('width', `${value}%`)

      if (done && to === 100) {
        this.rectangleElement?.setAttribute('width', '0%')
        this.from = 0
        this.started = element.started
      }
    }, {
      duration,
      name: 'rect'
    })
  }
}
