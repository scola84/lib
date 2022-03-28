import { Mutator, Observer, Propagator, Theme } from '../helpers'
import type { ScolaError, Struct } from '../../common'
import type { ScolaElement } from './element'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Drawer = (data: any, options: Struct) => Promise<SVGElement | undefined> | SVGElement | undefined

interface Dimensions {
  height: number
  width: number
}

interface Drawers {
  [key: string]: Drawer | undefined
}

export class ScolaDrawerElement extends HTMLDivElement implements ScolaElement {
  public static drawers: Drawers = {}

  public static origin = window.location.origin

  public data: unknown

  public drawer?: Drawer

  public iframe?: HTMLIFrameElement

  public mutator: Mutator

  public name: string

  public observer: Observer

  public origin = ScolaDrawerElement.origin

  public propagator: Propagator

  public resizer: ResizeObserver

  public scale: number

  public url: string

  protected handleErrorBound = this.handleError.bind(this)

  protected handleLoadBound = this.handleLoad.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleResizerBound = this.handleResizer.bind(this)

  protected handleThemeBound = this.handleTheme.bind(this)

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
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
      .forEach(([name, drawer]) => {
        ScolaDrawerElement.drawers[name] = drawer
      })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound)
    this.resizer.observe(this)
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
    this.load()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.resizer.disconnect()
    this.removeEventListeners()
  }

  public getData (): Struct {
    return {}
  }

  public postMessage (data: unknown): void {
    if (this.drawer === undefined) {
      this.postIframe(data)
    } else {
      this.postSvg(data)
    }
  }

  public reset (): void {
    this.name = this.getAttribute('sc-name') ?? ''
    this.scale = Number(this.getAttribute('sc-scale') ?? 0)
    this.url = this.getAttribute('sc-url') ?? ''
  }

  public setData (data: unknown): void {
    this.data = data
    this.update()
  }

  public toObject (): Struct {
    return {}
  }

  public update (): void {
    this.postMessage(this.data)
    this.updateAttributes()
    this.propagator.dispatch('update')
  }

  public updateAttributes (): void {
    this.setAttribute('sc-updated', Date.now().toString())
  }

  protected addEventListeners (): void {
    window.addEventListener('sc-theme', this.handleThemeBound)
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

  protected createDrawer (): Drawer | undefined {
    return ScolaDrawerElement.drawers[this.name]
  }

  protected createIframe (): HTMLIFrameElement {
    const iframe = document.createElement('iframe')

    iframe.src = `${this.origin}${this.url}${this.name}`
    iframe.setAttribute('referrerpolicy', 'no-referrer')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.onerror = this.handleErrorBound
    iframe.onload = this.handleLoadBound
    return iframe
  }

  protected createOptions (dimensions: Dimensions): Struct {
    return {
      theme: Theme.theme,
      ...dimensions,
      ...this.dataset
    }
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatch<ScolaError>('error', [{
      code: 'err_drawer',
      message: this.propagator.extractMessage(error)
    }])
  }

  protected handleLoad (): void {
    this.update()
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

  protected load (): void {
    if (ScolaDrawerElement.drawers[this.name] === undefined) {
      this.iframe = this.createIframe()
      this.appendChild(this.iframe)
    } else {
      this.drawer = this.createDrawer()
    }
  }

  protected postIframe (data: unknown): void {
    const dimensions = this.calculateDimensions()
    const options = this.createOptions(dimensions)

    this.iframe?.style.setProperty('height', `${dimensions.height}px`)
    this.iframe?.style.setProperty('width', `${dimensions.width}px`)

    this.iframe?.contentWindow?.postMessage({
      data,
      options
    }, '*')
  }

  protected postSvg (data: unknown): void {
    const dimensions = this.calculateDimensions()
    const options = this.createOptions(dimensions)

    Promise
      .resolve()
      .then(() => {
        return this.drawer?.(data, options)
      })
      .then((svg) => {
        if (svg !== undefined) {
          this.innerHTML = ''
          this.appendChild(svg)
        }
      })
      .catch((error) => {
        this.handleError(error)
      })
  }

  protected removeEventListeners (): void {
    window.removeEventListener('sc-theme', this.handleThemeBound)
  }
}
