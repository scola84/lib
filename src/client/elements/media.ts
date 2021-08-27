import type { CSSResultGroup, PropertyValues } from 'lit'
import { isArray, isStruct } from '../../common'
import { NodeElement } from './node'
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
  public static styles: CSSResultGroup[] = [
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
    }

    imageElement.style.setProperty('max-width', '100%')
    return imageElement
  }

  protected createSourceElement (source: Struct): HTMLSourceElement {
    const sourceElement = document.createElement('source')

    if (typeof source.media === 'string') {
      sourceElement.media = source.media
    }

    if (typeof source.srcset === 'string') {
      sourceElement.srcset = source.srcset
    } else if (typeof source.src === 'string') {
      sourceElement.src = source.src
    }

    if (typeof source.type === 'string') {
      sourceElement.type = source.type
    }

    sourceElement.style.setProperty('max-width', '100%')
    return sourceElement
  }

  protected handleData (): void {
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
}
