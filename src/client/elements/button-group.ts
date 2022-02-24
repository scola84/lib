import type { ScolaElement } from './element'
import { ScolaInteractor } from '../helpers/interactor'
import type { ScolaInteractorEvent } from '../helpers/interactor'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'

export class ScolaButtonGroupElement extends HTMLDivElement implements ScolaElement {
  public buttons: HTMLElement[]

  public interactor: ScolaInteractor

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public get firstButton (): HTMLElement | undefined {
    return this.buttons[0]
  }

  public get lastButton (): HTMLElement | undefined {
    return this.buttons[this.buttons.length - 1]
  }

  protected handleInteractorBound = this.handleInteractor.bind(this)

  public constructor () {
    super()
    this.buttons = this.selectButtons()
    this.interactor = new ScolaInteractor(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-button-group', ScolaButtonGroupElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.interactor.observe(this.handleInteractorBound)
    this.interactor.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
  }

  public disconnectedCallback (): void {
    this.interactor.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public getData (): void {}

  public isSame (): void {}

  public reset (): void {
    this.interactor.keyboard = this.interactor.hasKeyboard
  }

  public setData (data: unknown): void {
    this.propagator.set(data)
  }

  public update (): void {}

  protected handleInteractor (event: ScolaInteractorEvent): boolean {
    switch (event.type) {
      case 'start':
        return this.handleInteractorStart(event)
      default:
        return false
    }
  }

  protected handleInteractorStart (event: ScolaInteractorEvent): boolean {
    if (document.activeElement instanceof HTMLElement) {
      const index = this.buttons.indexOf(document.activeElement)

      if (this.interactor.isKeyForward(event.originalEvent)) {
        if (index === -1) {
          this.firstButton?.focus()
        } else if (index === this.buttons.length - 1) {
          this.firstButton?.focus()
        } else {
          this.buttons[index + 1]?.focus()
        }

        return true
      } else if (this.interactor.isKeyBack(event.originalEvent)) {
        if (index === 0) {
          this.lastButton?.focus()
        } else {
          this.buttons[index - 1]?.focus()
        }

        return true
      }
    }

    return false
  }

  protected selectButtons (): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>('button[sc-button-group]'))
  }
}
