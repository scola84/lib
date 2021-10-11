import { customElement, property } from 'lit/decorators.js'
import { isArray, isStruct } from '../../common'
import type { IconElement } from './icon'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'
import styles from '../styles/media'

declare global {
  interface HTMLElementEventMap {
    'scola-media-set-time': CustomEvent
    'scola-media-set-volume': CustomEvent
    'scola-media-start': CustomEvent
    'scola-media-stop': CustomEvent
    'scola-media-toggle': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-media': MediaElement
  }

  interface WindowEventMap {
    'scola-media-set-time': CustomEvent
    'scola-media-set-volume': CustomEvent
    'scola-media-start': CustomEvent
    'scola-media-stop': CustomEvent
    'scola-media-toggle': CustomEvent
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

  @property()
  public format = 'mm:ss'

  @property({
    type: Number
  })
  public length?: number

  @property({
    type: Boolean
  })
  public started = false

  @property({
    type: Number
  })
  public time?: number

  @property({
    type: Number
  })
  public volume?: number

  protected audioElement?: HTMLAudioElement

  protected handleCanPlayBound = this.handleCanPlay.bind(this)

  protected handleEndedBound = this.handleEnded.bind(this)

  protected handleSetTimeBound = this.handleSetTime.bind(this)

  protected handleSetVolumeBound = this.handleSetVolume.bind(this)

  protected handleStartBound = this.handleStart.bind(this)

  protected handleStopBound = this.handleStop.bind(this)

  protected handleTimeUpdateBound = this.handleTimeUpdate.bind(this)

  protected handleToggleBound = this.handleToggle.bind(this)

  protected handleVolumeChangeBound = this.handleVolumeChange.bind(this)

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

  public connectedCallback (): void {
    this.setUpMedia()
    super.connectedCallback()
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

    this.tearDownMedia()
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.updateVolume()
    super.firstUpdated(properties)
  }

  public setTime (time: number): void {
    if (this.audioElement instanceof HTMLAudioElement) {
      this.audioElement.currentTime = time
    }

    if (this.videoElement instanceof HTMLVideoElement) {
      this.videoElement.currentTime = time
    }
  }

  public setVolume (volume: number): void {
    if (this.audioElement instanceof HTMLAudioElement) {
      this.audioElement.volume = volume
    }

    if (this.videoElement instanceof HTMLVideoElement) {
      this.videoElement.volume = volume
    }
  }

  public start (): void {
    if (!this.started) {
      if (this.audioElement instanceof HTMLAudioElement) {
        this.audioElement.play().catch(() => {})
      }

      if (this.videoElement instanceof HTMLVideoElement) {
        this.videoElement.play().catch(() => {})
      }

      this.started = true
    }
  }

  public stop (): void {
    if (this.started) {
      if (this.audioElement instanceof HTMLAudioElement) {
        this.audioElement.pause()
      }

      if (this.videoElement instanceof HTMLVideoElement) {
        this.videoElement.pause()
      }

      this.started = false
    }
  }

  public toggle (): void {
    if (this.started) {
      this.stop()
    } else {
      this.start()
    }
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

  protected handleCanPlay (): void {
    this.updateLength()
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

  protected handleEnded (): void {
    this.started = false
  }

  protected handleSetTime (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      if (
        isStruct(event.detail?.data) &&
        typeof event.detail?.data.value === 'number'
      ) {
        this.setTime(event.detail.data.value)
      }
    }
  }

  protected handleSetVolume (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      if (
        isStruct(event.detail?.data) &&
        typeof event.detail?.data.value === 'number'
      ) {
        this.setVolume(event.detail.data.value)
      }
    }
  }

  protected handleStart (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.start()
    }
  }

  protected handleStop (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.stop()
    }
  }

  protected handleTimeUpdate (): void {
    this.updateTime()
  }

  protected handleToggle (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.toggle()
    }
  }

  protected handleVolumeChange (): void {
    this.updateVolume()
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

  protected setUpElementListeners (): void {
    this.addEventListener('scola-media-set-time', this.handleSetTimeBound)
    this.addEventListener('scola-media-set-volume', this.handleSetVolumeBound)
    this.addEventListener('scola-media-start', this.handleStartBound)
    this.addEventListener('scola-media-stop', this.handleStopBound)
    this.addEventListener('scola-media-toggle', this.handleToggleBound)
    super.setUpElementListeners()
  }

  protected setUpMedia (): void {
    if (this.audioElement instanceof HTMLAudioElement) {
      this.audioElement.addEventListener('canplay', this.handleCanPlayBound)
      this.audioElement.addEventListener('ended', this.handleEndedBound)
      this.audioElement.addEventListener('timeupdate', this.handleTimeUpdateBound)
      this.audioElement.addEventListener('volumechange', this.handleVolumeChangeBound)
    }

    if (this.videoElement instanceof HTMLVideoElement) {
      this.videoElement.addEventListener('canplay', this.handleCanPlayBound)
      this.videoElement.addEventListener('ended', this.handleEndedBound)
      this.videoElement.addEventListener('timeupdate', this.handleTimeUpdateBound)
      this.videoElement.addEventListener('volumechange', this.handleVolumeChangeBound)
    }
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-media-set-time', this.handleSetTimeBound)
    window.addEventListener('scola-media-set-volume', this.handleSetVolumeBound)
    window.addEventListener('scola-media-start', this.handleStartBound)
    window.addEventListener('scola-media-stop', this.handleStopBound)
    window.addEventListener('scola-media-toggle', this.handleToggleBound)
    super.setUpWindowListeners()
  }

  protected tearDownMedia (): void {
    if (this.audioElement instanceof HTMLAudioElement) {
      this.audioElement.removeEventListener('canplay', this.handleCanPlayBound)
      this.audioElement.removeEventListener('ended', this.handleEndedBound)
      this.audioElement.removeEventListener('timeupdate', this.handleTimeUpdateBound)
      this.audioElement.removeEventListener('volumechange', this.handleVolumeChangeBound)
    }

    if (this.videoElement instanceof HTMLVideoElement) {
      this.videoElement.removeEventListener('canplay', this.handleCanPlayBound)
      this.videoElement.removeEventListener('ended', this.handleEndedBound)
      this.videoElement.removeEventListener('timeupdate', this.handleTimeUpdateBound)
      this.videoElement.removeEventListener('volumechange', this.handleVolumeChangeBound)
    }
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-media-set-time', this.handleSetTimeBound)
    window.removeEventListener('scola-media-set-volume', this.handleSetVolumeBound)
    window.removeEventListener('scola-media-start', this.handleStartBound)
    window.removeEventListener('scola-media-stop', this.handleStopBound)
    window.removeEventListener('scola-media-toggle', this.handleToggleBound)
    super.tearDownWindowListeners()
  }

  protected updateLength (): void {
    if (this.audioElement instanceof HTMLAudioElement) {
      this.length = this.audioElement.duration
    }

    if (this.videoElement instanceof HTMLVideoElement) {
      this.length = this.videoElement.duration
    }
  }

  protected updateTime (): void {
    if (this.audioElement instanceof HTMLAudioElement) {
      this.time = this.audioElement.currentTime
    }

    if (this.videoElement instanceof HTMLVideoElement) {
      this.time = this.videoElement.currentTime
    }
  }

  protected updateVolume (): void {
    if (this.audioElement instanceof HTMLAudioElement) {
      this.volume = this.audioElement.volume
    }

    if (this.videoElement instanceof HTMLVideoElement) {
      this.volume = this.videoElement.volume
    }
  }
}
