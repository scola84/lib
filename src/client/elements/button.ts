import { ScolaDragger } from '../helpers/dragger'
import { ScolaDropper } from '../helpers/dropper'
import type { ScolaElement } from './element'
import { ScolaInteractor } from '../helpers/interactor'
import type { ScolaInteractorEvent } from '../helpers/interactor'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

export class ScolaButtonElement extends HTMLButtonElement implements ScolaElement {
  public data: Struct = {}

  public dragger?: ScolaDragger

  public dropper?: ScolaDropper

  public interactor: ScolaInteractor

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.interactor = new ScolaInteractor(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)

    if (this.hasAttribute('sc-drag')) {
      this.dragger = new ScolaDragger(this)
    }

    if (this.hasAttribute('sc-drop')) {
      this.dropper = new ScolaDropper(this)
    }

    this.reset()
  }

  public static define (): void {
    customElements.define('sc-button', ScolaButtonElement, {
      extends: 'button'
    })
  }

  public connectedCallback (): void {
    this.interactor.observe(this.handleInteractorBound)

    this.observer.observe(this.handleObserverBound, [
      'hidden'
    ])

    this.dragger?.connect()
    this.dropper?.connect()
    this.interactor.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
  }

  public disconnectedCallback (): void {
    this.dragger?.disconnect()
    this.dropper?.disconnect()
    this.interactor.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public getData (): Struct {
    return {
      ...this.dataset,
      ...this.data
    }
  }

  public reset (): void {
    this.interactor.cancel = this.hasAttribute('sc-cancel')
    this.interactor.keyboard = this.interactor.hasKeyboard
    this.interactor.mouse = this.interactor.hasMouse
    this.interactor.touch = this.interactor.hasTouch
  }

  public setData (data: unknown): void {
    if (isStruct(data)) {
      this.data = data
    }

    this.propagator.set(data)
    this.update()
  }

  public update (): void {}

  protected changeFocus (): void {
    if (!this.hasAttribute('hidden')) {
      if (this.getAttribute('sc-focus')?.includes('button') === true) {
        this.focus()
      }
    }
  }

  protected handleInteractor (event: ScolaInteractorEvent): boolean {
    switch (event.type) {
      case 'click':
        return this.handleInteractorClick(event)
      case 'contextmenu':
        return this.handleInteractorContextmenu(event)
      case 'dblclick':
        return this.handleInteractorDblclick(event)
      case 'start':
        return this.handleInteractorStart(event)
      default:
        return false
    }
  }

  protected handleInteractorClick (event: ScolaInteractorEvent): boolean {
    return this.propagator.dispatch('click', [this.getData()], event.originalEvent)
  }

  protected handleInteractorContextmenu (event: ScolaInteractorEvent): boolean {
    return this.propagator.dispatch('contextmenu', [this.getData()], event.originalEvent)
  }

  protected handleInteractorDblclick (event: ScolaInteractorEvent): boolean {
    return this.propagator.dispatch('dblclick', [this.getData()], event.originalEvent)
  }

  protected handleInteractorStart (event: ScolaInteractorEvent): boolean {
    let handled = false

    if (this.interactor.isKeyboard(event.originalEvent)) {
      if (
        this.interactor.isKey(event.originalEvent, 'Enter') ||
        this.interactor.isKey(event.originalEvent, 'Space')
      ) {
        handled = true
      }
    } else {
      handled = true
    }

    return handled
  }

  protected handleObserver (): void {
    this.changeFocus()
  }
}
