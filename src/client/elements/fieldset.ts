import { Mutator, Observer, Propagator } from '../helpers'
import { Struct, setPush } from '../../common'
import type { ScolaElement } from './element'
import type { ScolaFieldElement } from './field'
import { ScolaInputElement } from './input'
import { ScolaSelectElement } from './select'
import { ScolaTextAreaElement } from './textarea'

declare global {
  interface HTMLElementEventMap {
    'sc-fieldset-falsify': CustomEvent
    'sc-fieldset-verify': CustomEvent
  }
}

export class ScolaFieldSetElement extends HTMLFieldSetElement implements ScolaElement {
  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public get fieldElements (): ScolaFieldElement[] {
    return Array
      .from(this.elements)
      .filter((element) => {
        return (
          element instanceof ScolaInputElement ||
          element instanceof ScolaSelectElement ||
          element instanceof ScolaTextAreaElement
        )
      }) as ScolaFieldElement[]
  }

  protected handleFalsifyBound = this.handleFalsify.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleVerifyBound = this.handleVerify.bind(this)

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
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

    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public falsify (): void {
    Array
      .from(this.elements)
      .forEach((element) => {
        if (
          element instanceof ScolaInputElement ||
          element instanceof ScolaSelectElement ||
          element instanceof ScolaTextAreaElement
        ) {
          element.falsify()
        }
      })
  }

  public getData (): Struct {
    return this.serialize()
  }

  public setData (data: unknown): void {
    this.toggleDisabled()
    this.propagator.set(data)
  }

  public toObject (): Struct {
    return this.serialize()
  }

  public update (): void {}

  public verify (): void {
    Array
      .from(this.elements)
      .forEach((element) => {
        if (
          element instanceof ScolaInputElement ||
          element instanceof ScolaSelectElement ||
          element instanceof ScolaTextAreaElement
        ) {
          element.verify()
        }
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
    const dispatched = this.propagator.dispatch('falsify', [this.getData()])

    if (!dispatched) {
      this.falsify()
    }
  }

  protected handleObserver (): void {
    this.toggleDisabled()
    this.changeFocus()
  }

  protected handleVerify (): void {
    const dispatched = this.propagator.dispatch('verify', [this.getData()])

    if (!dispatched) {
      this.verify()
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-fieldset-falsify', this.handleFalsifyBound)
    this.removeEventListener('sc-fieldset-verify', this.handleVerifyBound)
  }

  protected serialize (): Struct {
    return this.fieldElements.reduce<Struct>((data, element) => {
      const value = element.getValue()

      if (
        element.type === 'radio' &&
        value === null
      ) {
        return data
      }

      return setPush(data, element.name, value)
    }, Struct.create())
  }

  protected toggleDisabled (): void {
    this.toggleAttribute('disabled', this.hasAttribute('hidden'))
  }
}
