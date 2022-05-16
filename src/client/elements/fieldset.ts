import { Hider, Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'
import type { ScolaFieldElement } from './field'
import { ScolaInputElement } from './input'
import { ScolaSelectElement } from './select'
import { ScolaTextAreaElement } from './textarea'
import type { Struct } from '../../common'
import { setPush } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-fieldset-falsify': CustomEvent
    'sc-fieldset-verify': CustomEvent
  }
}

export class ScolaFieldSetElement extends HTMLFieldSetElement implements ScolaElement {
  public hider?: Hider

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public get data (): unknown {
    return this.serialize()
  }

  public set data (data: unknown) {
    this.toggleDisabled()
    this.propagator.setData(data)
  }

  public get fieldElements (): ScolaFieldElement[] {
    const elements: ScolaFieldElement[] = []

    for (const element of Array.from(this.elements)) {
      if (
        element instanceof ScolaInputElement ||
        element instanceof ScolaSelectElement ||
        element instanceof ScolaTextAreaElement
      ) {
        elements.push(element)
      }
    }

    return elements
  }

  protected handleFalsifyBound = this.handleFalsify.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleVerifyBound = this.handleVerify.bind(this)

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)

    if (this.hasAttribute('sc-hide')) {
      this.hider = new Hider(this)
    }
  }

  public static define (): void {
    customElements.define('sc-fieldset', ScolaFieldSetElement, {
      extends: 'fieldset'
    })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'hidden'
    ])

    this.hider?.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.hider?.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public falsify (): void {
    this.fieldElements.forEach((element) => {
      element.falsify()
    })
  }

  public toJSON (): unknown {
    return {
      fieldElements: this.fieldElements.length,
      id: this.id,
      is: this.getAttribute('is'),
      nodeName: this.nodeName
    }
  }

  public verify (): void {
    this.fieldElements.forEach((element) => {
      element.verify()
    })
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-fieldset-falsify', this.handleFalsifyBound)
    this.addEventListener('sc-fieldset-verify', this.handleVerifyBound)
  }

  protected changeFocus (): void {
    if (!this.hasAttribute('hidden')) {
      const element = this.querySelector('[sc-focus~="fieldset"]')

      if (element instanceof HTMLElement) {
        element.focus()
      }
    }
  }

  protected handleFalsify (): void {
    const dispatched = this.propagator.dispatchEvents('falsify', [this.data])

    if (!dispatched) {
      this.falsify()
    }
  }

  protected handleObserver (): void {
    this.hider?.toggle()
    this.toggleDisabled()
    this.changeFocus()
  }

  protected handleVerify (): void {
    const dispatched = this.propagator.dispatchEvents('verify', [this.data])

    if (!dispatched) {
      this.verify()
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-fieldset-falsify', this.handleFalsifyBound)
    this.removeEventListener('sc-fieldset-verify', this.handleVerifyBound)
  }

  protected serialize (): Struct {
    const data = {}

    for (const element of this.fieldElements) {
      if (element.name !== '') {
        setPush(data, element.qualifiedName, element.valueAsCast)
      }
    }

    return data
  }

  protected toggleDisabled (): void {
    const force = this.hasAttribute('hidden')

    this
      .querySelectorAll('button, input, select, textarea')
      .forEach((element) => {
        element.toggleAttribute('disabled', force)
      })
  }
}
