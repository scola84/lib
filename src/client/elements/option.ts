import { Mutator, Observer, Propagator } from '../helpers'
import { I18n } from '../../common'
import type { ScolaElement } from './element'

export class ScolaOptionElement extends HTMLOptionElement implements ScolaElement {
  public code: string

  public datamap: unknown

  public i18n: I18n

  public initialCode: string | null

  public initialText: string

  public locale?: string

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public trim: boolean

  public get data (): unknown {
    return this.datamap
  }

  public set data (data: unknown) {
    this.datamap = data
    this.update()
  }

  public constructor () {
    super()
    this.i18n = new I18n()
    this.initialCode = this.getAttribute('sc-code')
    this.initialText = this.textContent?.trim() ?? ''
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
    this.update()
  }

  public static define (): void {
    customElements.define('sc-option', ScolaOptionElement, {
      extends: 'option'
    })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public reset (): void {
    this.code = this.getAttribute('sc-code') ?? ''
    this.locale = this.getAttribute('sc-locale') ?? I18n.locale
    this.trim = this.hasAttribute('sc-trim')
  }

  public update (): void {
    let string = this.i18n.format(this.code, this.data, this.locale)

    if (this.trim) {
      string = string
        .trim()
        .replace(/\s+/u, ' ')
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
