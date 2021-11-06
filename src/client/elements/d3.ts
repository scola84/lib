import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import { ScolaTheme } from '../helpers/theme'
import type { Struct } from '../../common'

type Drawer = (data: unknown, options: Struct) => SVGElement

interface Dimensions {
  height: number
  width: number
}

interface Drawers {
  [key: string]: Drawer | undefined
}

export class ScolaD3Element extends HTMLDivElement implements ScolaElement {
  public static drawers: Drawers = {}

  public data: unknown

  public drawer?: Drawer

  public iframe?: HTMLIFrameElement

  public mutator: ScolaMutator

  public name: string

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public scale: number

  public svg?: SVGElement

  protected handleMutationsBound = this.handleMutations.bind(this)

  protected handleResizeBound = this.handleResize.bind(this)

  protected handleThemeBound = this.handleTheme.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-d3', ScolaD3Element, {
      extends: 'div'
    })
  }

  public static defineDrawers (drawers: Struct<Drawer>): void {
    Object
      .entries(drawers)
      .forEach(([name, handler]) => {
        ScolaD3Element.drawers[name] = handler
      })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect(this.handleMutationsBound)
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public getData (): unknown {
    return this.data
  }

  public reset (): void {
    this.name = this.getAttribute('sc-name') ?? ''
    this.scale = Number(this.getAttribute('sc-scale') ?? -1)

    if (this.name !== '') {
      this.drawer = ScolaD3Element.drawers[this.name]
    }
  }

  public setData (data: unknown): void {
    this.data = data
    this.update()
  }

  public update (): void {
    const dimensions = this.calculateDimensions()

    if (this.drawer === undefined) {
      this.updateIframe(dimensions)
    } else {
      this.updateSvg(dimensions)
    }
  }

  protected addEventListeners (): void {
    window.addEventListener('resize', this.handleResizeBound)
    window.addEventListener('sc-theme', this.handleThemeBound)
  }

  protected appendIframe (): void {
    this.iframe = document.createElement('iframe')
    this.iframe.src = `/api/svg/${this.name}`
    this.iframe.setAttribute('referrerpolicy', 'no-referrer')
    this.iframe.setAttribute('sandbox', 'allow-scripts')
    this.iframe.onload = this.handleLoad.bind(this)
    this.appendChild(this.iframe)
  }

  protected calculateDimensions (): Dimensions {
    let {
      offsetHeight: height,
      offsetWidth: width
    } = this

    if (this.scale !== -1) {
      height = width * this.scale
    }

    return {
      height,
      width
    }
  }

  protected handleLoad (): void {
    this.updateIframe(this.calculateDimensions())
  }

  protected handleMutations (): void {
    this.update()
  }

  protected handleResize (): void {
    this.reset()
    this.update()
  }

  protected handleTheme (): void {
    this.reset()
    this.update()
  }

  protected postIframe (dimensions: Dimensions): void {
    if (this.iframe !== undefined) {
      this.iframe.contentWindow?.postMessage({
        data: this.data,
        options: {
          theme: ScolaTheme.theme,
          ...dimensions,
          ...this.dataset
        }
      }, '*')
    }
  }

  protected postSvg (dimensions: Dimensions): void {
    const { svg } = this

    this.svg = this.drawer?.(this.data, {
      theme: ScolaTheme.theme,
      ...dimensions,
      ...this.dataset
    })

    if (this.svg !== undefined) {
      if (svg === undefined) {
        this.appendChild(this.svg)
      } else {
        this.replaceChild(this.svg, svg)
      }
    }
  }

  protected removeEventListeners (): void {
    window.removeEventListener('resize', this.handleResizeBound)
    window.removeEventListener('sc-theme', this.handleThemeBound)
  }

  protected updateIframe (dimensions: Dimensions): void {
    if (this.iframe === undefined) {
      this.svg?.remove()
      this.appendIframe()
    }

    this.iframe?.style.setProperty('height', `${dimensions.height}px`)
    this.iframe?.style.setProperty('width', `${dimensions.width}px`)
    this.postIframe(dimensions)
  }

  protected updateSvg (dimensions: Dimensions): void {
    if (this.svg === undefined) {
      this.iframe?.remove()
    }

    this.postSvg(dimensions)
  }
}
