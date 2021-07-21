import { customElement, property } from 'lit/decorators.js'
import { RequestElement } from './request'
import type { RequestEvent } from './request'

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
  @property({
    attribute: false
  })
  public data?: unknown

  @property()
  public type: string

  protected handleMessageBound: (event: MessageEvent) => void

  protected source?: EventSource

  protected updaters = SourceElement.updaters

  public constructor () {
    super()
    this.handleMessageBound = this.handleMessage.bind(this)
  }

  public abort (): void {
    this.source?.close()
  }

  public disconnectedCallback (): void {
    this.abort()

    this.event?.split(' ').forEach((event) => {
      this.source?.removeEventListener(event, this.handleMessageBound)
    })

    super.disconnectedCallback()
  }

  public start (detail?: RequestEvent['detail']): void {
    this.source = new EventSource(this.createURL(detail).toString())

    this.event?.split(' ').forEach((event) => {
      this.source?.addEventListener(event, this.handleMessageBound)
    })
  }

  protected handleMessage (event: MessageEvent<string>): void {
    this.data = JSON.parse(event.data)
    this.type = event.type
  }
}
