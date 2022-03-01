import type { ScolaMedia, ScolaMediaData } from '../helpers'
import type { ScolaElement } from './element'

export interface ScolaMediaElement extends ScolaElement {
  currentTime: number

  duration: number

  media: ScolaMedia

  muted: boolean

  paused: boolean

  src: string

  volume: number

  canPlayType: (type: string) => CanPlayTypeResult

  getData: () => ScolaMediaData | null

  pause: () => void

  play: () => Promise<void>
}
