import type { InputElement } from './input'
import type { LogEvent } from './node'
import { RequestElement } from './request'
import { customElement } from 'lit/decorators.js'

declare global {
  interface HTMLElementTagNameMap {
    'scola-form': FormElement
  }
}

@customElement('scola-form')
export class FormElement extends RequestElement {
  public data?: Record<string, unknown>

  public method: RequestElement['method'] = 'POST'

  public wait = true

  protected handleKeydownBound: (event: KeyboardEvent) => void

  protected get hasFiles (): boolean {
    return this.querySelector('input[type="file"]') !== null
  }

  protected get inputElements (): NodeListOf<InputElement> {
    return this.querySelectorAll('scola-input, scola-picker, scola-select, scola-slider')
  }

  public constructor () {
    super()
    this.handleKeydownBound = this.handleKeydown.bind(this)
    this.addEventListener('keydown', this.handleKeydownBound)
    this.addEventListener('scola-log', this.handleLog.bind(this))
  }

  protected createBody (): FormData | URLSearchParams {
    let data = null

    if (this.hasFiles) {
      data = new FormData()
    } else {
      data = new URLSearchParams()
    }

    return Array
      .from(this.inputElements)
      .reduce((result, inputElement: InputElement) => {
        inputElement.appendValueTo(result)
        return result
      }, data)
  }

  protected async finish (): Promise<void> {
    await super.finish()

    this.inputElements.forEach((inputElement: InputElement) => {
      if (this.data !== undefined) {
        if (this.code === 'ERR_400') {
          inputElement.setError(this.data)
        } else if (this.request?.method === 'GET') {
          inputElement.setValue(this.data)
        }
      }
    })
  }

  protected handleKeydown (event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return
    }

    event.cancelBubble = true
    this.start()
  }

  protected handleLog (event: LogEvent): void {
    if (event.detail?.code === 'ERR_400') {
      event.cancelBubble = true
    }
  }
}
