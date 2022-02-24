import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import { ScolaTheme } from '../helpers/theme'
import type { Struct } from '../../common'
import { isSame } from '../../common'

type Drawer = (data: unknown, options: Struct) => SVGElement

interface Dimensions {
  height: number
  width: number
}

interface Drawers {
  [key: string]: Drawer | undefined
}

export class ScolaDrawerElement extends HTMLDivElement implements ScolaElement {
  public static drawers: Drawers = {}

  public data: unknown

  public drawer?: Drawer

  public iframe?: HTMLIFrameElement

  public mutator: ScolaMutator

  public name: string

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public resizer: ResizeObserver

  public scale: number

  public src: string

  public svg?: SVGElement

  protected handleErrorBound = this.handleError.bind(this)

  protected handleLoadBound = this.handleLoad.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleResizerBound = this.handleResizer.bind(this)

  protected handleThemeBound = this.handleTheme.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.resizer = new ResizeObserver(this.handleResizerBound)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-drawer', ScolaDrawerElement, {
      extends: 'div'
    })
  }

  public static defineDrawers (drawers: Struct<Drawer>): void {
    Object
      .entries(drawers)
      .forEach(([name, handler]) => {
        ScolaDrawerElement.drawers[name] = handler
      })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound)
    this.resizer.observe(this)
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.resizer.disconnect()
    this.removeEventListeners()
  }

  public getData (): unknown {
    return this.data
  }

  public isSame (data: unknown): boolean {
    return isSame(data, this.getData())
  }

  public reset (): void {
    this.name = this.getAttribute('sc-name') ?? ''
    this.scale = Number(this.getAttribute('sc-scale') ?? 0)
    this.src = this.getAttribute('sc-src') ?? ''

    if (this.name !== '') {
      this.drawer = ScolaDrawerElement.drawers[this.name]
    }
  }

  public setData (data: unknown): void {
    this.data = data
    this.update()
  }

  public update (): void {
    this.updateElements()
    this.updateAttributes()
    this.propagator.dispatch('update', [this.getData()])
  }

  public updateAttributes (): void {
    this.setAttribute('sc-updated', Date.now().toString())
  }

  public updateElements (): void {
    const dimensions = this.calculateDimensions()

    if (this.drawer === undefined) {
      this.updateIframe(dimensions)
    } else {
      this.updateSvg(dimensions)
    }
  }

  protected addEventListeners (): void {
    window.addEventListener('sc-theme', this.handleThemeBound)
  }

  protected appendIframe (): void {
    this.iframe = document.createElement('iframe')
    this.iframe.src = `${this.src}${this.name}`
    this.iframe.setAttribute('referrerpolicy', 'no-referrer')
    this.iframe.setAttribute('sandbox', 'allow-scripts')
    this.iframe.onerror = this.handleErrorBound
    this.iframe.onload = this.handleLoadBound
    this.appendChild(this.iframe)
  }

  protected calculateDimensions (): Dimensions {
    let {
      offsetHeight: height,
      offsetWidth: width
    } = this

    if (this.scale > 0) {
      height = width * this.scale
    }

    return {
      height,
      width
    }
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatch('error', [{
      code: 'err_drawer',
      message: this.propagator.extractMessage(error)
    }])
  }

  protected handleLoad (): void {
    this.updateIframe(this.calculateDimensions())
  }

  protected handleObserver (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalize(mutations)

    if (!attributes.includes('sc-updated')) {
      this.update()
    }
  }

  protected handleResizer (): void {
    this.update()
  }

  protected handleTheme (): void {
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
    try {
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
    } catch (error: unknown) {
      this.handleError(error)
    }
  }

  protected removeEventListeners (): void {
    window.removeEventListener('sc-theme', this.handleThemeBound)
  }

  protected removeIframe (): void {
    if (this.iframe !== undefined) {
      this.iframe.onerror = null
      this.iframe.onload = null
      this.iframe.remove()
      this.iframe = undefined
    }
  }

  protected removeSvg (): void {
    this.svg?.remove()
    this.svg = undefined
  }

  protected updateIframe (dimensions: Dimensions): void {
    if (this.iframe === undefined) {
      this.removeSvg()
      this.appendIframe()
    }

    this.iframe?.style.setProperty('height', `${dimensions.height}px`)
    this.iframe?.style.setProperty('width', `${dimensions.width}px`)
    this.postIframe(dimensions)
  }

  protected updateSvg (dimensions: Dimensions): void {
    if (this.svg === undefined) {
      this.removeIframe()
    }

    this.postSvg(dimensions)
  }
}
