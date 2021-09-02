import { customElement, property } from 'lit/decorators.js'
import type { PropertyValues } from 'lit'
import { RequestElement } from './request'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementTagNameMap {
    'scola-source': SourceElement
  }

  interface EventSourceEventMap {
    [key: string]: MessageEvent
  }
}

@customElement('scola-source')
export class SourceElement extends RequestElement {
  @property()
  public event?: string

  @property()
  public type?: string

  protected handleMessageBound: (event: MessageEvent) => void

  protected source?: EventSource

  protected tries = 0

  protected updaters = SourceElement.updaters

  public constructor () {
    super()
    this.handleMessageBound = this.handleMessage.bind(this)
  }

  public abort (): void {
    if (this.source !== undefined) {
      this.source.close()
      this.source.onerror = null
      this.source.onopen = null
    }

    this.event
      ?.split(' ')
      .forEach((event) => {
        this.source?.removeEventListener(event, this.handleMessageBound)
      })
  }

  public disconnectedCallback (): void {
    this.abort()
    super.disconnectedCallback()
  }

  public restart (options?: Struct): void {
    if (this.source?.readyState === this.source?.CLOSED) {
      this.tries += 1

      window.setTimeout(() => {
        this.start(options)
      }, this.tries * 1000)
    }
  }

  public start (options?: Struct): void {
    this.source = new EventSource(this.createURL(options).toString())
    this.source.onerror = this.handleError.bind(this)
    this.source.onopen = this.handleOpen.bind(this)

    this.event
      ?.split(' ')
      .forEach((event) => {
        this.source?.addEventListener(event, this.handleMessageBound)
      })
  }

  public update (properties: PropertyValues): void {
    if (properties.has('data')) {
      this.handleData()
    }

    super.update(properties)
  }

  protected handleData (): void {
    this.setNodeData()
  }

  protected handleError (): void {
    this.restart()
    this.abort()
  }

  protected handleMessage (event: MessageEvent<string>): void {
    try {
      this.data = JSON.parse(event.data)
      this.type = event.type
    } catch (error: unknown) {
      this.handleError()
    }
  }

  protected handleOpen (): void {
    this.tries = 0
  }
}
