import { absorb, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-event-dispatch': CustomEvent
  }
}

export class ScolaEventElement extends HTMLObjectElement implements ScolaElement {
  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public wait: boolean

  protected handleDispatchBound = this.handleDispatch.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-event', ScolaEventElement, {
      extends: 'object'
    })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()

    if (!this.wait) {
      this.dispatch()
    }
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public dispatch (data?: Struct, event?: Event): void {
    this
      .querySelectorAll('param')
      .forEach((param) => {
        this.propagator.dispatchEvent(param.value, [absorb(param.dataset, data)], event)
      })
  }

  public getData (): void {}

  public reset (): void {
    this.wait = this.hasAttribute('sc-wait')
  }

  public setData (): void {}

  public update (): void {}

  protected addEventListeners (): void {
    this.addEventListener('sc-event-dispatch', this.handleDispatchBound)
  }

  protected handleDispatch (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.dispatch(event.detail, event)
    } else {
      this.dispatch(undefined, event)
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-event-dispatch', this.handleDispatchBound)
  }
}
