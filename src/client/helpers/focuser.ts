import type { ScolaElement } from '../elements/element'
import { ScolaInteract } from './interact'
import type { ScolaInteractEvent } from './interact'

export class ScolaFocuser {
  public element: ScolaElement

  public interact: ScolaInteract

  protected handleInteractBound = this.handleInteract.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.interact = new ScolaInteract(element)
    this.reset()
  }

  public connect (): void {
    this.interact.observe(this.handleInteractBound)
    this.interact.connect()
  }

  public disconnect (): void {
    this.interact.disconnect()
  }

  public reset (): void {
    this.interact.keyboard = this.interact.hasKeyboard
    this.interact.mouse = this.interact.hasMouse
    this.interact.target = 'window'
    this.interact.touch = this.interact.hasTouch
  }

  protected handleInteract (event: ScolaInteractEvent): boolean {
    switch (event.type) {
      case 'click':
        return this.handleInteractClick(event)
      case 'start':
        return true
      default:
        return false
    }
  }

  protected handleInteractClick (event: ScolaInteractEvent): boolean {
    this.element.toggleAttribute('sc-focused', event.originalEvent.composedPath().includes(this.element))
    return true
  }
}
