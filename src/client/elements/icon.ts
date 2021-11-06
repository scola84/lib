import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaIconElement extends HTMLSpanElement implements ScolaElement {
  public static icons: Struct<string | null> = {}

  public code: string

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleMutationsBound = this.handleMutations.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-icon', ScolaIconElement, {
      extends: 'span'
    })
  }

  public static defineIcons (icons: Struct<string>): void {
    Object
      .entries(icons)
      .forEach(([code, svg]) => {
        ScolaIconElement.icons[code] = svg
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

  public getData (): string | null {
    return this.getAttribute('sc-code')
  }

  public reset (): void {
    this.code = this.getAttribute('sc-code') ?? ''
  }

  public setData (data: unknown): void {
    if (typeof data === 'string') {
      this.setAttribute('sc-code', data)
    }
  }

  public update (): void {
    this.innerHTML = ScolaIconElement.icons[this.code] ?? ''
  }

  protected handleMutations (): void {
    this.reset()
    this.update()
  }
}
