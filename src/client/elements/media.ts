import type { Media } from '../helpers'
import type { ScolaElement } from './element'

export interface ScolaMediaElement extends ScolaElement {
  currentTime: number

  currentTimeAsString: string

  duration: number

  durationAsString: string

  key: string

  media: Media

  muted: boolean

  origin: string

  paused: boolean

  src: string

  url: string | null

  volume: number

  canPlayType: (type: string) => CanPlayTypeResult

  notify: () => void

  pause: () => void

  play: () => Promise<void>
}
