import { I18n, isStruct } from '../../common'
import { Mutator, Observer, Propagator, Sanitizer } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'
import { marked } from 'marked'

export class ScolaMarkedElement extends HTMLDivElement implements ScolaElement {
  public code: string

  public data: Struct = {}

  public i18n: I18n

  public initialCode: string | null

  public initialInnerHtml: string

  public locale?: string

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public sanitizer: Sanitizer

  public trim: boolean

  public constructor () {
    super()
    this.i18n = new I18n()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.sanitizer = new Sanitizer()
    this.initialCode = this.getAttribute('sc-code')
    this.initialInnerHtml = this.innerHTML
    this.reset()
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
    this.locale = this.getAttribute('sc-locale') ?? I18n.locale
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
    let string = this.i18n.format(this.code, this.getData(), this.locale)

    if (this.trim) {
      string = string
        .replace(/\s+/u, ' ')
        .trim()
    }

    const html = this.sanitizer.sanitizeHtml(marked(string, {
      breaks: true,
      smartLists: true,
      smartypants: true,
      xhtml: true
    }))

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
