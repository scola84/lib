import { customElement, property } from 'lit/decorators.js'
import { isArray, isStruct } from '../../common'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'
import styles from '../styles/media'

declare global {
  interface HTMLElementTagNameMap {
    'scola-media': MediaElement
  }
}

@customElement('scola-media')
export class MediaElement extends NodeElement {
  public static styles = [
    ...NodeElement.styles,
    styles
  ]

  @property({
    type: Boolean
  })
  public center?: boolean

  public audioElement?: HTMLAudioElement

  public pictureElement?: HTMLPictureElement

  public videoElement?: HTMLVideoElement

  protected updaters = MediaElement.updaters

  public constructor () {
    super()

    this
      .querySelectorAll<HTMLAudioElement | HTMLPictureElement | HTMLVideoElement>(':scope > audio, :scope > picture, :scope > video')
      .forEach((mediaElement) => {
        if (mediaElement instanceof HTMLAudioElement) {
          this.audioElement = mediaElement
        } else if (mediaElement instanceof HTMLPictureElement) {
          this.pictureElement = mediaElement
        } else if (mediaElement instanceof HTMLVideoElement) {
          this.videoElement = mediaElement
        }
      })
  }

  public disconnectedCallback (): void {
    if (
      !this.isConnected && (
        isArray(this.data) ||
        isStruct(this.data) ||
        typeof this.data === 'string'
      )
    ) {
      this.removeChildren()
    }

    super.disconnectedCallback()
  }

  public update (properties: PropertyValues): void {
    if (properties.has('data')) {
      this.handleData()
    }

    super.update(properties)
  }

  protected addAudioSource (source: Struct): void {
    if (this.audioElement instanceof HTMLAudioElement) {
      this.audioElement.innerHTML = ''

      if (typeof source.poster === 'string') {
        this.audioElement.setAttribute('poster', source.poster)
      }

      this.audioElement.appendChild(this.createSourceElement(source))
    }
  }

  protected addImageSource (source: Struct): void {
    if (this.pictureElement instanceof HTMLPictureElement) {
      this.pictureElement.innerHTML = ''

      if (typeof source.srcset === 'string') {
        this.pictureElement.appendChild(this.createSourceElement(source))
      }

      this.pictureElement.appendChild(this.createImageElement(source))
    }
  }

  protected addSource (source: Struct): void {
    if (typeof source.type === 'string') {
      if (source.type.startsWith('audio')) {
        this.addAudioSource(source)
      } else if (source.type.startsWith('image')) {
        this.addImageSource(source)
      } else if (source.type.startsWith('video')) {
        this.addVideoSource(source)
      }
    }
  }

  protected addSources (sources: unknown[]): void {
    sources.forEach((source) => {
      if (isStruct(source)) {
        this.addSource(source)
      }
    })
  }

  protected addVideoSource (source: Struct): void {
    if (this.videoElement instanceof HTMLVideoElement) {
      this.videoElement.innerHTML = ''

      if (typeof source.poster === 'string') {
        this.videoElement.setAttribute('poster', source.poster)
      }

      this.videoElement.appendChild(this.createSourceElement(source))
    }
  }

  protected centerChildElement (childElement: HTMLElement, ratio: number): void {
    if (Number(ratio) < 1) {
      childElement.style.setProperty('max-width', '100%')
      this.halign = undefined
      this.valign = 'center'
    } else {
      childElement.style.setProperty('max-height', '100%')
      this.halign = 'center'
      this.valign = undefined
    }
  }

  protected createImageElement (source: Struct): HTMLImageElement {
    const imageElement = document.createElement('img')

    if (typeof source.src === 'string') {
      imageElement.src = source.src
    } else if (source.blob instanceof Blob) {
      imageElement.src = URL.createObjectURL(source.blob)
    }

    if (this.center === true) {
      this.centerChildElement(imageElement, Number(source.ratio))
    }

    return imageElement
  }

  protected createSourceElement (source: Struct): HTMLSourceElement {
    const sourceElement = document.createElement('source')

    if (typeof source.media === 'string') {
      sourceElement.media = source.media
    }

    if (typeof source.type === 'string') {
      sourceElement.type = source.type
    }

    if (typeof source.src === 'string') {
      sourceElement.src = source.src
    } else if (typeof source.srcset === 'string') {
      sourceElement.srcset = source.srcset
    } else if (source.blob instanceof Blob) {
      sourceElement.src = URL.createObjectURL(source.blob)
      sourceElement.type = source.blob.type
    }

    if (this.center === true) {
      this.centerChildElement(sourceElement, Number(source.ratio))
    }

    return sourceElement
  }

  protected handleData (): void {
    this.removeChildren()

    if (isArray(this.data)) {
      this.addSources(this.data)
    } else if (isStruct(this.data)) {
      this.addSources([this.data])
    } else if (typeof this.data === 'string') {
      this.addSources([{
        src: this.data
      }])
    }
  }

  protected removeChildren (): void {
    this
      .querySelectorAll<HTMLImageElement | HTMLSourceElement>('img, source')
      .forEach((element) => {
        element.remove()

        if (element.src.startsWith('blob:')) {
          URL.revokeObjectURL(element.src)
        }

        if (element.srcset.startsWith('blob:')) {
          URL.revokeObjectURL(element.srcset)
        }
      })
  }
}
