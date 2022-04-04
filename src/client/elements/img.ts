import { I18n, isFile, isStruct, toString } from '../../common'
import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaFileProperties, Struct } from '../../common'
import type { ScolaElement } from './element'

export interface ImgData extends Struct {
  sizes?: string
  src: string
  srcset?: string
}

export class ScolaImageElement extends HTMLImageElement implements ScolaElement {
  public static origin = window.location.origin

  public i18n: I18n

  public key: string

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

  public isBlob (value: unknown): value is Blob {
    return (
      value instanceof Blob &&
      value.type.startsWith('image/')
    )
  }

  public isData (value: unknown): value is ImgData {
    return (
      isStruct(value) &&
      typeof value.src === 'string'
    )
  }

  public isFile (value: unknown): value is ScolaFileProperties {
    return (
      isFile(value) &&
      value.type.startsWith('image/')
    )
  }

  public reset (): void {
    this.key = this.getAttribute('sc-key') ?? ''
    this.url = this.getAttribute('sc-url')
  }

  public setData (data: unknown): void {
    this.clear()

    if (this.isData(data)) {
      this.setSourceFromData(data)
    } else if (this.isBlob(data)) {
      this.setSourceFromBlob(data)
    } else if (
      isStruct(data) &&
      this.isBlob(data[this.key])
    ) {
      this.setSourceFromBlob(data[this.key] as Blob)
    } else if (this.isFile(data)) {
      this.setSourceFromStruct(data)
    } else if (
      isStruct(data) &&
      this.isFile(data[this.key])
    ) {
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

  protected handleError (error: unknown): void {
    this.setData(null)

    this.propagator.dispatch('error', [{
      code: 'err_img',
      message: toString(error)
    }])
  }

  protected removeEventListeners (): void {
    this.removeEventListener('error', this.handleErrorBound)
  }

  protected setSourceFromBlob (blob: Blob): void {
    const src = URL.createObjectURL(blob)

    window.requestAnimationFrame(() => {
      this.setSourceFromData({
        src
      })
    })
  }

  protected setSourceFromData (data: ImgData): void {
    this.src = data.src
    this.srcset = data.srcset ?? ''
    this.sizes = data.sizes ?? ''
  }

  protected setSourceFromStruct (struct: Struct): void {
    this.src = this.i18n.format(`${this.origin}${this.url ?? ''}`, struct)
  }
}
