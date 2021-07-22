import type { InputElement } from './input'
import type { LogEvent } from './node'
import type { PropertyValues } from 'lit'
import { RequestElement } from './request'
import type { SourceElement } from './source'
import { customElement } from 'lit/decorators.js'

declare global {
  interface HTMLElementTagNameMap {
    'scola-form': FormElement
  }
}

@customElement('scola-form')
export class FormElement extends RequestElement {
  public static updaters = {
    ...RequestElement.updaters,
    'scola-source': (source: FormElement, target: SourceElement): void => {
      source.inputElements.forEach((inputElement) => {
        if (source.isObject(target.data)) {
          inputElement.setValue(target.data)
        }
      })
    }
  }

  public data?: Record<string, unknown>

  public method = 'POST'

  public wait = true

  protected updaters = FormElement.updaters

  protected get hasFiles (): boolean {
    return this.querySelector<HTMLInputElement>('input[type="file"]') !== null
  }

  protected get inputElements (): NodeListOf<InputElement> {
    return this.querySelectorAll<InputElement>('scola-input, scola-picker, scola-select, scola-slider')
  }

  public firstUpdated (properties: PropertyValues): void {
    this.addEventListener('keydown', this.handleKeydown.bind(this))
    this.addEventListener('scola-log', this.handleLog.bind(this))
    super.firstUpdated(properties)
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

  protected async handleFetch (): Promise<void> {
    await super.handleFetch()

    this.inputElements.forEach((inputElement) => {
      if (this.data !== undefined) {
        if (this.code === 'err_400') {
          inputElement.setError(this.data)
        } else if (this.request?.method === 'GET') {
          inputElement.setValue(this.data)
        }
      }
    })

    if (
      this.request?.method !== 'GET' &&
      this.code?.startsWith('ok_') === true
    ) {
      this.dispatchEvents()
    }
  }

  protected handleKeydown (event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return
    }

    event.cancelBubble = true
    this.start()
  }

  protected handleLog (event: LogEvent): void {
    if (event.detail?.code === 'err_400') {
      event.cancelBubble = true
    }
  }
}
