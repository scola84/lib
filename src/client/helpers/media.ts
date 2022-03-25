import { I18n, get, isArray, isStruct } from '../../common'
import type { ScolaMediaElement } from '../elements'
import type { Struct } from '../../common'

export interface MediaData extends Struct {
  currentTime?: number
  duration?: number
  length?: Date
  muted?: boolean
  playing?: boolean
  src: string
  time?: Date
  volume?: number
}

export class Media {
  public element: ScolaMediaElement

  public i18n: I18n

  protected handleCanPlayBound = this.handleCanPlay.bind(this)

  protected handleDurationChangeBound = this.handleDurationchange.bind(this)

  protected handlePauseBound = this.handlePause.bind(this)

  protected handlePlayBound = this.handlePlay.bind(this)

  protected handleTimeupdateBound = this.handleTimeupdate.bind(this)

  protected handleVolumechangeBound = this.handleVolumechange.bind(this)

  public constructor (element: ScolaMediaElement) {
    this.element = element
    this.i18n = new I18n()
  }

  public clear (): void {
    if (this.element.src.startsWith('blob:')) {
      URL.revokeObjectURL(this.element.src)
    }
  }

  public connect (): void {
    this.addEventListeners()
  }

  public disconnect (): void {
    this.removeEventListeners()
    this.clear()
  }

  public getData (): Required<MediaData> | null {
    if (
      Number.isNaN(this.element.duration) ||
      this.element.duration === Infinity
    ) {
      return null
    }

    return {
      currentTime: Math.round(this.element.currentTime * 1000),
      duration: Math.round(this.element.duration * 1000),
      length: new Date(this.element.duration * 1000),
      muted: this.element.muted,
      playing: !this.element.paused,
      src: this.element.src,
      time: new Date(this.element.currentTime * 1000),
      volume: this.element.volume
    }
  }

  public isMedia (media: unknown): media is MediaData {
    return (
      isStruct(media) &&
      typeof media.src === 'string'
    )
  }

  public jumpTime (delta: number): void {
    const time = this.element.currentTime + (delta / 1000)

    if (time < 0) {
      this.element.currentTime = 0
    } else if (time > this.element.duration) {
      this.element.currentTime = this.element.duration
    } else {
      this.element.currentTime = time
    }

    this.element.update()
  }

  public setData (data: unknown): void {
    this.clear()

    if (typeof data === 'string') {
      this.setSourceFromMedia({
        src: data
      })
    } else if (
      data instanceof Blob &&
      data.type.startsWith(this.element.nodeName.toLowerCase())
    ) {
      this.setSourceFromBlob(data)
    } else if (isArray(data)) {
      this.setSourceFromArray(data)
    } else if (this.isMedia(data)) {
      this.setSourceFromMedia(data)
    } else if ((
      isStruct(data) &&
      this.element.url !== null
    ) && (
      this.element.key === null ||
      String(get(data, this.element.key.split('.')))
        .startsWith(this.element.nodeName.toLowerCase())
    )) {
      this.setSourceFromStruct(data)
    } else {
      this.element.removeAttribute('src')
    }
  }

  public setMute (mute: boolean): void {
    this.element.muted = mute
  }

  public setTime (time: number): void {
    this.element.currentTime = time / 1000
  }

  public setVolume (volume: number): void {
    this.element.muted = false
    this.element.volume = volume
  }

  public toObject (): Struct {
    return {
      src: this.element.src
    }
  }

  public toggle (): void {
    if (this.element.paused) {
      this.element.play().catch(() => {})
    } else {
      this.element.pause()
    }
  }

  protected addEventListeners (): void {
    this.element.addEventListener('canplay', this.handleCanPlayBound)
    this.element.addEventListener('duration', this.handleDurationChangeBound)
    this.element.addEventListener('pause', this.handlePauseBound)
    this.element.addEventListener('play', this.handlePlayBound)
    this.element.addEventListener('timeupdate', this.handleTimeupdateBound)
    this.element.addEventListener('volumechange', this.handleVolumechangeBound)
  }

  protected handleCanPlay (): void {
    this.element.update()
  }

  protected handleDurationchange (): void {
    this.element.update()
  }

  protected handlePause (): void {
    this.element.update()
  }

  protected handlePlay (): void {
    this.element.update()
  }

  protected handleTimeupdate (): void {
    this.element.update()
  }

  protected handleVolumechange (): void {
    this.element.update()
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('canplay', this.handleCanPlayBound)
    this.element.removeEventListener('duration', this.handleDurationChangeBound)
    this.element.removeEventListener('pause', this.handlePauseBound)
    this.element.removeEventListener('play', this.handlePlayBound)
    this.element.removeEventListener('timeupdate', this.handleTimeupdateBound)
    this.element.removeEventListener('volumechange', this.handleVolumechangeBound)
  }

  protected setSourceFromArray (sources: unknown[]): void {
    sources.find((source) => {
      if (
        this.isMedia(source) &&
        typeof source.type === 'string' &&
        this.element.canPlayType(source.type) !== ''
      ) {
        this.setSourceFromMedia(source)
        return true
      }

      return false
    })
  }

  protected setSourceFromBlob (blob: Blob): void {
    const src = URL.createObjectURL(blob)

    window.requestAnimationFrame(() => {
      this.setSourceFromMedia({
        src
      })
    })
  }

  protected setSourceFromMedia (media: MediaData): void {
    this.element.src = media.src

    if (
      this.element instanceof HTMLVideoElement &&
      typeof media.poster === 'string'
    ) {
      this.element.poster = media.poster
    }

    this.element.update()
  }

  protected setSourceFromStruct (struct: Struct): void {
    this.element.src = this.i18n.format(`${this.element.origin}${this.element.url ?? ''}`, struct)
  }
}
