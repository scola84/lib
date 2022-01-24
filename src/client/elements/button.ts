import { absorb, isStruct } from '../../common'
import { ScolaDrag } from '../helpers/drag'
import { ScolaDrop } from '../helpers/drop'
import type { ScolaElement } from './element'
import { ScolaInteract } from '../helpers/interact'
import type { ScolaInteractEvent } from '../helpers/interact'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaButtonElement extends HTMLButtonElement implements ScolaElement {
  public datamap: Struct = {}

  public drag?: ScolaDrag

  public drop?: ScolaDrop

  public interact: ScolaInteract

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleInteractBound = this.handleInteract.bind(this)

  public constructor () {
    super()
    this.interact = new ScolaInteract(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)

    if (this.hasAttribute('sc-drag')) {
      this.drag = new ScolaDrag(this)
    }

    if (this.hasAttribute('sc-drop')) {
      this.drop = new ScolaDrop(this)
    }

    this.reset()
  }

  public static define (): void {
    customElements.define('sc-button', ScolaButtonElement, {
      extends: 'button'
    })
  }

  public connectedCallback (): void {
    this.interact.observe(this.handleInteractBound)
    this.drag?.connect()
    this.drop?.connect()
    this.interact.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
  }

  public disconnectedCallback (): void {
    this.drag?.disconnect()
    this.drop?.disconnect()
    this.interact.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public getData (): Struct {
    return absorb(this.dataset, this.datamap, true)
  }

  public reset (): void {
    if (this.hasAttribute('sc-onclick')) {
      this.interact.cancel = this.hasAttribute('sc-cancel')
      this.interact.keyboard = this.interact.hasKeyboard
      this.interact.mouse = this.interact.hasMouse
      this.interact.touch = this.interact.hasTouch
    }
  }

  public setData (data: unknown): void {
    if (isStruct(data)) {
      Object.assign(this.datamap, data)
    }

    this.propagator.set(data)
  }

  public update (): void {}

  protected handleInteract (event: ScolaInteractEvent): boolean {
    switch (event.type) {
      case 'click':
        return this.handleInteractClick(event)
      case 'start':
        return this.handleInteractStart(event)
      default:
        return false
    }
  }

  protected handleInteractClick (event: ScolaInteractEvent): boolean {
    this.propagator.dispatch('click', [this.getData()], event.originalEvent)
    return true
  }

  protected handleInteractStart (event: ScolaInteractEvent): boolean {
    let handled = false

    if (this.interact.isKeyboard(event.originalEvent)) {
      if (
        this.interact.isKey(event.originalEvent, 'Enter') ||
        this.interact.isKey(event.originalEvent, 'Space')
      ) {
        handled = true
      }
    } else {
      handled = true
    }

    return handled
  }
}
