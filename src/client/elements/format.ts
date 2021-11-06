import { ScolaIntl, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import { ScolaSanitizer } from '../helpers/sanitizer'
import type { Struct } from '../../common'
import { marked } from 'marked'

export class ScolaFormatElement extends HTMLSpanElement implements ScolaElement {
  public code: string

  public datamap: Struct = {}

  public intl: ScolaIntl

  public marked: boolean

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public sanitizer: ScolaSanitizer

  protected handleMutationsBound = this.handleMutations.bind(this)

  public constructor () {
    super()
    this.intl = new ScolaIntl()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.sanitizer = new ScolaSanitizer()
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-format', ScolaFormatElement, {
      extends: 'span'
    })
  }

  public connectedCallback (): void {
    this.observer.connect(this.handleMutationsBound, [
      'sc-code'
    ])

    this.mutator.connect()
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
      ...this.datamap
    }
  }

  public reset (): void {
    this.code = this.getAttribute('sc-code') ?? ''
    this.marked = this.hasAttribute('sc-marked')
  }

  public setData (data: unknown): void {
    if (isStruct(data)) {
      Object.assign(this.datamap, data)

      if (typeof data.code === 'string') {
        this.setAttribute('sc-code', data.code)
      } else {
        this.update()
      }
    }
  }

  public update (): void {
    const string = this.intl.format(this.code, this.getData())

    if (this.marked) {
      this.innerHTML = this.sanitizer.sanitizeHtml(marked(string, {
        breaks: true,
        smartLists: true,
        smartypants: true,
        xhtml: true
      }))
    } else {
      this.textContent = string
    }
  }

  protected handleMutations (): void {
    this.reset()
    this.update()
  }
}
