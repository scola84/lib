import { Interactor } from './interactor'
import type { InteractorEvent } from './interactor'
import type { ScolaElement } from '../elements'

export class Focuser {
  public element: ScolaElement

  public interactor: Interactor

  protected handleInteractorBound = this.handleInteractor.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.interactor = new Interactor(element)
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

  protected handleInteractor (event: InteractorEvent): boolean {
    switch (event.type) {
      case 'click':
        return this.handleInteractorClick(event)
      case 'start':
        return this.handleInteractorStart(event)
      default:
        return false
    }
  }

  protected handleInteractorClick (event: InteractorEvent): boolean {
    this.toggleAttribute(event.originalEvent.composedPath().includes(this.element))
    return true
  }

  protected handleInteractorStart (event: InteractorEvent): boolean {
    this.toggleAttribute(event.originalEvent.composedPath().includes(this.element))
    return true
  }

  protected toggleAttribute (force: boolean): void {
    this.element.toggleAttribute('sc-focused', force)
  }
}
