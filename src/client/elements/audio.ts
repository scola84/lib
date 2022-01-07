import type { ScolaElement } from './element'
import { ScolaMedia } from '../helpers/media'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-audio-jump': CustomEvent
    'sc-audio-mute': CustomEvent
    'sc-audio-pause': CustomEvent
    'sc-audio-play': CustomEvent
    'sc-audio-time': CustomEvent
    'sc-audio-toggle': CustomEvent
    'sc-audio-volume': CustomEvent
  }
}

export class ScolaAudioElement extends HTMLAudioElement implements ScolaElement {
  public media: ScolaMedia

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleJumpBound = this.handleJump.bind(this)

  protected handleMuteBound = this.handleMute.bind(this)

  protected handlePauseBound = this.handlePause.bind(this)

  protected handlePlayBound = this.handlePlay.bind(this)

  protected handleTimeBound = this.handleTime.bind(this)

  protected handleToggleBound = this.handleToggle.bind(this)

  protected handleVolumeBound = this.handleVolume.bind(this)

  public constructor () {
    super()
    this.media = new ScolaMedia(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.update()
  }

  public static define (): void {
    customElements.define('sc-audio', ScolaAudioElement, {
      extends: 'audio'
    })
  }

  public connectedCallback (): void {
    this.media.disconnect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
    this.load()
  }

  public disconnectedCallback (): void {
    this.media.connect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public getData (): Struct {
    return this.media.getData()
  }

  public reset (): void {}

  public setData (data: unknown): void {
    this.media.setData(data)
  }

  public toggle (): void {
    this.media.toggle()
  }

  public update (): void {
    this.updateAttributes()
  }

  public updateAttributes (): void {
    this.setAttribute('sc-length', (this.duration * 1000).toString())
    this.toggleAttribute('sc-muted', this.muted)
    this.toggleAttribute('sc-playing', !this.paused)
    this.setAttribute('sc-time', (this.currentTime * 1000).toString())
    this.setAttribute('sc-volume', this.volume.toString())
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-audio-jump', this.handleJumpBound)
    this.addEventListener('sc-audio-mute', this.handleMuteBound)
    this.addEventListener('sc-audio-pause', this.handlePauseBound)
    this.addEventListener('sc-audio-play', this.handlePlayBound)
    this.addEventListener('sc-audio-time', this.handleTimeBound)
    this.addEventListener('sc-audio-toggle', this.handleToggleBound)
    this.addEventListener('sc-audio-volume', this.handleVolumeBound)
  }

  protected handleJump (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.media.jumpTime(Number(event.detail.delta))
    }
  }

  protected handleMute (): void {
    this.media.setMute(!this.muted)
  }

  protected handlePause (): void {
    this.pause()
  }

  protected handlePlay (): void {
    this.play().catch(() => {})
  }

  protected handleTime (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.media.setTime(Number(event.detail.time))
    }
  }

  protected handleToggle (): void {
    this.toggle()
  }

  protected handleVolume (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.media.setVolume(Number(event.detail.volume))
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-audio-jump', this.handleJumpBound)
    this.removeEventListener('sc-audio-mute', this.handleMuteBound)
    this.removeEventListener('sc-audio-pause', this.handlePauseBound)
    this.removeEventListener('sc-audio-play', this.handlePlayBound)
    this.removeEventListener('sc-audio-time', this.handleTimeBound)
    this.removeEventListener('sc-audio-toggle', this.handleToggleBound)
    this.removeEventListener('sc-audio-volume', this.handleVolumeBound)
  }
}
