import type { ScolaElement } from '../elements'

interface ScolaEventInit extends CustomEventInit {
  element: ScolaElement
  trigger?: Event
}

export class ScolaEvent extends CustomEvent<unknown> {
  public element: ScolaElement

  public trigger?: Event

  public constructor (name: string, options: ScolaEventInit) {
    super(name, options)
    this.element = options.element
    this.trigger = options.trigger
  }
}
