import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaError, Struct } from '../../common'
import { I18n } from '../../common'
import type { ScolaElement } from './element'

declare global {
  interface HTMLElementEventMap {
    'sc-work': CustomEvent
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (data: any) => Promise<unknown> | unknown

export class ScolaWorkerElement extends HTMLObjectElement implements ScolaElement {
  public static handlers: Struct<Handler | undefined> = {}

  public static origin = window.location.origin

  public i18n: I18n

  public iframe?: HTMLIFrameElement

  public iframeUrl: string

  public mutator: Mutator

  public name: string

  public observer: Observer

  public origin = ScolaWorkerElement.origin

  public propagator: Propagator

  public url: string

  public worker?: Worker

  public workerUrl?: string

  protected handleErrorBound = this.handleError.bind(this)

  protected handleLoadBound = this.handleLoad.bind(this)

  protected handleMessageBound = this.handleMessage.bind(this)

  protected handleWorkBound = this.handleWork.bind(this)

  public constructor () {
    super()
    this.i18n = new I18n()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-worker', ScolaWorkerElement, {
      extends: 'object'
    })
  }

  public static defineHandlers (handlers: Struct<Handler>): void {
    Object
      .entries(handlers)
      .forEach(([name, handler]) => {
        ScolaWorkerElement.handlers[name] = handler
      })
  }

  public connectedCallback (): void {
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
    this.removeEventListeners()

    if (this.workerUrl !== undefined) {
      this.worker?.terminate()
      URL.revokeObjectURL(this.workerUrl)
    }
  }

  public getData (): Struct {
    return {}
  }

  public postMessage (data: unknown): void {
    if (this.worker === undefined) {
      this.postIframe(data)
    } else {
      this.postWorker(data)
    }
  }

  public reset (): void {
    this.name = this.getAttribute('sc-name') ?? ''
    this.url = this.getAttribute('sc-url') ?? ''
  }

  public setData (): void {}

  public toObject (): Struct {
    return {}
  }

  public update (): void {}

  protected addEventListeners (): void {
    this.addEventListener('sc-work', this.handleWorkBound)
    window.addEventListener('message', this.handleMessageBound)
  }

  protected createIframe (): HTMLIFrameElement {
    const iframe = document.createElement('iframe')

    iframe.setAttribute('referrerpolicy', 'no-referrer')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.onerror = this.handleErrorBound
    iframe.onload = this.handleLoadBound

    iframe.src = this.i18n.format(`${this.origin}${this.url}`, {
      name: this.name
    })

    return iframe
  }

  protected createWorker (): Worker | undefined {
    const workerHandler = `
      function workerHandler(event) {
        Promise
          .resolve()
          .then(() => {
            return ${ScolaWorkerElement.handlers[this.name]?.toString() ?? ''}(event.data.data)
          })
          .then((data) => {
            self.postMessage(data)
          })
          .catch((error) => {
            setTimeout(() => {
              throw error
            })
          })
      }
    `

    this.workerUrl = URL.createObjectURL(new Blob([
      `onmessage=${workerHandler}`
    ], {
      type: 'application/javascript'
    }))

    const worker = new window.Worker(this.workerUrl)

    worker.onerror = this.handleErrorBound
    worker.onmessage = this.handleMessageBound
    return worker
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatch<ScolaError>('error', [{
      code: 'err_worker',
      message: this.propagator.extractMessage(error)
    }])
  }

  protected handleLoad (): void {
    this.propagator.dispatch('load')
  }

  protected handleMessage (event: MessageEvent): void {
    if (
      event.source === this.iframe?.contentWindow ||
      event.target === this.worker
    ) {
      this.propagator.dispatch('message', [event.data], event)
    }
  }

  protected handleWork (event: CustomEvent): void {
    this.postMessage(event.detail)
  }

  protected load (): void {
    if (ScolaWorkerElement.handlers[this.name] === undefined) {
      this.iframe = this.createIframe()
      this.appendChild(this.iframe)
    } else {
      this.worker = this.createWorker()
    }
  }

  protected postIframe (data: unknown): void {
    this.iframe?.contentWindow?.postMessage({
      data
    }, '*')
  }

  protected postWorker (data: unknown): void {
    this.worker?.postMessage({
      data
    })
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-work', this.handleWorkBound)
    window.removeEventListener('message', this.handleMessageBound)
  }
}
