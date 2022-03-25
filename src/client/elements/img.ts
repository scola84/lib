import { I18n, get, isStruct } from '../../common'
import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'

export interface ImgData extends Struct {
  sizes?: string
  src: string
  srcset?: string
}

export class ScolaImageElement extends HTMLImageElement implements ScolaElement {
  public static origin = window.location.origin

  public i18n: I18n

  public key: string | null

  public mutator: Mutator

  public observer: Observer

  public origin = ScolaImageElement.origin

  public propagator: Propagator

  public url: string | null

  protected handleErrorBound = this.handleError.bind(this)

  public constructor () {
    super()
    this.i18n = new I18n()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
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
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
    this.clear()
  }

  public getData (): Required<ImgData> {
    return {
      sizes: this.sizes,
      src: this.src,
      srcset: this.srcset
    }
  }

  public isImg (value: unknown): value is ImgData {
    return (
      isStruct(value) &&
      typeof value.src === 'string'
    )
  }

  public reset (): void {
    this.key = this.getAttribute('sc-key')
    this.url = this.getAttribute('sc-url')
  }

  public setData (data: unknown): void {
    this.clear()

    if (typeof data === 'string') {
      this.setSourceFromImg({
        src: data
      })
    } else if (
      data instanceof Blob &&
      data.type.startsWith('image')
    ) {
      this.setSourceFromBlob(data)
    } else if (this.isImg(data)) {
      this.setSourceFromImg(data)
    } else if ((
      isStruct(data) &&
      this.url !== null
    ) && (
      this.key === null ||
      String(get(data, this.key.split('.')))
        .startsWith('image')
    )) {
      this.setSourceFromStruct(data)
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

  protected addEventListeners (): void {
    this.addEventListener('error', this.handleErrorBound)
  }

  protected handleError (): void {
    this.setData(null)
  }

  protected removeEventListeners (): void {
    this.removeEventListener('error', this.handleErrorBound)
  }

  protected setSourceFromBlob (blob: Blob): void {
    const src = URL.createObjectURL(blob)

    window.requestAnimationFrame(() => {
      this.setSourceFromImg({
        src
      })
    })
  }

  protected setSourceFromImg (img: ImgData): void {
    this.src = img.src
    this.srcset = img.srcset ?? ''
    this.sizes = img.sizes ?? ''
  }

  protected setSourceFromStruct (struct: Struct): void {
    this.src = this.i18n.format(`${this.origin}${this.url ?? ''}`, struct)
  }
}
