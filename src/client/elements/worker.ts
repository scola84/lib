import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-worker-post': CustomEvent
  }
}

type Handler = (event: MessageEvent) => void

interface Workers {
  [key: string]: Handler | undefined
}

export class ScolaWorkerElement extends HTMLObjectElement implements ScolaElement {
  public static workers: Workers = {}

  public handler?: string

  public mutator: ScolaMutator

  public name: string

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public worker?: Worker

  protected handleErrorBound = this.handleError.bind(this)

  protected handleMessageBound = this.handleMessage.bind(this)

  protected handlePostBound = this.handlePost.bind(this)

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

  public static defineWorkers (workers: Struct<Handler>): void {
    Object
      .entries(workers)
      .forEach(([name, handler]) => {
        ScolaWorkerElement.workers[name] = handler
      })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()

    const handler = ScolaWorkerElement.workers[this.name]

    if (handler !== undefined) {
      this.handler = URL.createObjectURL(new Blob([`onmessage=${handler.toString()}`], {
        type: 'application/javascript'
      }))

      this.worker = new window.Worker(this.handler)
      this.addEventListeners()
    }
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()

    if (this.handler !== undefined) {
      this.worker?.terminate()
      this.removeEventListeners()
      URL.revokeObjectURL(this.handler)
    }
  }

  public getData (): void {}

  public postMessage (message: Struct | null): void {
    this.worker?.postMessage(JSON.stringify(message))
  }

  public reset (): void {
    this.name = this.getAttribute('sc-name') ?? ''
  }

  public setData (data: unknown): void {
    this.propagator.set(data)
  }

  public update (): void {}

  protected addEventListeners (): void {
    this.addEventListener('sc-worker-post', this.handlePostBound)
    this.worker?.addEventListener('error', this.handleErrorBound)
    this.worker?.addEventListener('message', this.handleMessageBound)
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatch('error', [{
      code: 'err_worker',
      message: String(error)
    }])
  }

  protected handleMessage (event: MessageEvent): void {
    this.propagator.dispatch('message', [event.data], event)
    this.propagator.set(event.data)
  }

  protected handlePost (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.worker?.postMessage(event.detail)
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-worker-post', this.handlePostBound)
    this.worker?.removeEventListener('error', this.handleErrorBound)
    this.worker?.removeEventListener('message', this.handleMessageBound)
  }
}
