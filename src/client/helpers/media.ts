import { isArray, isStruct } from '../../common'
import type { ScolaAudioElement } from '../elements/audio'
import type { ScolaVideoElement } from '../elements/video'
import type { Struct } from '../../common'

export class ScolaMedia {
  public element: ScolaAudioElement | ScolaVideoElement

  public constructor (element: ScolaAudioElement | ScolaVideoElement) {
    this.element = element
  }

  public destroy (): void {
    if (this.element.src.startsWith('blob:')) {
      URL.revokeObjectURL(this.element.src)
    }
  }

  public getData (): Struct {
    return {
      src: this.element.src
    }
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
  }
}
