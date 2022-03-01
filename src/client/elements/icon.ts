import { ScolaIntl, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaIconElement extends HTMLSpanElement implements ScolaElement {
  public static snippets: Struct<string | undefined> = {}

  public code: string

  public data: Struct = {}

  public initialCode: string | null

  public intl: ScolaIntl

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public constructor () {
    super()
    this.intl = new ScolaIntl()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.initialCode = this.getAttribute('sc-code')
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
    const code = this.intl.format(this.code, this.getData())
    const snippet = ScolaIconElement.snippets[code]

    if (snippet !== undefined) {
      this.innerHTML = snippet
    }
  }
}
