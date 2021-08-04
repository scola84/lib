import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'

declare global {
  interface HTMLElementEventMap {
    'scola-svg-draw': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-svg': SvgElement
  }

  interface WindowEventMap {
    'scola-svg-draw': CustomEvent
  }
}

export interface Drawers {
  [key: string]: (source: SvgElement) => void
}

@customElement('scola-svg')
export class SvgElement extends NodeElement {
  public static drawers: Drawers = {}

  @property()
  public drawer?: string

  @property({
    type: Number
  })
  public scale?: number

  public svgElement: SVGElement

  protected drawers = SvgElement.drawers

  protected handleDrawBound: (event: CustomEvent) => void

  protected observer: ResizeObserver

  public constructor () {
    super()

    const svgElement = this.querySelector<SVGElement>('svg')

    if (svgElement === null) {
      throw new Error('Svg element not found')
    }

    this.svgElement = svgElement
    this.handleDrawBound = this.handleDraw.bind(this)
  }

  public connectedCallback (): void {
    this.observer = new ResizeObserver(this.handleResize.bind(this))
    this.observer.observe(this)
    window.addEventListener('scola-svg-draw', this.handleDrawBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    this.observer.disconnect()
    window.removeEventListener('scola-svg-draw', this.handleDrawBound)
    super.disconnectedCallback()
  }

  public draw (): void {
    this.drawer
      ?.split(' ')
      .forEach((drawerName) => {
        this.drawers[drawerName](this)
      })
  }

  public firstUpdated (properties: PropertyValues): void {
    this.addEventListener('scola-svg-draw', this.handleDrawBound)
    super.firstUpdated(properties)
  }

  public resize (): void {
    let {
      width,
      height
    } = this.getBoundingClientRect()

    if (this.scale !== undefined) {
      height = width * this.scale
    }

    this.svgElement.setAttribute('viewBox', `0,0,${width},${height}`)
  }

  public update (properties: PropertyValues): void {
    this.resize()
    this.draw()
    super.update(properties)
  }

  protected handleDraw (event: CustomEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.draw()
    }
  }

  protected handleResize (): void {
    this.resize()
    this.draw()
  }
}
