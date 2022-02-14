import type { ScolaElement } from './element'
import type { ScolaMedia } from '../helpers/media'

export interface ScolaMediaElement extends ScolaElement {
  currentTime: number

  duration: number

  media: ScolaMedia

  muted: boolean

  paused: boolean

  src: string

  volume: number

  canPlayType: (type: string) => CanPlayTypeResult

  pause: () => void

  play: () => Promise<void>
}
