import { ScolaIntl, isSame, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import { ScolaSanitizer } from '../helpers/sanitizer'
import type { Struct } from '../../common'
import { marked } from 'marked'

export class ScolaMarkedElement extends HTMLDivElement implements ScolaElement {
  public code: string

  public data: Struct = {}

  public initialCode: string | null

  public initialInnerHtml: string

  public intl: ScolaIntl

  public locale?: string

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public sanitizer: ScolaSanitizer

  public trim: boolean

  public constructor () {
    super()
    this.intl = new ScolaIntl()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.sanitizer = new ScolaSanitizer()
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

  public isSame (data: unknown): boolean {
    return isSame(data, this.getData())
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

  public update (): void {
    let string = this.intl.format(this.code, this.getData(), this.locale)

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
