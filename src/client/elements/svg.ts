import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'
import type d3 from 'd3'

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

type Drawer = (source: SvgElement) => void

export interface Drawers {
  [key: string]: Drawer | undefined
}

@customElement('scola-svg')
export class SvgElement extends NodeElement {
  public static base = ''

  public static d3?: Partial<typeof d3>

  public static drawers: Drawers = {}

  public static origin = window.location.origin

  @property()
  public base = SvgElement.base

  @property()
  public drawer?: string

  @property()
  public origin = SvgElement.origin

  @property({
    type: Number
  })
  public scale?: number

  @property()
  public url?: Request['url']

  public d3 = SvgElement.d3

  public svgElement: SVGElement

  protected drawers = SvgElement.drawers

  protected handleDrawBound = this.handleDraw.bind(this)

  protected handleResizeBound = this.handleResize.bind(this)

  protected resizeObserver?: ResizeObserver

  protected scriptElement?: HTMLScriptElement

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

  public update (properties: PropertyValues): void {
    this.draw().catch(() => {})
    super.update(properties)
  }

  protected async draw (): Promise<void> {
    try {
      this.setViewBox()

      if (this.drawer !== undefined) {
        const drawer = await this.getDrawer(this.drawer)

        if (typeof drawer === 'function') {
          drawer(this)
        }
      }
    } catch (error: unknown) {
      this.handleError(error)
    }
  }

  protected async fetchDrawer (drawer: string): Promise<Drawer | undefined> {
    return new Promise((resolve) => {
      const urlParts = [
        this.origin,
        this.base,
        this.url
      ]

      const parameters = {
        name: drawer
      }

      const src = new URL(this.replaceParameters(urlParts.join(''), parameters)).toString()

      if (this.scriptElement?.src === src) {
        resolve((window as unknown as Struct)[drawer] as Drawer)
        return
      }

      this.scriptElement?.remove()

      const scriptElement = document.createElement('script')

      scriptElement.onload = () => {
        resolve((window as unknown as Struct)[drawer] as Drawer)
        scriptElement.onload = null
      }

      this.scriptElement = scriptElement
      this.scriptElement.src = src
      document.head.appendChild(this.scriptElement)
    })
  }

  protected async getDrawer (drawer: string): Promise<Drawer | undefined> {
    if (this.drawers[drawer] !== undefined) {
      return this.drawers[drawer]
    } else if (this.url !== undefined) {
      return this.fetchDrawer(drawer)
    }

    return undefined
  }

  protected handleDraw (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.draw().catch(() => {})
    }
  }

  protected handleError (error: unknown): void {
    this.dispatchError(error, 'err_svg')
  }

  protected handleResize (): void {
    this.setViewBox()
    this.draw().catch(() => {})
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
