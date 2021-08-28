import { customElement, property } from 'lit/decorators.js'
import type { FieldElement } from './field'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'

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
  @property()
  public method = 'POST'

  public get fieldElements (): NodeListOf<FieldElement> {
    return this.querySelectorAll<FieldElement>('scola-input, scola-picker, scola-select, scola-slider')
  }

  public get hasFieldElements (): boolean {
    return this.querySelector<FieldElement>('scola-input, scola-picker, scola-select, scola-slider') !== null
  }

  public get hasFileElements (): boolean {
    return this.querySelector<HTMLInputElement>('input[type="file"]') !== null
  }

  protected handleSubmitBound: (event: CustomEvent) => void

  protected updaters = FormElement.updaters

  public constructor () {
    super()
    this.handleSubmitBound = this.handleSubmit.bind(this)
  }

  public submit (): void {
    let body: FormData | URLSearchParams = new URLSearchParams()

    if (this.hasFileElements) {
      body = new FormData()
    }

    this.fieldElements.forEach((fieldElement) => {
      fieldElement.appendValueTo(body)
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
      this.handleData()
    }

    super.update(properties)
  }

  protected handleData (): void {
    this.setLeafData()
    this.scrollToError()
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

  protected scrollToError (): void {
    window.requestAnimationFrame(() => {
      this
        .querySelector('[as="error"]:not([hidden])')
        ?.closest('scola-input')
        ?.scrollIntoView({
          behavior: 'smooth'
        })
    })
  }

  protected setUpElementListeners (): void {
    this.addEventListener('keydown', this.handleKeydown.bind(this))
    this.addEventListener('scola-log', this.handleLog.bind(this))
    this.addEventListener('scola-form-submit', this.handleSubmitBound)
    super.setUpElementListeners()
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-form-submit', this.handleSubmitBound)
    super.setUpWindowListeners()
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-form-submit', this.handleSubmitBound)
    super.tearDownWindowListeners()
  }
}
