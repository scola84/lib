import type { InputElement } from './input'
import type { LogEvent } from './node'
import { RequestElement } from './request'
import { customElement } from 'lit-element'

declare global {
  interface HTMLElementTagNameMap {
    'scola-form': FormElement
  }
}

@customElement('scola-form')
export class FormElement extends RequestElement {
  public data?: Record<string, unknown>

  public method: RequestElement['method'] = 'POST'

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

  protected createRequest (): Request {
    return new Request(this.createURL(), {
      body: this.getValues(),
      cache: this.cache,
      credentials: this.credentials,
      integrity: this.integrity,
      keepalive: this.keepalive,
      method: this.method,
      mode: this.mode,
      redirect: this.redirect,
      referrer: this.referrer,
      referrerPolicy: this.referrerPolicy,
      signal: this.controller.signal
    })
  }

  protected async finishJSON (): Promise<void> {
    await super.finishJSON()

    this.inputElements.forEach((inputElement: InputElement) => {
      if (this.data !== undefined) {
        if (this.code === 'ERR_INPUT_INVALID') {
          inputElement.setError(this.data)
        } else if (this.request?.method === 'GET') {
          inputElement.setValue(this.data)
        }
      }
    })
  }

  protected getValues (): FormData | URLSearchParams {
    const data = this.hasFiles ? new FormData() : new URLSearchParams()

    Array
      .from(this.inputElements)
      .forEach((inputElement: InputElement) => {
        inputElement.appendValueTo(data)
      })

    return data
  }

  protected handleKeydown (event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return
    }

    event.cancelBubble = true
    this.start()
  }

  protected handleLog (event: LogEvent): void {
    if (event.detail?.code === 'ERR_INPUT_INVALID') {
      event.cancelBubble = true
    }
  }
}
