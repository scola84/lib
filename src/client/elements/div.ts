import { absorb, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaHider } from '../helpers/hider'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaDivElement extends HTMLDivElement implements ScolaElement {
  public datamap: Struct = {}

  public hider?: ScolaHider

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleClickBound = this.handleClick.bind(this)

  protected handleContextmenuBound = this.handleContextmenu.bind(this)

  protected handleMutationsBound = this.handleMutations.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)

    if (this.hasAttribute('sc-hide')) {
      this.hider = new ScolaHider(this)
    }
  }

  public static define (): void {
    customElements.define('sc-div', ScolaDivElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.observer.connect(this.handleMutationsBound, [
      'hidden'
    ])

    this.mutator.connect()
    this.propagator.connect()
    this.hider?.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.hider?.disconnect()
    this.removeEventListeners()
  }

  public getData (): Struct {
    return absorb(this.dataset, this.datamap, true)
  }

  public reset (): void {}

  public setData (data: unknown): void {
    if (isStruct(data)) {
      Object.assign(this.datamap, data)
      this.propagator.set(data)
    }
  }

  public update (): void {}

  protected addEventListeners (): void {
    if (this.hasAttribute('sc-onclick')) {
      this.addEventListener('click', this.handleClickBound)
    }

    if (this.hasAttribute('sc-oncontextmenu')) {
      this.addEventListener('contextmenu', this.handleContextmenuBound)
    }
  }

  protected handleClick (event: MouseEvent): void {
    event.cancelBubble = true
    this.propagator.dispatch('click', [this.getData()], event)
  }

  protected handleContextmenu (event: MouseEvent): void {
    event.preventDefault()
    this.propagator.dispatch('contextmenu', [this.getData()], event)
  }

  protected handleMutations (): void {
    this.hider?.toggle()
  }

  protected removeEventListeners (): void {
    if (this.hasAttribute('sc-onclick')) {
      this.removeEventListener('click', this.handleClickBound)
    }

    if (this.hasAttribute('sc-oncontextmenu')) {
      this.removeEventListener('contextmenu', this.handleContextmenuBound)
    }
  }
}
