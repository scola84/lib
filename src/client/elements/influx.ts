import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import styles from '../styles/influx'

declare global {
  interface HTMLElementTagNameMap {
    'scola-influx': InfluxElement
  }
}

@customElement('scola-influx')
export class InfluxElement extends NodeElement {
  public static styles = [
    ...NodeElement.styles,
    styles
  ]

  @property({
    reflect: true,
    type: Boolean
  })
  public dragging?: boolean

  @property({
    type: Boolean
  })
  public drop?: boolean

  @property({
    type: Boolean
  })
  public paste?: boolean

  protected handleBlurBound = this.handleBlur.bind(this)

  protected handleDragleaveBound = this.handleDragleave.bind(this)

  protected handleDragoverBound = this.handleDragover.bind(this)

  protected handleDropBound = this.handleDrop.bind(this)

  protected handleFocusBound = this.handleFocus.bind(this)

  protected handlePasteBound = this.handlePaste.bind(this)

  protected createDispatchItems (files?: FileList): unknown[] {
    return Array
      .from(files ?? [])
      .map((file) => {
        return {
          file,
          filename: file.name,
          filesize: file.size,
          filetype: file.type
        }
      })
  }

  protected handleBlur (event: Event): void {
    event.preventDefault()
    this.dragging = false
    document.removeEventListener('paste', this.handlePasteBound)
  }

  protected handleDragleave (event: DragEvent): void {
    event.preventDefault()
    this.dragging = false
  }

  protected handleDragover (event: DragEvent): void {
    event.preventDefault()
    this.dragging = true
  }

  protected handleDrop (event: DragEvent): void {
    event.preventDefault()
    this.dispatchEvents(this.dispatch, this.createDispatchItems(event.dataTransfer?.files))
    this.dragging = false
  }

  protected handleFocus (event: Event): void {
    event.preventDefault()
    this.dragging = true
    document.addEventListener('paste', this.handlePasteBound)
  }

  protected handlePaste (event: ClipboardEvent): void {
    event.preventDefault()
    this.dispatchEvents(this.dispatch, this.createDispatchItems(event.clipboardData?.files))
  }

  protected setUpElementListeners (): void {
    if (this.drop === true) {
      this.addEventListener('dragleave', this.handleDragleaveBound)
      this.addEventListener('dragover', this.handleDragoverBound)
      this.addEventListener('drop', this.handleDropBound)
    }

    if (this.paste === true) {
      this.addEventListener('blur', this.handleBlurBound)
      this.addEventListener('focus', this.handleFocusBound)
    }
  }
}
