import type { Media, MediaData } from '../helpers'
import type { ScolaElement } from './element'

export interface ScolaMediaElement extends ScolaElement {
  currentTime: number

  duration: number

  media: Media

  muted: boolean

  paused: boolean

  src: string

  volume: number

  canPlayType: (type: string) => CanPlayTypeResult

  getData: () => MediaData | null

  pause: () => void

  play: () => Promise<void>
}
