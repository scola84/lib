import { ScolaIntl, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaTextElement extends HTMLSpanElement implements ScolaElement {
  public code: string

  public data: Struct = {}

  public initialText: string

  public intl: ScolaIntl

  public locale?: string

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public trim: boolean

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.intl = new ScolaIntl()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-text', ScolaTextElement, {
      extends: 'span'
    })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'sc-code'
    ])

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
    this.initialText = this.textContent?.trim() ?? ''
    this.locale = this.getAttribute('sc-locale') ?? ScolaIntl.locale
    this.trim = this.hasAttribute('sc-trim')
  }

  public setData (data: unknown): void {
    if (isStruct(data)) {
      this.data = data

      if (typeof data.code === 'string') {
        this.setAttribute('sc-code', data.code)
      } else {
        this.update()
      }
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

  protected handleObserver (): void {
    this.reset()
    this.update()
  }
}
