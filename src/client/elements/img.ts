import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

export class ScolaImageElement extends HTMLImageElement implements ScolaElement {
  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
  }

  public static define (): void {
    customElements.define('sc-img', ScolaImageElement, {
      extends: 'img'
    })
  }

  public clear (): void {
    if (this.src.startsWith('blob:')) {
      URL.revokeObjectURL(this.src)
    }
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
    this.clear()
  }

  public getData (): Struct {
    return {
      src: this.src,
      srcset: this.srcset
    }
  }

  public reset (): void {}

  public setData (data: unknown): void {
    if (isStruct(data)) {
      if (data.file instanceof File) {
        this.setSourceFromFile(data.file)
      } else {
        this.setSourceFromStruct(data)
      }
    } else if (typeof data === 'string') {
      this.setSourceFromStruct({
        src: data
      })
    }
  }

  public update (): void {}

  protected setSourceFromFile (file: File): void {
    this.setSourceFromStruct({
      src: URL.createObjectURL(file)
    })
  }

  protected setSourceFromStruct (struct: Struct): void {
    if (typeof struct.srcset === 'string') {
      this.srcset = struct.srcset
    } else if (typeof struct.src === 'string') {
      this.src = struct.src
    }

    if (typeof struct.sizes === 'string') {
      this.sizes = struct.sizes
    }
  }
}
