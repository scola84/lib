import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

type Handler = (data: unknown) => Promise<unknown> | unknown

export class ScolaWorkerElement extends HTMLObjectElement implements ScolaElement {
  public static handlers: Struct<Handler | undefined> = {}

  public static origin = window.location.origin

  public iframe?: HTMLIFrameElement

  public iframeUrl: string

  public mutator: ScolaMutator

  public name: string

  public observer: ScolaObserver

  public origin = ScolaWorkerElement.origin

  public propagator: ScolaPropagator

  public url: string

  public worker?: Worker

  public workerData: unknown

  public workerUrl?: string

  protected handleErrorBound = this.handleError.bind(this)

  protected handleLoadBound = this.handleLoad.bind(this)

  protected handleMessageBound = this.handleMessage.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
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

  public getData (): void {}

  public isSame (): void {}

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

  public setData (data: unknown): void {
    this.workerData = data
    this.update()
  }

  public update (): void {
    this.postMessage(this.workerData)
    this.updateAttributes()
    this.propagator.dispatch('update')
  }

  public updateAttributes (): void {
    this.setAttribute('sc-updated', Date.now().toString())
  }

  protected addEventListeners (): void {
    window.addEventListener('message', this.handleMessageBound)
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
    this.propagator.dispatch('error', [{
      code: 'err_worker',
      message: this.propagator.extractMessage(error)
    }])
  }

  protected handleLoad (): void {
    this.update()
  }

  protected handleMessage (event: MessageEvent): void {
    if (
      event.source === this.iframe?.contentWindow ||
      event.target === this.worker
    ) {
      this.propagator.dispatch('message', [event.data], event)
    }
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
    this.worker?.postMessage(data)
  }

  protected removeEventListeners (): void {
    window.removeEventListener('message', this.handleMessageBound)
  }
}
