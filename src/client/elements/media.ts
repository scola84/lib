import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { isArray, isObject } from '../../common'
import { NodeElement } from './node'
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

  @property()
  public name?: string

  public mediaElement?: HTMLElement | null

  protected updaters = MediaElement.updaters

  public constructor () {
    super()
    this.mediaElement = this.querySelector<HTMLElement>('audio, picture, video')
  }

  public update (properties: PropertyValues): void {
    if (properties.has('data')) {
      if (
        isObject(this.data) &&
        typeof this.name === 'string'
      ) {
        const value = this.data[this.name]

        if (typeof value === 'string') {
          this.addSources([{
            src: value
          }])
        } else if (isObject(value)) {
          this.addSources([value])
        } else if (isArray(value)) {
          this.addSources(value)
        }
      }
    }

    super.update(properties)
  }

  protected addSource (source: Record<string, unknown>): void {
    if (this.mediaElement instanceof HTMLPictureElement) {
      if (typeof source.srcset === 'string') {
        this.mediaElement.appendChild(this.createSourceElement(source))
      }

      this.mediaElement.appendChild(this.createImageElement(source))
    } else if (
      this.mediaElement instanceof HTMLAudioElement ||
      this.mediaElement instanceof HTMLVideoElement
    ) {
      if (typeof source.poster === 'string') {
        this.mediaElement.setAttribute('poster', source.poster)
      }

      this.mediaElement.appendChild(this.createSourceElement(source))
    }
  }

  protected addSources (sources: unknown[]): void {
    if (this.mediaElement instanceof HTMLElement) {
      this.mediaElement.innerHTML = ''

      sources.forEach((source) => {
        if (isObject(source)) {
          this.addSource(source)
        }
      })
    }
  }

  protected createImageElement (source: Record<string, unknown>): HTMLImageElement {
    const imageElement = document.createElement('img')

    if (typeof source.src === 'string') {
      imageElement.src = source.src
    }

    imageElement.style.setProperty('max-width', '100%')
    return imageElement
  }

  protected createSourceElement (source: Record<string, unknown>): HTMLSourceElement {
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
}
