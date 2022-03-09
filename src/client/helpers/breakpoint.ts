import type { ScolaElement } from '../elements'

type Callback = (event: BreakpointEvent) => void

export interface BreakpointEvent {
  changed: boolean
  breakpoint: string
}

export class Breakpoint {
  public breakpoint: string

  public callback?: Callback

  public element: HTMLElement

  public parser: RegExp

  protected handleResizeBound = this.handleResize.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.reset()
  }

  public connect (): void {
    this.addEventListeners()
  }

  public disconnect (): void {
    this.removeEventListeners()
  }

  public observe (callback: Callback): void {
    this.callback = callback
  }

  public parse (name: string, element = this.element): string | undefined {
    return this.parser.exec(element.getAttribute(name) ?? '')?.[1]
  }

  public reset (): void {
    this.breakpoint = window
      .getComputedStyle(this.element)
      .getPropertyValue('--breakpoint')
      .trim()

    this.parser = new RegExp(`([^@\\s]*)@(${this.breakpoint}|all)`, 'u')
  }

  protected addEventListeners (): void {
    window.addEventListener('resize', this.handleResizeBound)
  }

  protected handleResize (): void {
    const { breakpoint } = this

    this.reset()

    this.callback?.({
      breakpoint: this.breakpoint,
      changed: this.breakpoint !== breakpoint
    })
  }

  protected removeEventListeners (): void {
    window.removeEventListener('resize', this.handleResizeBound)
  }
}
