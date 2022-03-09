import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-reload': CustomEvent
  }
}

export class ScolaReloaderElement extends HTMLObjectElement implements ScolaElement {
  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  protected handleReloadBound = this.handleReload.bind(this)

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
  }

  public static define (): void {
    customElements.define('sc-reloader', ScolaReloaderElement, {
      extends: 'object'
    })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public getData (): Struct {
    return {}
  }

  public reset (): void {}

  public setData (): void {}

  public toObject (): Struct {
    return {}
  }

  public update (): void {}

  protected addEventListeners (): void {
    this.addEventListener('sc-reload', this.handleReloadBound)
  }

  protected handleReload (): void {
    window.location.reload()
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-reload', this.handleReloadBound)
  }
}
