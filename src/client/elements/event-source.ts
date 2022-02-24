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

  protected handleErrorBound = this.handleError.bind(this)

  protected handleMessageBound = this.handleMessage.bind(this)

  protected handleOpenBound = this.handleOpen.bind(this)

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

  public close (): void {
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

  public getData (): void {}

  public isSame (): void {}

  public open (): EventSource {
    this.source = new EventSource(this.url.toString())
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

  public reopen (): void {
    this.tries += 1

    window.setTimeout(() => {
      this.open()
    }, this.tries * 1000)
  }

  public reset (): void {
    this.event = this.getAttribute('sc-event') ?? ''
    this.url = new URL(`${this.origin}${this.getAttribute('sc-path') ?? ''}`)
  }

  public setData (): void {}

  public update (): void {}

  protected addEventListeners (): void {
    document.addEventListener('visibilitychange', this.handleVisibilityChangeBound)
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

  protected removeEventListeners (): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChangeBound)
  }
}
