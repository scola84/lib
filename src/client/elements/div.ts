import { cast, isArray, isStruct } from '../../common'
import { ScolaDragger } from '../helpers/dragger'
import { ScolaDropper } from '../helpers/dropper'
import type { ScolaElement } from './element'
import { ScolaFocuser } from '../helpers/focuser'
import { ScolaHider } from '../helpers/hider'
import { ScolaInteractor } from '../helpers/interactor'
import type { ScolaInteractorEvent } from '../helpers/interactor'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPaster } from '../helpers/paster'
import { ScolaPropagator } from '../helpers/propagator'

declare global {
  interface HTMLElementEventMap {
    'sc-fullscreen': CustomEvent
    'sc-drop-transfer': CustomEvent
  }
}

export class ScolaDivElement extends HTMLDivElement implements ScolaElement {
  public dragger?: ScolaDragger

  public dropper?: ScolaDropper

  public focuser?: ScolaFocuser

  public hider?: ScolaHider

  public interactor: ScolaInteractor

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public paster?: ScolaPaster

  public propagator: ScolaPropagator

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleTransferBound = this.handleTransfer.bind(this)

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

    if (this.hasAttribute('sc-focus')) {
      this.focuser = new ScolaFocuser(this)
    }

    if (this.hasAttribute('sc-hide')) {
      this.hider = new ScolaHider(this)
    }

    if (this.hasAttribute('sc-paste')) {
      this.paster = new ScolaPaster(this)
    }

    this.reset()
  }

  public static define (): void {
    customElements.define('sc-div', ScolaDivElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.interactor.observe(this.handleInteractorBound)

    this.observer.observe(this.handleObserverBound, [
      'hidden',
      'sc-fullscreen'
    ])

    this.dragger?.connect()
    this.dropper?.connect()
    this.focuser?.connect()
    this.hider?.connect()
    this.interactor.connect()
    this.mutator.connect()
    this.observer.connect()
    this.paster?.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.dragger?.disconnect()
    this.dropper?.disconnect()
    this.focuser?.disconnect()
    this.hider?.disconnect()
    this.interactor.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.paster?.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public getData (): void {}

  public reset (): void {
    if (
      this.hasAttribute('sc-cancel') ||
      this.hasAttribute('sc-onclick') ||
      this.hasAttribute('sc-oncontextmenu') ||
      this.hasAttribute('sc-ondblclick')
    ) {
      this.interactor.cancel = this.hasAttribute('sc-cancel')
      this.interactor.keyboard = this.interactor.hasKeyboard
      this.interactor.mouse = this.interactor.hasMouse
      this.interactor.touch = this.interactor.hasTouch
    }
  }

  public setData (data: unknown): void {
    this.propagator.set(data)
  }

  public update (): void {}

  protected addEventListeners (): void {
    if (this.hasAttribute('sc-drop')) {
      this.addEventListener('sc-drop-transfer', this.handleTransferBound)
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
    return this.propagator.dispatch('click', undefined, event.originalEvent)
  }

  protected handleInteractorContextmenu (event: ScolaInteractorEvent): boolean {
    return this.propagator.dispatch('contextmenu', undefined, event.originalEvent)
  }

  protected handleInteractorDblclick (event: ScolaInteractorEvent): boolean {
    return this.propagator.dispatch('dblclick', undefined, event.originalEvent)
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

  protected handleObserver (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalize(mutations)

    if (attributes.includes('hidden')) {
      this.hider?.toggle()
    } else if (attributes.includes('sc-fullscreen')) {
      this.handleObserverFullscreen()
    }
  }

  protected handleObserverFullscreen (): void {
    if (document.fullscreenEnabled) {
      if (this.hasAttribute('sc-fullscreen')) {
        this.requestFullscreen().catch(() => {})
      } else {
        document.exitFullscreen().catch(() => {})
      }
    } else {
      this.removeAttribute('sc-fullscreen')
    }
  }

  protected handleTransfer (event: CustomEvent): void {
    if (
      isStruct(event.detail) &&
      isArray(event.detail.items)
    ) {
      if (cast(event.detail.copy) === true) {
        this.dropper?.dropItems(event.detail.items, 'dropcopy', event)
      } else {
        this.dropper?.dropItems(event.detail.items, 'drop', event)
      }
    }
  }

  protected removeEventListeners (): void {
    if (this.hasAttribute('sc-drop')) {
      this.removeEventListener('sc-drop-transfer', this.handleTransferBound)
    }
  }
}
