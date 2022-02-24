import { ScolaMedia } from '../helpers/media'
import type { ScolaMediaData } from '../helpers/media'
import type { ScolaMediaElement } from './media'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-video-fullscreen': CustomEvent
    'sc-video-jump': CustomEvent
    'sc-video-mute': CustomEvent
    'sc-video-pause': CustomEvent
    'sc-video-play': CustomEvent
    'sc-video-time': CustomEvent
    'sc-video-toggle': CustomEvent
    'sc-video-volume': CustomEvent
  }

  interface HTMLVideoElement {
    webkitEnterFullScreen: () => void
  }
}

export class ScolaVideoElement extends HTMLVideoElement implements ScolaMediaElement {
  public media: ScolaMedia

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleFullscreenBound = this.handleFullscreen.bind(this)

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
    customElements.define('sc-video', ScolaVideoElement, {
      extends: 'video'
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

  public getData (): ScolaMediaData | null {
    return this.media.getData()
  }

  public isSame (data: unknown): boolean {
    return this.media.isSame(data)
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
    this.propagator.dispatch('update')
  }

  public updateAttributes (): void {
    this.toggleAttribute('sc-muted', this.muted)
    this.toggleAttribute('sc-playing', !this.paused)
    this.setAttribute('sc-updated', Date.now().toString())
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-video-fullscreen', this.handleFullscreenBound)
    this.addEventListener('sc-video-jump', this.handleJumpBound)
    this.addEventListener('sc-video-mute', this.handleMuteBound)
    this.addEventListener('sc-video-pause', this.handlePauseBound)
    this.addEventListener('sc-video-play', this.handlePlayBound)
    this.addEventListener('sc-video-time', this.handleTimeBound)
    this.addEventListener('sc-video-toggle', this.handleToggleBound)
    this.addEventListener('sc-video-volume', this.handleVolumeBound)
  }

  protected handleFullscreen (): void {
    if (typeof this.webkitEnterFullScreen === 'function') {
      this.webkitEnterFullScreen()
    }
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
    this.removeEventListener('sc-video-fullscreen', this.handleFullscreenBound)
    this.removeEventListener('sc-video-jump', this.handleJumpBound)
    this.removeEventListener('sc-video-mute', this.handleMuteBound)
    this.removeEventListener('sc-video-pause', this.handlePauseBound)
    this.removeEventListener('sc-video-play', this.handlePlayBound)
    this.removeEventListener('sc-video-time', this.handleTimeBound)
    this.removeEventListener('sc-video-toggle', this.handleToggleBound)
    this.removeEventListener('sc-video-volume', this.handleVolumeBound)
  }
}
