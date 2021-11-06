import type { ScolaElement } from '../elements/element'

export class ScolaBreakpoint {
  public element: ScolaElement

  public parser: RegExp

  public constructor (element: ScolaElement) {
    this.element = element
    this.reset()
  }

  public parse (name: string): string | undefined {
    return this.parser.exec(this.element.getAttribute(name) ?? '')?.[1]
  }

  public reset (): void {
    this.parser = new RegExp(`([^@\\s]*)@(${window.getComputedStyle(this.element).getPropertyValue('--breakpoint')}|all)`, 'u')
  }
}
