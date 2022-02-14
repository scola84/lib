import { isArray, isStruct } from '../../common'
import type { ScolaMediaElement } from '../elements/media'
import type { Struct } from '../../common'

export class ScolaMedia {
  public element: ScolaMediaElement

  protected handleCanPlayBound = this.handleCanPlay.bind(this)

  protected handleDurationChangeBound = this.handleDurationchange.bind(this)

  protected handlePauseBound = this.handlePause.bind(this)

  protected handlePlayBound = this.handlePlay.bind(this)

  protected handleTimeupdateBound = this.handleTimeupdate.bind(this)

  protected handleVolumechangeBound = this.handleVolumechange.bind(this)

  public constructor (element: ScolaMediaElement) {
    this.element = element
  }

  public connect (): void {
    this.addEventListeners()
  }

  public disconnect (): void {
    if (this.element.src.startsWith('blob:')) {
      URL.revokeObjectURL(this.element.src)
    }

    this.removeEventListeners()
  }

  public getData (): Struct {
    return {
      src: this.element.src
    }
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
    if (isArray(data)) {
      this.setSourceFromArray(data)
    } else if (isStruct(data)) {
      if (data.file instanceof File) {
        this.setSourceFromFile(data.file)
      } else {
        this.setSourceFromStruct(data)
      }
    } else if (typeof data === 'string') {
      this.setSourceFromStruct({
        src: data
      })
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
        isStruct(source) &&
        typeof source.type === 'string' &&
        this.element.canPlayType(source.type) !== ''
      ) {
        this.setSourceFromStruct(source)
        return true
      }

      return false
    })
  }

  protected setSourceFromFile (file: File): void {
    this.setSourceFromStruct({
      src: URL.createObjectURL(file)
    })
  }

  protected setSourceFromStruct (struct: Struct): void {
    if (typeof struct.src === 'string') {
      this.element.src = struct.src
    }

    if (
      typeof struct.poster === 'string' &&
      this.element instanceof HTMLVideoElement
    ) {
      this.element.poster = struct.poster
    }

    this.element.update()
  }
}
