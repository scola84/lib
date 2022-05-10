import { Dragger, Dropper, Formatter, Interactor, Mutator, Observer, Propagator } from '../helpers'
import { isStruct, merge } from '../../common'
import type { InteractorEvent } from '../helpers'
import type { ScolaElement } from './element'

export class ScolaButtonElement extends HTMLButtonElement implements ScolaElement {
  public datamap: unknown

  public dragger?: Dragger

  public dropper?: Dropper

  public formatter: Formatter

  public interactor: Interactor

  public mutator: Mutator

  public observer: Observer

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
    this.update()
  }

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

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

    this.reset()
    this.update()
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
    this.formatter.connect()
    this.interactor.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
  }

  public disconnectedCallback (): void {
    this.dragger?.disconnect()
    this.dropper?.disconnect()
    this.formatter.disconnect()
    this.interactor.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
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

  protected handleObserver (): void {
    this.changeFocus()
  }
}
