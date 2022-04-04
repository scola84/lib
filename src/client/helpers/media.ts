import { I18n, isArray, isFile, isStruct } from '../../common'
import type { ScolaFileProperties, Struct } from '../../common'
import type { ScolaMediaElement } from '../elements'

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

  public isBlob (value: unknown): value is Blob {
    return (
      value instanceof Blob &&
      value.type.startsWith('image/')
    )
  }

  public isData (value: unknown): value is MediaData {
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

    if (isArray(data)) {
      this.setSourceFromArray(data)
    } else if (this.isData(data)) {
      this.setSourceFromData(data)
    } else if (this.isBlob(data)) {
      this.setSourceFromBlob(data)
    } else if (
      isStruct(data) &&
      this.isBlob(data[this.element.key])
    ) {
      this.setSourceFromBlob(data[this.element.key] as Blob)
    } else if (this.isFile(data)) {
      this.setSourceFromStruct(data)
    } else if (
      isStruct(data) &&
      this.isFile(data[this.element.key])
    ) {
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

  protected setSourceFromArray (data: unknown[]): void {
    data.find((datum) => {
      if (
        this.isData(datum) &&
        typeof datum.type === 'string' &&
        this.element.canPlayType(datum.type) !== ''
      ) {
        this.setSourceFromData(datum)
        return true
      }

      return false
    })
  }

  protected setSourceFromBlob (blob: Blob): void {
    const src = URL.createObjectURL(blob)

    window.requestAnimationFrame(() => {
      this.setSourceFromData({
        src
      })
    })
  }

  protected setSourceFromData (data: MediaData): void {
    this.element.src = data.src

    if (
      this.element instanceof HTMLVideoElement &&
      typeof data.poster === 'string'
    ) {
      this.element.poster = data.poster
    }

    this.element.update()
  }

  protected setSourceFromStruct (struct: Struct): void {
    this.element.src = this.i18n.format(`${this.element.origin}${this.element.url ?? ''}`, struct)
  }
}
