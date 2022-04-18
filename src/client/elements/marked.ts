import { I18n, isError } from '../../common'
import { Mutator, Observer, Propagator, Sanitizer } from '../helpers'
import type { ScolaElement } from './element'

export class ScolaMarkedElement extends HTMLDivElement implements ScolaElement {
  public code: string

  public datamap: unknown

  public i18n: I18n

  public initialCode: string | null

  public initialInnerHtml: string

  public locale?: string

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public sanitizer: Sanitizer

  public trim: boolean

  public get data (): unknown {
    return this.datamap ?? { ...this.dataset }
  }

  public set data (data: unknown) {
    if (isError(data)) {
      this.datamap = data.data

      if (this.initialCode === null) {
        this.code = data.code
      }
    } else {
      this.datamap = data
    }

    this.update()
  }

  public constructor () {
    super()
    this.i18n = new I18n()
    this.initialCode = this.getAttribute('sc-code')
    this.initialInnerHtml = this.innerHTML
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.sanitizer = new Sanitizer()
    this.reset()
    this.update()
  }

  public static define (): void {
    customElements.define('sc-marked', ScolaMarkedElement, {
      extends: 'div'
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

  public toJSON (): unknown {
    return {
      code: this.code,
      data: this.data,
      id: this.id,
      is: this.getAttribute('is'),
      locale: this.locale,
      nodeName: this.nodeName,
      trim: this.trim
    }
  }

  public update (): void {
    const html = this.sanitizer.sanitizeHtml(this.i18n.marked(this.code, this.data, this.locale))

    if (
      html === '' ||
      html === this.code
    ) {
      this.innerHTML = this.initialInnerHtml
    } else {
      this.innerHTML = html
    }
  }
}
