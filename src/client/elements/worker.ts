import { I18n, isResult, toString } from '../../common'
import { Mutator, Observer, Propagator } from '../helpers'
import type { Result, ScolaError, Struct } from '../../common'
import type { ScolaElement } from './element'

declare global {
  interface HTMLElementEventMap {
    'sc-work': CustomEvent
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (data: any) => Promise<void> | void

export class ScolaWorkerElement extends HTMLObjectElement implements ScolaElement {
  public static handlers: Partial<Struct<Handler>> = {}

  public static origin = window.location.origin

  public error?: ScolaError

  public i18n: I18n

  public iframe?: HTMLIFrameElement

  public iframeUrl: string

  public mutator: Mutator

  public name: string

  public observer: Observer

  public origin = ScolaWorkerElement.origin

  public propagator: Propagator

  public result?: Result

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

  public clear (): void {
    this.removeAttribute('aria-invalid')
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

  public toJSON (): unknown {
    return {
      id: this.id,
      is: this.getAttribute('is'),
      name: this.name,
      nodeName: this.nodeName,
      url: this.url
    }
  }

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

    iframe.src = this.i18n.formatText(`${this.origin}${this.url}`, {
      name: this.name
    })

    return iframe
  }

  protected createWorker (): Worker | undefined {
    const workerHandler = `
      function workerHandler(event) {
        const eventData = event.data

        let data = null

        if (
          typeof eventData === 'object' &&
          typeof eventData?.data === 'object' &&
          eventData.data?.commit !== undefined &&
          typeof eventData.data.type === 'string'
        ) {
          data = eventData.data.commit
        } else {
          data = eventData.data
        }

        Promise
          .resolve()
          .then(() => {
            return ${ScolaWorkerElement.handlers[this.name]?.toString() ?? ''}(data)
          })
          .then((result) => {
            if (
              typeof eventData === 'object' &&
              typeof eventData?.data === 'object' &&
              eventData.data?.commit !== undefined &&
              typeof eventData.data.type === 'string'
            ) {
              eventData.data.result = result
              self.postMessage(eventData.data)
            } else {
              self.postMessage(result)
            }
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
    this.error = {
      code: 'err_worker',
      message: toString(error)
    }

    this.propagator.dispatchEvents<ScolaError>('error', [this.error])
    this.setAttribute('aria-invalid', 'true')
  }

  protected handleLoad (): void {
    this.propagator.dispatchEvents('load')
  }

  protected handleMessage (event: MessageEvent): void {
    if (
      event.source === this.iframe?.contentWindow ||
      event.target === this.worker
    ) {
      if (isResult(event.data)) {
        this.result = event.data
        this.propagator.dispatchEvents('message', [this.result], event)
        this.setAttribute('aria-invalid', 'false')
      }
    }
  }

  protected handleWork (event: CustomEvent): void {
    this.postMessage(event.detail)
    this.clear()
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
