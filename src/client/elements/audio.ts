import { Media, Mutator, Observer, Propagator } from '../helpers'
import type { MediaData } from '../helpers'
import type { ScolaMediaElement } from './media'
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

export class ScolaAudioElement extends HTMLAudioElement implements ScolaMediaElement {
  public static origin = window.location.origin

  public key: string | null

  public media: Media

  public mutator: Mutator

  public observer: Observer

  public origin = ScolaAudioElement.origin

  public propagator: Propagator

  public url: string | null

  protected handleErrorBound = this.handleError.bind(this)

  protected handleJumpBound = this.handleJump.bind(this)

  protected handleMuteBound = this.handleMute.bind(this)

  protected handlePauseBound = this.handlePause.bind(this)

  protected handlePlayBound = this.handlePlay.bind(this)

  protected handleTimeBound = this.handleTime.bind(this)

  protected handleToggleBound = this.handleToggle.bind(this)

  protected handleVolumeBound = this.handleVolume.bind(this)

  public constructor () {
    super()
    this.media = new Media(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.update()
  }

  public static define (): void {
    customElements.define('sc-audio', ScolaAudioElement, {
      extends: 'audio'
    })
  }

  public connectedCallback (): void {
    this.media.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
    this.load()
  }

  public disconnectedCallback (): void {
    this.media.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public getData (): Required<MediaData> | null {
    return this.media.getData()
  }

  public reset (): void {
    this.key = this.getAttribute('sc-key')
    this.url = this.getAttribute('sc-url')
  }

  public setData (data: unknown): void {
    this.media.setData(data)
  }

  public toObject (): Struct {
    return this.media.toObject()
  }

  public toggle (): void {
    this.media.toggle()
  }

  public update (): void {
    this.updateAttributes()
    this.propagator.dispatch('update')
  }

  public updateAttributes (): void {
    this.toggleAttribute('sc-muted', this.muted)
    this.toggleAttribute('sc-playing', !this.paused)
    this.setAttribute('sc-updated', Date.now().toString())
  }

  protected addEventListeners (): void {
    this.addEventListener('error', this.handleErrorBound)
    this.addEventListener('sc-audio-jump', this.handleJumpBound)
    this.addEventListener('sc-audio-mute', this.handleMuteBound)
    this.addEventListener('sc-audio-pause', this.handlePauseBound)
    this.addEventListener('sc-audio-play', this.handlePlayBound)
    this.addEventListener('sc-audio-time', this.handleTimeBound)
    this.addEventListener('sc-audio-toggle', this.handleToggleBound)
    this.addEventListener('sc-audio-volume', this.handleVolumeBound)
  }

  protected handleError (): void {
    this.setData(null)
  }

  protected handleJump (event: CustomEvent): void {
    if (
      isStruct(event.detail) &&
      event.detail.delta !== undefined
    ) {
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
    if (
      isStruct(event.detail) &&
      event.detail.time !== undefined
    ) {
      this.media.setTime(Number(event.detail.time))
    }
  }

  protected handleToggle (): void {
    this.toggle()
  }

  protected handleVolume (event: CustomEvent): void {
    if (
      isStruct(event.detail) &&
      event.detail.volume !== undefined
    ) {
      this.media.setVolume(Number(event.detail.volume))
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('error', this.handleErrorBound)
    this.removeEventListener('sc-audio-jump', this.handleJumpBound)
    this.removeEventListener('sc-audio-mute', this.handleMuteBound)
    this.removeEventListener('sc-audio-pause', this.handlePauseBound)
    this.removeEventListener('sc-audio-play', this.handlePlayBound)
    this.removeEventListener('sc-audio-time', this.handleTimeBound)
    this.removeEventListener('sc-audio-toggle', this.handleToggleBound)
    this.removeEventListener('sc-audio-volume', this.handleVolumeBound)
  }
}
