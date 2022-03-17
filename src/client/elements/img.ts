import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

export interface ScolaImageElementData extends Struct {
  src: string
  srcset: string
}

export class ScolaImageElement extends HTMLImageElement implements ScolaElement {
  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
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

  public getData (): ScolaImageElementData {
    return {
      src: this.src,
      srcset: this.srcset
    }
  }

  public setData (data: unknown): void {
    this.clear()

    if (data instanceof File) {
      this.setSourceFromFile(data)
    } else if (isStruct(data)) {
      if (data.file instanceof File) {
        this.setSourceFromFile(data.file)
      } else {
        this.setSourceFromStruct(data)
      }
    } else if (typeof data === 'string') {
      this.setSourceFromStruct({
        src: data
      })
    } else {
      this.removeAttribute('src')
    }

    this.update()
  }

  public toObject (): Struct {
    return {
      src: this.src,
      srcset: this.srcset
    }
  }

  public update (): void {
    this.updateAttributes()
    this.propagator.dispatch('update')
  }

  public updateAttributes (): void {
    this.setAttribute('sc-updated', Date.now().toString())
  }

  protected setSourceFromFile (file: File): void {
    const src = URL.createObjectURL(file)

    window.requestAnimationFrame(() => {
      this.setSourceFromStruct({
        src
      })
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
