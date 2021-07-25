import { customElement, property } from 'lit/decorators.js'
import { RequestElement } from './request'

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
  public type: string

  protected handleMessageBound: (event: MessageEvent) => void

  protected source?: EventSource

  protected tries = 0

  protected updaters = SourceElement.updaters

  public constructor () {
    super()
    this.handleMessageBound = this.handleMessage.bind(this)
  }

  public abort (): void {
    this.source?.close()

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

  public start (options?: Record<string, unknown>): void {
    this.source = new EventSource(this.createURL(options).toString())

    this.source.onerror = () => {
      this.restart()
      this.abort()
    }

    this.source.onopen = () => {
      this.tries = 0
    }

    this.event
      ?.split(' ')
      .forEach((event) => {
        this.source?.addEventListener(event, this.handleMessageBound)
      })
  }

  protected handleMessage (event: MessageEvent<string>): void {
    this.data = JSON.parse(event.data)
    this.type = event.type
  }

  protected restart (options?: Record<string, unknown>): void {
    if (this.source?.readyState === this.source?.CLOSED) {
      this.tries += 1

      window.setTimeout(() => {
        this.start(options)
      }, this.tries * 1000)
    }
  }
}
