import { ScolaIntl, isStruct } from '../../common'
import { ScolaMutator, ScolaObserver, ScolaPropagator } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'

export class ScolaTextElement extends HTMLSpanElement implements ScolaElement {
  public code: string

  public data: Struct = {}

  public initialCode: string | null

  public initialText: string

  public intl: ScolaIntl

  public locale?: string

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public trim: boolean

  public constructor () {
    super()
    this.intl = new ScolaIntl()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.initialCode = this.getAttribute('sc-code')
    this.initialText = this.textContent?.trim() ?? ''
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-text', ScolaTextElement, {
      extends: 'span'
    })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.update()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public getData (): Struct {
    return {
      ...this.dataset,
      ...this.data
    }
  }

  public reset (): void {
    this.code = this.getAttribute('sc-code') ?? ''
    this.locale = this.getAttribute('sc-locale') ?? ScolaIntl.locale
    this.trim = this.hasAttribute('sc-trim')
  }

  public setData (data: unknown): void {
    if (isStruct(data)) {
      if (isStruct(data.data)) {
        this.data = data.data
      } else {
        this.data = data
      }

      if (
        this.initialCode === null &&
        typeof data.code === 'string'
      ) {
        this.code = data.code
      }

      this.update()
    }
  }

  public toObject (): Struct {
    return {
      ...this.dataset,
      ...this.data
    }
  }

  public update (): void {
    let string = this.intl.format(this.code, this.getData(), this.locale)

    if (this.trim) {
      string = string
        .replace(/\s+/u, ' ')
        .trim()
    }

    if (
      string === '' ||
      string === this.code
    ) {
      this.textContent = this.initialText
    } else {
      this.textContent = string
    }
  }
}
