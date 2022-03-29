import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'

declare global {
  interface EventSourceEventMap {
    [key: string]: MessageEvent
  }
}

export class ScolaEventSourceElement extends HTMLObjectElement implements ScolaElement {
  public static origin = window.location.origin

  public event: string

  public mutator: Mutator

  public observer: Observer

  public origin = ScolaEventSourceElement.origin

  public propagator: Propagator

  public source?: EventSource

  public tries = 0

  public url: string

  protected handleErrorBound = this.handleError.bind(this)

  protected handleMessageBound = this.handleMessage.bind(this)

  protected handleOpenBound = this.handleOpen.bind(this)

  protected handleVisibilityChangeBound = this.handleVisibilityChange.bind(this)

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-event-source', ScolaEventSourceElement, {
      extends: 'object'
    })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
    this.open()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
    this.close()
  }

  public getData (): Struct {
    return {}
  }

  public reset (): void {
    this.event = this.getAttribute('sc-event') ?? ''
    this.url = this.getAttribute('sc-url') ?? ''
  }

  public setData (): void {}

  public toObject (): Struct {
    return {}
  }

  public update (): void {}

  protected addEventListeners (): void {
    document.addEventListener('visibilitychange', this.handleVisibilityChangeBound)
  }

  protected close (): void {
    if (this.source !== undefined) {
      this.source.close()
      this.source.onerror = null
      this.source.onopen = null
      this.source = undefined
    }

    this.event
      .trim()
      .split(/\s+/u)
      .forEach((event) => {
        this.source?.removeEventListener(event, this.handleMessageBound)
      })
  }

  protected handleError (): void {
    this.close()
    this.reopen()
  }

  protected handleMessage (event: MessageEvent<string>): void {
    try {
      this.propagator.dispatch('message', [JSON.parse(event.data) as Struct], event)
    } catch (error: unknown) {
      this.handleError()
    }
  }

  protected handleOpen (): void {
    this.tries = 0
  }

  protected handleVisibilityChange (): void {
    if (document.visibilityState === 'visible') {
      this.close()
      this.open()
    }
  }

  protected open (): EventSource {
    this.source = new EventSource(`${this.origin}${this.url}`)
    this.source.onerror = this.handleErrorBound
    this.source.onopen = this.handleOpenBound

    this.event
      .trim()
      .split(/\s+/u)
      .forEach((event) => {
        this.source?.addEventListener(event, this.handleMessageBound)
      })

    return this.source
  }

  protected removeEventListeners (): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChangeBound)
  }

  protected reopen (): void {
    this.tries += 1

    window.setTimeout(() => {
      this.open()
    }, this.tries * 1000)
  }
}
