import type { ScolaElement } from './element'
import { ScolaMedia } from '../helpers/media'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

export class ScolaVideoElement extends HTMLVideoElement implements ScolaElement {
  public media: ScolaMedia

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public constructor () {
    super()
    this.media = new ScolaMedia(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
  }

  public static define (): void {
    customElements.define('sc-video', ScolaVideoElement, {
      extends: 'video'
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
    this.media.destroy()
  }

  public getData (): Struct {
    return this.media.getData()
  }

  public reset (): void {}

  public setData (data: unknown): void {
    this.media.setData(data)
  }

  public update (): void {}
}
