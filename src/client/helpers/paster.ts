import type { ScolaElement } from '../elements'
import type { Struct } from '../../common'

export class Paster {
  public element: ScolaElement

  protected handleBlurBound = this.handleBlur.bind(this)

  protected handleFocusBound = this.handleFocus.bind(this)

  protected handlePasteBound = this.handlePaste.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
  }

  public connect (): void {
    this.addEventListeners()
  }

  public disconnect (): void {
    this.removeEventListeners()
  }

  protected addEventListeners (): void {
    this.element.addEventListener('blur', this.handleBlurBound)
    this.element.addEventListener('focus', this.handleFocusBound)
  }

  protected handleBlur (): void {
    document.removeEventListener('paste', this.handlePasteBound)
  }

  protected handleFocus (): void {
    document.addEventListener('paste', this.handlePasteBound)
  }

  protected handlePaste (event: ClipboardEvent): void {
    event.preventDefault()

    const files = Array.from(event.clipboardData?.files ?? [])

    this.element.propagator.dispatchEvents<File>('pastefile', files, event)
    this.element.propagator.dispatchEvents<Struct<File[]>>('pastefiles', [{ files }], event)
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('blur', this.handleBlurBound)
    this.element.removeEventListener('focus', this.handleFocusBound)
  }
}
