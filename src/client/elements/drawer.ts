import { I18n, toString } from '../../common'
import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaError, Struct } from '../../common'
import { ScolaAppElement } from './app'
import type { ScolaElement } from './element'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Drawer = (data: any, options: Struct) => unknown

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

  public datamap: unknown

  public drawer?: Drawer

  public i18n: I18n

  public iframe?: HTMLIFrameElement

  public mutator: Mutator

  public name: string

  public observer: Observer

  public origin = ScolaDrawerElement.origin

  public propagator: Propagator

  public resizer: ResizeObserver

  public scale: number

  public url: string

  public get data (): unknown {
    return this.datamap ?? {
      ...this.dataset
    }
  }

  public set data (data: unknown) {
    this.datamap = data
    this.update()
  }

  protected handleErrorBound = this.handleError.bind(this)

  protected handleLoadBound = this.handleLoad.bind(this)

  protected handleLocaleBound = this.handleLocale.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleResizerBound = this.handleResizer.bind(this)

  protected handleThemeBound = this.handleTheme.bind(this)

  public constructor () {
    super()
    this.i18n = new I18n()
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

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.propagator.dispatchEvents('update')
  }

  public reset (): void {
    this.name = this.getAttribute('sc-name') ?? ''
    this.scale = Number(this.getAttribute('sc-scale') ?? 0)
    this.url = this.getAttribute('sc-url') ?? ''
  }

  public toJSON (): unknown {
    return {
      data: this.data,
      id: this.id,
      is: this.getAttribute('is'),
      name: this.name,
      nodeName: this.nodeName,
      scale: this.scale,
      url: this.url
    }
  }

  public update (): void {
    this.postMessage(this.data)
    this.notify()
  }

  protected addEventListeners (): void {
    window.addEventListener('sc-app-locale', this.handleLocaleBound)
    window.addEventListener('sc-app-theme', this.handleThemeBound)
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

    iframe.setAttribute('referrerpolicy', 'no-referrer')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.onerror = this.handleErrorBound
    iframe.onload = this.handleLoadBound

    iframe.src = this.i18n.formatText(`${this.origin}${this.url}`, {
      name: this.name
    })

    return iframe
  }

  protected createOptions (dimensions: Dimensions): Struct {
    return {
      locale: I18n.locale,
      theme: ScolaAppElement.theme,
      ...dimensions,
      ...this.dataset
    }
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatchEvents<ScolaError>('error', [{
      code: 'err_drawer',
      message: toString(error)
    }])
  }

  protected handleLoad (): void {
    this.update()
  }

  protected handleLocale (): void {
    this.update()
  }

  protected handleObserver (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalizeMutations(mutations)

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

  protected postMessage (data: unknown): void {
    if (this.drawer === undefined) {
      this.postMessageIframe(data)
    } else {
      this.postMessageSvg(data)
    }
  }

  protected postMessageIframe (data: unknown): void {
    const dimensions = this.calculateDimensions()
    const options = this.createOptions(dimensions)

    this.iframe?.style.setProperty('height', `${dimensions.height}px`)
    this.iframe?.style.setProperty('width', `${dimensions.width}px`)

    this.iframe?.contentWindow?.postMessage({
      data,
      options
    }, '*')
  }

  protected postMessageSvg (data: unknown): void {
    const dimensions = this.calculateDimensions()
    const options = this.createOptions(dimensions)

    Promise
      .resolve()
      .then(() => {
        return this.drawer?.(data, options)
      })
      .then((svg) => {
        if (svg instanceof SVGElement) {
          this.innerHTML = ''
          this.appendChild(svg)
        }
      })
      .catch((error) => {
        this.handleError(error)
      })
  }

  protected removeEventListeners (): void {
    window.removeEventListener('sc-app-locale', this.handleLocaleBound)
    window.removeEventListener('sc-app-theme', this.handleThemeBound)
  }
}
