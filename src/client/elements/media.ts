import type { Media, MediaData } from '../helpers'
import type { ScolaElement } from './element'

export interface ScolaMediaElement extends ScolaElement {
  currentTime: number

  duration: number

  key: string

  media: Media

  muted: boolean

  origin: string

  paused: boolean

  src: string

  url: string | null

  volume: number

  canPlayType: (type: string) => CanPlayTypeResult

  getData: () => Required<MediaData> | null

  pause: () => void

  play: () => Promise<void>
}
