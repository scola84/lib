import { absorb, cast, isStruct } from '../../common'
import { ScolaDrop } from '../helpers/drop'
import type { ScolaElement } from './element'
import { ScolaHider } from '../helpers/hider'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPaste } from '../helpers/paste'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'
import { isArray } from 'lodash'

declare global {
  interface HTMLElementEventMap {
    'sc-drop-transfer': CustomEvent
  }
}

export class ScolaDivElement extends HTMLDivElement implements ScolaElement {
  public datamap: Struct = {}

  public drop?: ScolaDrop

  public hider?: ScolaHider

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public paste?: ScolaPaste

  public propagator: ScolaPropagator

  protected handleClickBound = this.handleClick.bind(this)

  protected handleContextmenuBound = this.handleContextmenu.bind(this)

  protected handleMutationsBound = this.handleMutations.bind(this)

  protected handleTransferBound = this.handleTransfer.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)

    if (this.hasAttribute('sc-drop')) {
      this.drop = new ScolaDrop(this)
    }

    if (this.hasAttribute('sc-paste')) {
      this.paste = new ScolaPaste(this)
    }

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
    this.observer.observe(this.handleMutationsBound, [
      'hidden'
    ])

    this.drop?.connect()
    this.hider?.connect()
    this.mutator.connect()
    this.observer.connect()
    this.paste?.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.drop?.disconnect()
    this.hider?.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.paste?.disconnect()
    this.propagator.disconnect()
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
    if (this.hasAttribute('sc-drop')) {
      this.addEventListener('sc-drop-transfer', this.handleTransferBound)
    }

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

  protected handleTransfer (event: CustomEvent): void {
    if (
      isStruct(event.detail) &&
      isArray(event.detail.items)
    ) {
      if (cast(event.detail.copy) === true) {
        this.drop?.dropItems(event.detail.items, 'dropcopy', event)
      } else {
        this.drop?.dropItems(event.detail.items, 'drop', event)
      }
    }
  }

  protected removeEventListeners (): void {
    if (this.hasAttribute('sc-drop')) {
      this.removeEventListener('sc-drop-transfer', this.handleTransferBound)
    }

    if (this.hasAttribute('sc-onclick')) {
      this.removeEventListener('click', this.handleClickBound)
    }

    if (this.hasAttribute('sc-oncontextmenu')) {
      this.removeEventListener('contextmenu', this.handleContextmenuBound)
    }
  }
}
