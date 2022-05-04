import { Mutator, Observer, Propagator } from '../helpers'
import type { PropagatorEvent } from '../helpers'
import type { ScolaElement } from './element'
import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-dispatch': CustomEvent
  }
}

export class ScolaDispatcherElement extends HTMLObjectElement implements ScolaElement {
  public events: PropagatorEvent[]

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public wait: boolean

  protected handleDispatchBound = this.handleDispatch.bind(this)

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-dispatcher', ScolaDispatcherElement, {
      extends: 'object'
    })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()

    if (!this.wait) {
      this.wait = true

      window.requestAnimationFrame(() => {
        this.propagator.dispatchEvents('dispatch')
      })
    }
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public reset (): void {
    this.propagator.events.dispatch = this.parseEvents()
    this.wait = this.hasAttribute('sc-wait')
  }

  public toJSON (): unknown {
    return {
      events: this.events,
      id: this.id,
      is: this.getAttribute('is'),
      nodeName: this.nodeName,
      wait: this.wait
    }
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-dispatch', this.handleDispatchBound)
  }

  protected handleDispatch (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.propagator.dispatchEvents('dispatch', [event.detail], event)
    } else {
      this.propagator.dispatchEvents('dispatch', [undefined], event)
    }
  }

  protected parseEvents (): PropagatorEvent[] {
    return Array
      .from(this.querySelectorAll('param'))
      .map((param) => {
        return this.propagator.parseEvents(param.value, {
          ...param.dataset
        })
      })
      .flat()
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-dispatch', this.handleDispatchBound)
  }
}
