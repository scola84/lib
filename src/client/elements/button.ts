import { Dragger, Dropper, Interactor, Mutator, Observer, Propagator } from '../helpers'
import { I18n } from '../../common'
import type { InteractorEvent } from '../helpers'
import type { ScolaElement } from './element'

export class ScolaButtonElement extends HTMLButtonElement implements ScolaElement {
  public code: string | null

  public datamap: unknown

  public dragger?: Dragger

  public dropper?: Dropper

  public i18n: I18n

  public interactor: Interactor

  public locale?: string

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public get data (): unknown {
    return this.datamap ?? { ...this.dataset }
  }

  public set data (data: unknown) {
    this.datamap = data
    this.dragger?.setData(data)
    this.propagator.set(data)
    this.update()
  }

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.i18n = new I18n()
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

  public reset (): void {
    this.code = this.getAttribute('sc-code')
    this.interactor.cancel = this.hasAttribute('sc-cancel')
    this.interactor.keyboard = this.interactor.hasKeyboard
    this.interactor.mouse = this.interactor.hasMouse
    this.interactor.touch = this.interactor.hasTouch
    this.locale = this.getAttribute('sc-locale') ?? undefined
  }

  public toJSON (): unknown {
    return {
      code: this.code,
      data: this.data,
      id: this.id,
      is: this.getAttribute('is'),
      locale: this.locale,
      nodeName: this.nodeName
    }
  }

  public update (): void {
    if (this.code !== null) {
      this.title = this.i18n.format(this.code, this.data, this.locale)
    }
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
    return this.propagator.dispatch('click', [this.data], event.originalEvent)
  }

  protected handleInteractorContextmenu (event: InteractorEvent): boolean {
    return this.propagator.dispatch('contextmenu', [this.data], event.originalEvent)
  }

  protected handleInteractorDblclick (event: InteractorEvent): boolean {
    return this.propagator.dispatch('dblclick', [this.data], event.originalEvent)
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
