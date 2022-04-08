import { I18n, isError, isStruct } from '../../common'
import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'

export class ScolaIconElement extends HTMLSpanElement implements ScolaElement {
  public static snippets: Partial<Struct<string>> = {}

  public code: string

  public datamap: unknown

  public i18n: I18n

  public initialCode: string | null

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public get data (): unknown {
    let data: Struct = {
      ...this.dataset
    }

    if (isStruct(this.datamap)) {
      data = {
        ...data,
        ...this.datamap
      }
    } else if (this.datamap !== undefined) {
      data = {
        ...data,
        data: this.datamap
      }
    }

    return data
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
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
    this.update()
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
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public reset (): void {
    this.code = this.getAttribute('sc-code') ?? ''
  }

  public update (): void {
    const code = this.i18n.format(this.code, this.data)
    const snippet = ScolaIconElement.snippets[code]

    if (snippet !== undefined) {
      this.innerHTML = snippet
    }
  }
}
