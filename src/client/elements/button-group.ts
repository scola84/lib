import type { ScolaElement } from './element'
import { ScolaInteract } from '../helpers/interact'
import type { ScolaInteractEvent } from '../helpers/interact'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'

export class ScolaButtonGroupElement extends HTMLDivElement implements ScolaElement {
  public buttons: HTMLElement[]

  public interact: ScolaInteract

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public get firstButton (): HTMLElement | undefined {
    return this.buttons[0]
  }

  public get lastButton (): HTMLElement | undefined {
    return this.buttons[this.buttons.length - 1]
  }

  protected handleInteractBound = this.handleInteract.bind(this)

  public constructor () {
    super()
    this.buttons = this.selectButtons()
    this.interact = new ScolaInteract(this)
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
    this.interact.observe(this.handleInteractBound)
    this.interact.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
  }

  public disconnectedCallback (): void {
    this.interact.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public getData (): void {}

  public reset (): void {
    this.interact.keyboard = this.interact.hasKeyboard
  }

  public setData (data: unknown): void {
    this.propagator.set(data)
  }

  public update (): void {}

  protected handleInteract (event: ScolaInteractEvent): boolean {
    switch (event.type) {
      case 'start':
        return this.handleInteractStart(event)
      default:
        return false
    }
  }

  protected handleInteractStart (event: ScolaInteractEvent): boolean {
    if (document.activeElement instanceof HTMLElement) {
      const index = this.buttons.indexOf(document.activeElement)

      if (this.interact.isKeyForward(event.originalEvent)) {
        if (index === -1) {
          this.firstButton?.focus()
        } else if (index === this.buttons.length - 1) {
          this.firstButton?.focus()
        } else {
          this.buttons[index + 1]?.focus()
        }

        return true
      } else if (this.interact.isKeyBack(event.originalEvent)) {
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
