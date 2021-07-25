import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'

declare global {
  interface HTMLElementTagNameMap {
    'scola-svg': SvgElement
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

  public svgElement?: SVGElement | null

  protected drawers = SvgElement.drawers

  protected observer: ResizeObserver

  public constructor () {
    super()
    this.svgElement = this.querySelector<SVGElement>('svg')
  }

  public connectedCallback (): void {
    this.observer = new ResizeObserver(this.handleResize.bind(this))
    this.observer.observe(this)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    this.observer.disconnect()
  }

  public draw (): void {
    this.drawer?.split(' ').forEach((drawerName) => {
      this.drawers[drawerName](this)
    })
  }

  public resize (): void {
    const {
      width,
      height
    } = this.getBoundingClientRect()

    if (this.svgElement instanceof SVGElement) {
      this.svgElement.setAttribute('viewBox', `0,0,${width},${height}`)
    }
  }

  public updated (properties: PropertyValues): void {
    this.draw()
    super.updated(properties)
  }

  protected handleResize (): void {
    this.resize()
    this.draw()
  }
}
