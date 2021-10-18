import { customElement, property } from 'lit/decorators.js'
import { isArray, isStruct } from '../../common'
import type { IconElement } from './icon'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'
import styles from '../styles/media'

declare global {
  interface HTMLElementEventMap {
    'scola-media-ended': CustomEvent
    'scola-media-fullscreen': CustomEvent
    'scola-media-jump': CustomEvent
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
    'scola-media-fullscreen': CustomEvent
    'scola-media-jump': CustomEvent
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
  public length = 0

  @property({
    reflect: true
  })
  public orientation: 'landscape' | 'portrait'

  @property({
    type: Boolean
  })
  public seeking = false

  @property({
    type: Boolean
  })
  public started = false

  @property({
    type: Number
  })
  public time = 0

  @property({
    type: Number
  })
  public volume = 0.5

  protected handleCanPlayBound = this.handleCanPlay.bind(this)

  protected handleDurationChangeBound = this.handleDurationchange.bind(this)

  protected handleEndedBound = this.handleEnded.bind(this)

  protected handleFullscreenBound = this.handleFullscreen.bind(this)

  protected handleJumpBound = this.handleJump.bind(this)

  protected handleSeekedBound = this.handleSeeked.bind(this)

  protected handleSeekingBound = this.handleSeeking.bind(this)

  protected handleSetTimeBound = this.handleSetTime.bind(this)

  protected handleSetVolumeBound = this.handleSetVolume.bind(this)

  protected handleStartBound = this.handleStart.bind(this)

  protected handleStopBound = this.handleStop.bind(this)

  protected handleTimeUpdateBound = this.handleTimeUpdate.bind(this)

  protected handleToggleBound = this.handleToggle.bind(this)

  protected handleVolumeChangeBound = this.handleVolumeChange.bind(this)

  protected iconElement: IconElement | null

  protected mediaElement: HTMLImageElement | HTMLMediaElement | null

  protected pictureElement?: HTMLPictureElement

  protected updaters = MediaElement.updaters

  public constructor () {
    super()
    this.iconElement = this.querySelector<IconElement>(':scope > scola-icon')
    this.mediaElement = this.querySelector<HTMLImageElement | HTMLMediaElement>(':scope > audio, :scope > img, :scope > video')
  }

  public connectedCallback (): void {
    this.setUpMedia()
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    this.tearDownMedia()
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.updateVolume()
    super.firstUpdated(properties)
  }

  public jump (delta: number): void {
    const time = this.time + delta

    if (time < 0) {
      this.setTime(0)
    } else if (time > this.length) {
      this.setTime(this.length)
    } else {
      this.setTime(time)
    }
  }

  public setTime (time: number): void {
    if (this.mediaElement instanceof HTMLMediaElement) {
      this.mediaElement.currentTime = time
      this.time = time
    }
  }

  public setVolume (volume: number): void {
    if (this.mediaElement instanceof HTMLMediaElement) {
      this.mediaElement.volume = volume
      this.volume = volume
    }
  }

  public start (): void {
    if (!this.started) {
      if (this.mediaElement instanceof HTMLMediaElement) {
        this.mediaElement.play().catch(() => {})
      }

      this.started = true
    }
  }

  public stop (): void {
    if (this.started) {
      if (this.mediaElement instanceof HTMLMediaElement) {
        this.mediaElement.pause()
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

  protected handleCanPlay (): void {
    this.updateLength()
  }

  protected handleData (): void {
    if (isArray(this.data)) {
      this.setSourceFromArray(this.data)
    } else if (isStruct(this.data)) {
      if (this.data.file instanceof File) {
        this.setSourceFromFile(this.data.file)
      } else {
        this.setSourceFromStruct(this.data)
      }
    } else if (typeof this.data === 'string') {
      this.setSourceFromStruct({
        src: this.data
      })
    }
  }

  protected handleDurationchange (): void {
    this.updateLength()
  }

  protected handleEnded (): void {
    this.started = false
    this.dispatchEvents('scola-media-ended')
  }

  protected handleFullscreen (): void {
    if (document.fullscreenElement === null) {
      this.mediaElement?.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  protected handleJump (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      if (
        isStruct(event.detail?.data) &&
        event.detail?.data.delta !== undefined
      ) {
        this.jump(Number(event.detail.data.delta))
      }
    }
  }

  protected handleSeeked (): void {
    this.seeking = false
  }

  protected handleSeeking (): void {
    this.seeking = true
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

  protected setAVSource (source: Struct, type: 'audio' | 'video'): void {
    if (this.mediaElement === null) {
      this.mediaElement = this.appendChild(document.createElement(type))
    }

    if (this.mediaElement instanceof HTMLMediaElement) {
      if (typeof source.src === 'string') {
        this.mediaElement.src = source.src
      }

      if (typeof source.poster === 'string') {
        this.mediaElement.setAttribute('poster', source.poster)
      }

      this.length = 0
      this.started = false
      this.setTime(0)
    }

    if (this.center === true) {
      this.updateOrientation(this.mediaElement)
    }
  }

  protected setIcon (struct: Struct, type: string): void {
    if (typeof struct.type === 'string') {
      if (this.iconElement?.as?.includes(type) === true) {
        this.iconElement.setAttribute('name', struct.type.split('/').pop() ?? '')
      } else {
        this.iconElement?.removeAttribute('name')
      }
    }
  }

  protected setImageSource (source: Struct): void {
    if (this.mediaElement === null) {
      this.mediaElement = this.appendChild(document.createElement('img'))
    }

    if (this.mediaElement instanceof HTMLImageElement) {
      if (typeof source.srcset === 'string') {
        this.mediaElement.srcset = source.srcset
      } else if (typeof source.src === 'string') {
        this.mediaElement.src = source.src
      }

      if (typeof source.sizes === 'string') {
        this.mediaElement.sizes = source.sizes
      }
    }

    if (this.center === true) {
      this.updateOrientation(this.mediaElement)
    }
  }

  protected setSourceFromArray (sources: unknown[]): void {
    sources.find((source) => {
      if (
        isStruct(source) &&
        typeof source.type === 'string' &&
        this.mediaElement instanceof HTMLMediaElement &&
        this.mediaElement.canPlayType(source.type) !== ''
      ) {
        this.setSourceFromStruct(source)
        return true
      }

      return false
    })
  }

  protected setSourceFromFile (file: File): void {
    this.setSourceFromStruct({
      src: URL.createObjectURL(file),
      type: file.type
    })
  }

  protected setSourceFromStruct (struct: Struct): void {
    if (typeof struct.type === 'string') {
      const type = struct.type
        .split('/')
        .shift()

      switch (type) {
        case 'audio':
        case 'video':
          this.setAVSource(struct, type)
          this.setIcon(struct, type)
          break
        case 'image':
          this.setImageSource(struct)
          this.setIcon(struct, type)
          break
        default:
          this.setIcon(struct, 'other')
          break
      }
    }
  }

  protected setUpElementListeners (): void {
    this.addEventListener('scola-media-fullscreen', this.handleFullscreenBound)
    this.addEventListener('scola-media-jump', this.handleJumpBound)
    this.addEventListener('scola-media-set-time', this.handleSetTimeBound)
    this.addEventListener('scola-media-set-volume', this.handleSetVolumeBound)
    this.addEventListener('scola-media-start', this.handleStartBound)
    this.addEventListener('scola-media-stop', this.handleStopBound)
    this.addEventListener('scola-media-toggle', this.handleToggleBound)
    super.setUpElementListeners()
  }

  protected setUpMedia (): void {
    if (this.mediaElement instanceof HTMLMediaElement) {
      this.mediaElement.addEventListener('canplay', this.handleCanPlayBound)
      this.mediaElement.addEventListener('durationchange', this.handleDurationChangeBound)
      this.mediaElement.addEventListener('ended', this.handleEndedBound)
      this.mediaElement.addEventListener('seeked', this.handleSeekedBound)
      this.mediaElement.addEventListener('seeking', this.handleSeekingBound)
      this.mediaElement.addEventListener('timeupdate', this.handleTimeUpdateBound)
      this.mediaElement.addEventListener('volumechange', this.handleVolumeChangeBound)
    }
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-media-fullscreen', this.handleFullscreenBound)
    window.addEventListener('scola-media-jump', this.handleJumpBound)
    window.addEventListener('scola-media-set-time', this.handleSetTimeBound)
    window.addEventListener('scola-media-set-volume', this.handleSetVolumeBound)
    window.addEventListener('scola-media-start', this.handleStartBound)
    window.addEventListener('scola-media-stop', this.handleStopBound)
    window.addEventListener('scola-media-toggle', this.handleToggleBound)
    super.setUpWindowListeners()
  }

  protected tearDownMedia (): void {
    if (
      !this.isConnected &&
      this.mediaElement?.src.startsWith('blob:') === true
    ) {
      URL.revokeObjectURL(this.mediaElement.src)
    }

    if (this.mediaElement instanceof HTMLMediaElement) {
      this.mediaElement.removeEventListener('canplay', this.handleCanPlayBound)
      this.mediaElement.removeEventListener('durationchange', this.handleDurationChangeBound)
      this.mediaElement.removeEventListener('ended', this.handleEndedBound)
      this.mediaElement.removeEventListener('seeked', this.handleSeekedBound)
      this.mediaElement.removeEventListener('seeking', this.handleSeekingBound)
      this.mediaElement.removeEventListener('timeupdate', this.handleTimeUpdateBound)
      this.mediaElement.removeEventListener('volumechange', this.handleVolumeChangeBound)
    }
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-media-fullscreen', this.handleFullscreenBound)
    window.removeEventListener('scola-media-jump', this.handleJumpBound)
    window.removeEventListener('scola-media-set-time', this.handleSetTimeBound)
    window.removeEventListener('scola-media-set-volume', this.handleSetVolumeBound)
    window.removeEventListener('scola-media-start', this.handleStartBound)
    window.removeEventListener('scola-media-stop', this.handleStopBound)
    window.removeEventListener('scola-media-toggle', this.handleToggleBound)
    super.tearDownWindowListeners()
  }

  protected updateLength (): void {
    if (this.mediaElement instanceof HTMLMediaElement) {
      this.length = this.mediaElement.duration
    }
  }

  protected updateOrientation (element: HTMLElement): void {
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
          if ((width / height) > 1) {
            this.orientation = 'landscape'
          } else {
            this.orientation = 'portrait'
          }
        } else {
          this.orientation = 'portrait'
        }

        clonedElement.onload = null
        clonedElement.onloadeddata = null
        clonedElement.remove()
      }

      clonedElement.onloadeddata = clonedElement.onload
    }
  }

  protected updateTime (): void {
    if (this.mediaElement instanceof HTMLMediaElement) {
      this.time = this.mediaElement.currentTime
    }
  }

  protected updateVolume (): void {
    if (this.mediaElement instanceof HTMLMediaElement) {
      this.volume = this.mediaElement.volume
    }
  }
}
