import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'
import { customElement } from 'lit/decorators.js'
import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'scola-worker-post': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-worker': WorkerElement
  }

  interface WindowEventMap {
    'scola-worker-post': CustomEvent
  }
}

export interface Handlers {
  [key: string]: ((message: MessageEvent) => void) | undefined
}

@customElement('scola-worker')
export class WorkerElement extends NodeElement {
  public static handlers: Handlers = {}

  protected handleErrorBound = this.handleError.bind(this)

  protected handleMessageBound = this.handleMessage.bind(this)

  protected handlePostBound = this.handlePost.bind(this)

  protected handler?: string

  protected handlers = WorkerElement.handlers

  protected worker?: Worker

  public connectedCallback (): void {
    this.setUpWorker()
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    this.tearDownWorker()
    super.disconnectedCallback()
  }

  public post (message: Struct): void {
    this.worker?.postMessage(JSON.stringify(message))
  }

  public update (properties: PropertyValues): void {
    if (properties.has('data')) {
      this.handleData()
    }

    super.update(properties)
  }

  protected handleData (): void {
    this.setDataOn(this.scopedDataNodeElements)
  }

  protected handleError (event: ErrorEvent): void {
    this.dispatchEvents([{
      level: 'err',
      message: event.message
    }])
  }

  protected handleMessage (event: MessageEvent): void {
    if (typeof event.data === 'string') {
      try {
        this.data = JSON.parse(event.data)
      } catch (error: unknown) {
        this.dispatchEvents([{
          level: 'err',
          message: String(error)
        }])
      }
    }
  }

  protected handlePost (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isStruct(data)) {
        this.post(data)
      }
    }
  }

  protected setUpElementListeners (): void {
    this.addEventListener('scola-worker-post', this.handlePostBound)
    super.setUpElementListeners()
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-worker-post', this.handlePostBound)
    super.setUpWindowListeners()
  }

  protected setUpWorker (): void {
    const handler = this.handlers[this.name]

    if (handler !== undefined) {
      this.handler = URL.createObjectURL(new Blob([`onmessage=${handler.toString()}`], {
        type: 'application/javascript'
      }))

      this.worker = new Worker(this.handler)
      this.worker.addEventListener('error', this.handleErrorBound)
      this.worker.addEventListener('message', this.handleMessageBound)
    }
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-worker-post', this.handlePostBound)
    super.tearDownWindowListeners()
  }

  protected tearDownWorker (): void {
    if (this.handler !== undefined) {
      URL.revokeObjectURL(this.handler)
    }

    this.worker?.removeEventListener('error', this.handleErrorBound)
    this.worker?.removeEventListener('message', this.handleMessageBound)
    this.worker?.terminate()
  }
}
