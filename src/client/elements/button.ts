import { absorb, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaButtonElement extends HTMLButtonElement implements ScolaElement {
  public cancel: boolean

  public datamap: Struct = {}

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleCancelBound = this.handleCancel.bind(this)

  protected handleClickBound = this.handleClick.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-button', ScolaButtonElement, {
      extends: 'button'
    })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public getData (): Struct {
    return absorb(this.dataset, this.datamap, true)
  }

  public reset (): void {
    this.cancel = this.hasAttribute('sc-cancel')
  }

  public setData (data: unknown): void {
    if (isStruct(data)) {
      Object.assign(this.datamap, data)
    }
  }

  public update (): void {}

  protected addEventListeners (): void {
    if (this.hasAttribute('sc-cancel')) {
      this.addEventListener('mousedown', this.handleCancelBound)
      this.addEventListener('mouseup', this.handleCancelBound)
      this.addEventListener('touchend', this.handleCancelBound)

      this.addEventListener('touchstart', this.handleCancelBound, {
        passive: true
      })
    }

    if (this.hasAttribute('sc-onclick')) {
      this.addEventListener('click', this.handleClickBound)
    }
  }

  protected handleCancel (event: MouseEvent | TouchEvent): void {
    event.cancelBubble = this.cancel
  }

  protected handleClick (event: MouseEvent): void {
    event.cancelBubble = this.cancel
    this.propagator.dispatch('click', [this.getData()], event)
  }

  protected removeEventListeners (): void {
    if (this.hasAttribute('sc-cancel')) {
      this.removeEventListener('mousedown', this.handleCancelBound)
      this.removeEventListener('mouseup', this.handleCancelBound)
      this.removeEventListener('touchend', this.handleCancelBound)
      this.removeEventListener('touchstart', this.handleCancelBound)
    }

    if (this.hasAttribute('sc-onclick')) {
      this.removeEventListener('click', this.handleClickBound)
    }
  }
}
