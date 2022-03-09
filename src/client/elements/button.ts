import { Dragger, Dropper, Interactor, Mutator, Observer, Propagator } from '../helpers'
import type { InteractorEvent } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

export class ScolaButtonElement extends HTMLButtonElement implements ScolaElement {
  public data: Struct = {}

  public dragger?: Dragger

  public dropper?: Dropper

  public interactor: Interactor

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.interactor = new Interactor(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)

    if (this.hasAttribute('sc-drag')) {
      this.dragger = new Dragger(this)
    }

    if (this.hasAttribute('sc-drop')) {
      this.dropper = new Dropper(this)
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

    this.dragger?.setData(data)
    this.propagator.set(data)
    this.update()
  }

  public toObject (): Struct {
    return {
      ...this.dataset,
      ...this.data
    }
  }

  public update (): void {}

  protected changeFocus (): void {
    if (!this.hasAttribute('hidden')) {
      if (this.getAttribute('sc-focus')?.includes('button') === true) {
        this.focus()
      }
    }
  }

  protected handleInteractor (event: InteractorEvent): boolean {
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

  protected handleInteractorClick (event: InteractorEvent): boolean {
    return this.propagator.dispatch('click', [this.getData()], event.originalEvent)
  }

  protected handleInteractorContextmenu (event: InteractorEvent): boolean {
    return this.propagator.dispatch('contextmenu', [this.getData()], event.originalEvent)
  }

  protected handleInteractorDblclick (event: InteractorEvent): boolean {
    return this.propagator.dispatch('dblclick', [this.getData()], event.originalEvent)
  }

  protected handleInteractorStart (event: InteractorEvent): boolean {
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
