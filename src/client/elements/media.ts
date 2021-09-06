import { isArray, isStruct } from '../../common'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'
import { customElement } from 'lit/decorators.js'
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

  public mediaElement: HTMLAudioElement | HTMLPictureElement | HTMLVideoElement

  protected updaters = MediaElement.updaters

  public constructor () {
    super()

    const mediaElement = this.querySelector<HTMLAudioElement | HTMLPictureElement | HTMLVideoElement>(':scope > audio, :scope > picture, :scope > video')

    if (mediaElement === null) {
      throw new Error('Media element is null')
    }

    this.mediaElement = mediaElement
  }

  public disconnectedCallback (): void {
    if (
      isArray(this.data) ||
      isStruct(this.data) ||
      typeof this.data === 'string'
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

  protected addSource (source: Struct): void {
    if (
      this.mediaElement instanceof HTMLAudioElement ||
      this.mediaElement instanceof HTMLVideoElement
    ) {
      if (typeof source.poster === 'string') {
        this.mediaElement.setAttribute('poster', source.poster)
      }

      this.mediaElement.appendChild(this.createSourceElement(source))
    } else if (this.mediaElement instanceof HTMLPictureElement) {
      if (typeof source.srcset === 'string') {
        this.mediaElement.appendChild(this.createSourceElement(source))
      }

      this.mediaElement.appendChild(this.createImageElement(source))
    }
  }

  protected addSources (sources: unknown[]): void {
    this.mediaElement.innerHTML = ''

    sources.forEach((source) => {
      if (isStruct(source)) {
        this.addSource(source)
      }
    })
  }

  protected createImageElement (source: Struct): HTMLImageElement {
    const imageElement = document.createElement('img')

    if (typeof source.src === 'string') {
      imageElement.src = source.src
    } else if (source.blob instanceof Blob) {
      imageElement.src = URL.createObjectURL(source.blob)
    }

    imageElement.style.setProperty('max-width', '100%')
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

    sourceElement.style.setProperty('max-width', '100%')
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
