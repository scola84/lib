import { I18n, isError, isResult, isStruct, merge } from '../../common'
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
    if (isStruct(this.datamap)) {
      return merge(this.datamap, this.dataset)
    }

    return this.datamap ?? {
      ...this.dataset
    }
  }

  public set data (data: unknown) {
    if (
      isError(data) ||
      isResult(data)
    ) {
      this.code = data.code
      this.datamap = data.data
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

  public toJSON (): unknown {
    return {
      code: this.code,
      data: this.data,
      id: this.id,
      is: this.getAttribute('is'),
      nodeName: this.nodeName
    }
  }

  public update (): void {
    const code = this.i18n.formatText(this.code, this.data)
    const snippet = ScolaIconElement.snippets[code]

    if (snippet !== undefined) {
      this.innerHTML = snippet
    }
  }
}
