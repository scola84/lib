import { customElement, property } from 'lit/decorators.js'
import type { InputElement } from './input'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import updaters from '../updaters/form'

declare global {
  interface HTMLElementEventMap {
    'scola-form-submit': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-form': FormElement
  }

  interface WindowEventMap {
    'scola-form-submit': CustomEvent
  }
}

@customElement('scola-form')
export class FormElement extends NodeElement {
  public static updaters = {
    ...NodeElement.updaters,
    ...updaters
  }

  @property()
  public method = 'POST'

  public get hasFiles (): boolean {
    return this.querySelector<HTMLInputElement>('input[type="file"]') !== null
  }

  public get inputElements (): NodeListOf<InputElement> {
    return this.querySelectorAll<InputElement>('scola-input, scola-picker, scola-select, scola-slider')
  }

  protected handleSubmitBound: (event: CustomEvent) => void

  protected updaters = FormElement.updaters

  public constructor () {
    super()
    this.handleSubmitBound = this.handleSubmit.bind(this)
  }

  public connectedCallback (): void {
    window.addEventListener('scola-form-submit', this.handleSubmitBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    window.removeEventListener('scola-form-submit', this.handleSubmitBound)
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.addEventListener('keydown', this.handleKeydown.bind(this))
    this.addEventListener('scola-log', this.handleLog.bind(this))
    this.addEventListener('scola-form-submit', this.handleSubmitBound)
    super.firstUpdated(properties)
  }

  public submit (): void {
    let body: FormData | URLSearchParams = new URLSearchParams()

    if (this.hasFiles) {
      body = new FormData()
    }

    this.inputElements.forEach((inputElement) => {
      inputElement.appendValueTo(body)
    })

    this.dispatchEvent(new CustomEvent('scola-request-start', {
      bubbles: true,
      composed: true,
      detail: {
        data: {
          body,
          method: this.method
        },
        origin: this
      }
    }))
  }

  public update (properties: PropertyValues): void {
    if (properties.has('data')) {
      this.inputElements.forEach((inputElement) => {
        inputElement.data = this.data
      })
    }

    window.requestAnimationFrame(() => {
      this
        .querySelector('[as="error"]:not([hidden])')
        ?.closest('scola-input')
        ?.scrollIntoView({
          behavior: 'smooth'
        })
    })

    super.update(properties)
  }

  protected handleKeydown (event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.cancelBubble = true
      this.submit()
    }
  }

  protected handleSubmit (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.submit()
    }
  }
}
