import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

declare global {
  interface EventSourceEventMap {
    [key: string]: MessageEvent
  }
}

export class ScolaEventSourceElement extends HTMLObjectElement implements ScolaElement {
  public static origin = window.location.origin

  public event: string

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public origin = ScolaEventSourceElement.origin

  public propagator: ScolaPropagator

  public source?: EventSource

  public tries = 0

  public url: URL

  protected handleMessageBound = this.handleMessage.bind(this)

  protected handleVisibilityChangeBound = this.handleVisibilityChange.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
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
    this.start()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
    this.stop()
  }

  public getData (): void {}

  public reset (): void {
    this.event = this.getAttribute('sc-event') ?? ''
    this.url = new URL(`${this.origin}${this.getAttribute('sc-path') ?? ''}`)
  }

  public restart (): void {
    this.tries += 1

    window.setTimeout(() => {
      this.start()
    }, this.tries * 1000)
  }

  public setData (): void {}

  public start (): void {
    this.source = new EventSource(this.url.toString())
    this.source.onerror = this.handleError.bind(this)
    this.source.onopen = this.handleOpen.bind(this)

    this.event
      .trim()
      .split(/\s+/u)
      .forEach((event) => {
        this.source?.addEventListener(event, this.handleMessageBound)
      })
  }

  public stop (): void {
    if (this.source !== undefined) {
      this.source.close()
      this.source.onerror = null
      this.source.onopen = null
    }

    this.event
      .trim()
      .split(/\s+/u)
      .forEach((event) => {
        this.source?.removeEventListener(event, this.handleMessageBound)
      })
  }

  public update (): void {}

  protected addEventListeners (): void {
    document.addEventListener('visibilitychange', this.handleVisibilityChangeBound)
  }

  protected handleError (): void {
    this.stop()
    this.restart()
  }

  protected handleMessage (event: MessageEvent<string>): void {
    try {
      const data = JSON.parse(event.data) as Struct

      this.propagator.dispatch('message', [data], event)
      this.propagator.set(data)
    } catch (error: unknown) {
      this.handleError()
    }
  }

  protected handleOpen (): void {
    this.tries = 0
  }

  protected handleVisibilityChange (): void {
    if (document.visibilityState === 'visible') {
      this.stop()
      this.start()
    }
  }

  protected removeEventListeners (): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChangeBound)
  }
}
