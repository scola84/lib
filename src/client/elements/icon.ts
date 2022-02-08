import { ScolaIntl, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaIconElement extends HTMLSpanElement implements ScolaElement {
  public static icons: Struct<string | undefined> = {}

  public code: string

  public datamap: Struct = {}

  public intl: ScolaIntl

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleMutationsBound = this.handleMutations.bind(this)

  public constructor () {
    super()
    this.intl = new ScolaIntl()
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
    this.observer.observe(this.handleMutationsBound, [
      'sc-code'
    ])

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
      ...this.datamap
    }
  }

  public reset (): void {
    this.code = this.getAttribute('sc-code') ?? ''
  }

  public setData (data: unknown): void {
    if (isStruct(data)) {
      this.datamap = data

      if (typeof data.code === 'string') {
        this.setAttribute('sc-code', data.code)
      } else {
        this.update()
      }
    }
  }

  public update (): void {
    const code = this.intl.format(this.code, this.getData())

    this.innerHTML = ScolaIconElement.icons[code] ?? ''
  }

  protected handleMutations (): void {
    this.reset()
    this.update()
  }
}
