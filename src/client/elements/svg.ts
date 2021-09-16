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
  [key: string]: ((source: SvgElement) => void) | undefined
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

  protected handleDrawBound = this.handleDraw.bind(this)

  protected handleResizeBound = this.handleResize.bind(this)

  protected resizeObserver?: ResizeObserver

  protected updaters = SvgElement.updaters

  public constructor () {
    super()

    const svgElement = this.querySelector<SVGElement>(':scope > svg')

    if (svgElement === null) {
      throw new Error('SVG element is null')
    }

    this.svgElement = svgElement
  }

  public connectedCallback (): void {
    this.setUpResize()
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    this.tearDownResize()
    super.disconnectedCallback()
  }

  public draw (): void {
    this.drawer
      ?.split(' ')
      .forEach((drawerName) => {
        this.drawers[drawerName]?.(this)
      })
  }

  public update (properties: PropertyValues): void {
    this.setViewBox()
    this.draw()
    super.update(properties)
  }

  protected handleDraw (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.draw()
    }
  }

  protected handleResize (): void {
    this.setViewBox()
    this.draw()
  }

  protected setUpElementListeners (): void {
    this.addEventListener('scola-svg-draw', this.handleDrawBound)
    super.setUpElementListeners()
  }

  protected setUpResize (): void {
    this.resizeObserver = new ResizeObserver(this.handleResizeBound)
    this.resizeObserver.observe(this)
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-svg-draw', this.handleDrawBound)
    super.setUpWindowListeners()
  }

  protected setViewBox (): void {
    let {
      width,
      height
    } = this.getBoundingClientRect()

    if (this.scale !== undefined) {
      height = width * this.scale
    }

    this.svgElement.setAttribute('viewBox', `0,0,${width},${height}`)
  }

  protected tearDownResize (): void {
    this.resizeObserver?.disconnect()
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-svg-draw', this.handleDrawBound)
    super.tearDownWindowListeners()
  }
}
