import type { ScolaElement } from '../elements'
import { ScolaInteractor } from './interactor'
import type { ScolaInteractorEvent } from './interactor'

export class ScolaFocuser {
  public element: ScolaElement

  public interactor: ScolaInteractor

  protected handleInteractorBound = this.handleInteractor.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.interactor = new ScolaInteractor(element)
    this.reset()
  }

  public connect (): void {
    this.interactor.observe(this.handleInteractorBound)
    this.interactor.connect()
  }

  public disconnect (): void {
    this.interactor.disconnect()
  }

  public reset (): void {
    this.interactor.keyboard = this.interactor.hasKeyboard
    this.interactor.mouse = this.interactor.hasMouse
    this.interactor.target = 'window'
    this.interactor.touch = this.interactor.hasTouch
  }

  protected handleInteractor (event: ScolaInteractorEvent): boolean {
    switch (event.type) {
      case 'click':
        return this.handleInteractorClick(event)
      case 'start':
        return this.handleInteractorStart(event)
      default:
        return false
    }
  }

  protected handleInteractorClick (event: ScolaInteractorEvent): boolean {
    this.toggleAttribute(event.originalEvent.composedPath().includes(this.element))
    return true
  }

  protected handleInteractorStart (event: ScolaInteractorEvent): boolean {
    this.toggleAttribute(event.originalEvent.composedPath().includes(this.element))
    return true
  }

  protected toggleAttribute (force: boolean): void {
    this.element.toggleAttribute('sc-focused', force)
  }
}
