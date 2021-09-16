import { customElement, property } from 'lit/decorators.js'
import { isArray, isStruct } from '../../common'
import type { IconElement } from './icon'
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

  protected audioElement?: HTMLAudioElement

  protected iconElement: IconElement | null

  protected pictureElement?: HTMLPictureElement

  protected updaters = MediaElement.updaters

  protected videoElement?: HTMLVideoElement

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

    this.iconElement = this.querySelector<IconElement>(':scope > scola-icon')
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
      if (typeof source.poster === 'string') {
        this.audioElement.setAttribute('poster', source.poster)
      }

      this.audioElement.appendChild(this.createSourceElement(source))
    }
  }

  protected addImageSource (source: Struct): void {
    if (this.pictureElement instanceof HTMLPictureElement) {
      if (typeof source.srcset === 'string') {
        this.pictureElement.appendChild(this.createSourceElement(source))
      }

      const imageElement = this.pictureElement.appendChild(this.createImageElement(source))

      if (this.center === true) {
        this.centerElement(this.pictureElement, imageElement).catch(() => {})
      }
    }
  }

  protected addSourceFromFile (file: File): void {
    this.addSourceFromStruct({
      src: URL.createObjectURL(file),
      type: file.type
    })
  }

  protected addSourceFromStruct (struct: Struct): void {
    this.removeChildren()

    if (typeof struct.type === 'string') {
      if (struct.type.startsWith('audio')) {
        this.addAudioSource(struct)
        this.setIcon('audio', struct)
      } else if (struct.type.startsWith('image')) {
        this.addImageSource(struct)
        this.setIcon('image', struct)
      } else if (struct.type.startsWith('video')) {
        this.addVideoSource(struct)
        this.setIcon('video', struct)
      } else {
        this.setIcon('other', struct)
      }
    }
  }

  protected addSources (sources: unknown[]): void {
    sources.forEach((source) => {
      if (isStruct(source)) {
        this.addSourceFromStruct(source)
      }
    })
  }

  protected addVideoSource (source: Struct): void {
    if (this.videoElement instanceof HTMLVideoElement) {
      if (typeof source.poster === 'string') {
        this.videoElement.setAttribute('poster', source.poster)
      }

      this.videoElement.appendChild(this.createSourceElement(source))

      if (this.center === true) {
        this.centerElement(this.videoElement).catch(() => {})
      }
    }
  }

  protected async calculateAspectRatio (element: HTMLElement): Promise<number> {
    return new Promise((resolve) => {
      const clonedElement = document.body.appendChild(element.cloneNode(true))

      if (clonedElement instanceof HTMLElement) {
        clonedElement.style.setProperty('opacity', '0')
        clonedElement.style.setProperty('position', 'absolute')
        clonedElement.style.setProperty('width', '16px')

        clonedElement.onload = () => {
          const {
            height = 0,
            width = 0
          } = clonedElement.getBoundingClientRect()

          if (height > 0) {
            resolve(width / height)
          } else {
            resolve(1)
          }

          clonedElement.onload = null
          clonedElement.onloadeddata = null
          clonedElement.remove()
        }

        clonedElement.onloadeddata = clonedElement.onload
      }
    })
  }

  protected async centerElement (element: HTMLElement, referenceElement?: HTMLElement): Promise<void> {
    const aspectRatio = await this.calculateAspectRatio(referenceElement ?? element)

    Array
      .from(element.children)
      .forEach((child) => {
        if (child instanceof HTMLElement) {
          if (aspectRatio < 1) {
            child.style.setProperty('max-width', '100%')
          } else {
            child.style.setProperty('max-height', '100%')
          }
        }
      })

    if (aspectRatio < 1) {
      this.halign = undefined
      this.valign = 'center'
      element.style.setProperty('max-width', '100%')
    } else {
      this.halign = 'center'
      this.valign = undefined
      element.style.setProperty('max-height', '100%')
    }
  }

  protected createImageElement (source: Struct): HTMLImageElement {
    const imageElement = document.createElement('img')

    if (typeof source.src === 'string') {
      imageElement.src = source.src
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
    }

    return sourceElement
  }

  protected handleData (): void {
    this.removeChildren()

    if (isArray(this.data)) {
      this.addSources(this.data)
    } else if (isStruct(this.data)) {
      if (this.data.file instanceof File) {
        this.addSourceFromFile(this.data.file)
      } else {
        this.addSourceFromStruct(this.data)
      }
    } else if (typeof this.data === 'string') {
      this.addSourceFromStruct({
        src: this.data
      })
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

  protected setIcon (type: string, struct: Struct): void {
    if (typeof struct.type === 'string') {
      if (this.iconElement?.as?.includes(type) === true) {
        this.iconElement.setAttribute('name', struct.type.split('/').pop() ?? '')
      } else {
        this.iconElement?.removeAttribute('name')
      }
    }
  }
}
