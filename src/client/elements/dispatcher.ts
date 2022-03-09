import { Mutator, Observer, Propagator } from '../helpers'
import { absorb, isStruct } from '../../common'
import type { PropagatorEvent } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'

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
      this.dispatch()
    }
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public dispatch (data: Struct = {}, trigger?: Event): void {
    this.events.forEach((event) => {
      this.propagator.dispatchEvent(event, [absorb(event.data, data)], trigger)
    })
  }

  public getData (): Struct {
    return {}
  }

  public reset (): void {
    this.events = this.parseEvents()
    this.wait = this.hasAttribute('sc-wait')
  }

  public setData (): void {}

  public toObject (): Struct {
    return {}
  }

  public update (): void {}

  protected addEventListeners (): void {
    this.addEventListener('sc-dispatch', this.handleDispatchBound)
  }

  protected handleDispatch (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.dispatch(event.detail, event)
    } else {
      this.dispatch(undefined, event)
    }
  }

  protected parseEvents (): PropagatorEvent[] {
    const events: PropagatorEvent[] = []

    this
      .querySelectorAll('param')
      .forEach((param) => {
        events.push(...this.propagator.parseEvents(param.value, {
          ...param.dataset
        }))
      })

    return events
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-dispatch', this.handleDispatchBound)
  }
}
