import { I18n, isStruct } from '../../common'
import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'

export class ScolaIconElement extends HTMLSpanElement implements ScolaElement {
  public static snippets: Struct<string | undefined> = {}

  public code: string

  public data: Struct = {}

  public i18n: I18n

  public initialCode: string | null

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public constructor () {
    super()
    this.i18n = new I18n()
    this.initialCode = this.getAttribute('sc-code')
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-icon', ScolaIconElement, {
      extends: 'span'
    })
  }

  public static defineSnippets (snippets: Struct<string>): void {
    Object
      .entries(snippets)
      .forEach(([code, snippet]) => {
        ScolaIconElement.snippets[code] = snippet
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
    const code = this.i18n.format(this.code, this.getData())
    const snippet = ScolaIconElement.snippets[code]

    if (snippet !== undefined) {
      this.innerHTML = snippet
    }
  }
}
