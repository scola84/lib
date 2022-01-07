import { ScolaDivElement } from './div'
import type { ScolaElement } from './element'
import type { ScolaInteractEvent } from '../helpers/interact'

export class ScolaButtonGroupElement extends ScolaDivElement implements ScolaElement {
  public buttons: HTMLElement[]

  public get firstButton (): HTMLElement | undefined {
    return this.buttons[0]
  }

  public get lastButton (): HTMLElement | undefined {
    return this.buttons[this.buttons.length - 1]
  }

  public static define (): void {
    customElements.define('sc-button-group', ScolaButtonGroupElement, {
      extends: 'div'
    })
  }

  public reset (): void {
    super.reset()
    this.buttons = Array.from(this.querySelectorAll<HTMLElement>('button[sc-button-group]'))
  }

  protected handleInteract (event: ScolaInteractEvent): boolean {
    let handled = false

    if (
      event.type === 'start' &&
      document.activeElement instanceof HTMLElement
    ) {
      const index = this.buttons.indexOf(document.activeElement)

      if (this.interact.isKeyForward(event.originalEvent)) {
        if (index === -1) {
          this.firstButton?.focus()
        } else if (index === this.buttons.length - 1) {
          this.firstButton?.focus()
        } else {
          this.buttons[index + 1]?.focus()
        }

        handled = true
      } else if (this.interact.isKeyBack(event.originalEvent)) {
        if (index === 0) {
          this.lastButton?.focus()
        } else {
          this.buttons[index - 1]?.focus()
        }

        handled = true
      }
    }

    if (handled) {
      return handled
    }

    return super.handleInteract(event)
  }
}
