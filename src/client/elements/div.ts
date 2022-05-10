import { Dragger, Dropper, Focuser, Formatter, Hider, Interactor, Mutator, Observer, Paster, Propagator } from '../helpers'
import { cast, isArray, isStruct, merge } from '../../common'
import type { InteractorEvent } from '../helpers'
import type { ScolaElement } from './element'

declare global {
  interface HTMLElementEventMap {
    'sc-fullscreen': CustomEvent
    'sc-drop-transfer': CustomEvent
  }
}

export class ScolaDivElement extends HTMLDivElement implements ScolaElement {
  public datamap: unknown

  public dragger?: Dragger

  public dropper?: Dropper

  public focuser?: Focuser

  public formatter: Formatter

  public hider?: Hider

  public interactor: Interactor

  public mutator: Mutator

  public observer: Observer

  public paster?: Paster

  public propagator: Propagator

  public get data (): unknown {
    if (isStruct(this.datamap)) {
      return merge(this.datamap, this.dataset)
    }

    return this.datamap ?? {
      ...this.dataset
    }
  }

  public set data (data: unknown) {
    this.datamap = data
    this.dragger?.setData(data)
    this.formatter.setData(data)
    this.propagator.setData(data)
  }

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleTransferBound = this.handleTransfer.bind(this)

  public constructor () {
    super()
    this.formatter = new Formatter(this)
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

    if (this.hasAttribute('sc-focus')) {
      this.focuser = new Focuser(this)
    }

    if (this.hasAttribute('sc-hide')) {
      this.hider = new Hider(this)
    }

    if (this.hasAttribute('sc-paste')) {
      this.paster = new Paster(this)
    }

    this.reset()
    this.update()
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
    this.formatter.connect()
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
    this.formatter.disconnect()
    this.hider?.disconnect()
    this.interactor.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.paster?.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public reset (): void {
    this.interactor.cancel = this.hasAttribute('sc-cancel')
    this.interactor.keyboard = this.interactor.hasKeyboard
    this.interactor.mouse = this.interactor.hasMouse
    this.interactor.touch = this.interactor.hasTouch
  }

  public toJSON (): unknown {
    return {
      data: this.data,
      id: this.id,
      is: this.getAttribute('is'),
      locale: this.formatter.locale,
      nodeName: this.nodeName,
      text: this.formatter.text,
      title: this.formatter.title
    }
  }

  public update (): void {
    this.formatter.update()
  }

  protected addEventListeners (): void {
    if (this.hasAttribute('sc-drop')) {
      this.addEventListener('sc-drop-transfer', this.handleTransferBound)
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
    return this.propagator.dispatchEvents('click', [this.data], event.originalEvent)
  }

  protected handleInteractorContextmenu (event: InteractorEvent): boolean {
    return this.propagator.dispatchEvents('contextmenu', [this.data], event.originalEvent)
  }

  protected handleInteractorDblclick (event: InteractorEvent): boolean {
    return this.propagator.dispatchEvents('dblclick', [this.data], event.originalEvent)
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

  protected handleObserver (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalizeMutations(mutations)

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
