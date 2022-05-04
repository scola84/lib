import { Media, Mutator, Observer, Propagator } from '../helpers'
import { isStruct, toString } from '../../common'
import type { ScolaError } from '../../common'
import type { ScolaMediaElement } from './media'

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
  public static origin = window.location.origin

  public currentTimeAsString = '00:00:00'

  public durationAsString = '00:00:00'

  public key: string

  public media: Media

  public mutator: Mutator

  public observer: Observer

  public origin = ScolaVideoElement.origin

  public propagator: Propagator

  public url: string | null

  public get data (): unknown {
    return {
      ...this.dataset
    }
  }

  public set data (data: unknown) {
    this.media.setData(data)
  }

  protected handleErrorBound = this.handleError.bind(this)

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
    this.media = new Media(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.notify()
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

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.propagator.dispatchEvents('update')
  }

  public reset (): void {
    this.key = this.getAttribute('sc-key') ?? ''
    this.url = this.getAttribute('sc-url')
  }

  public toJSON (): unknown {
    return {
      currentTimeAsString: this.currentTimeAsString,
      durationAsString: this.durationAsString,
      id: this.id,
      is: this.getAttribute('is'),
      key: this.key,
      muted: this.muted,
      nodeName: this.nodeName,
      paused: this.paused,
      src: this.src,
      url: this.url,
      volume: this.volume
    }
  }

  protected addEventListeners (): void {
    this.addEventListener('error', this.handleErrorBound)
    this.addEventListener('sc-video-fullscreen', this.handleFullscreenBound)
    this.addEventListener('sc-video-jump', this.handleJumpBound)
    this.addEventListener('sc-video-mute', this.handleMuteBound)
    this.addEventListener('sc-video-pause', this.handlePauseBound)
    this.addEventListener('sc-video-play', this.handlePlayBound)
    this.addEventListener('sc-video-time', this.handleTimeBound)
    this.addEventListener('sc-video-toggle', this.handleToggleBound)
    this.addEventListener('sc-video-volume', this.handleVolumeBound)
  }

  protected handleError (error: unknown): void {
    this.data = null

    this.propagator.dispatchEvents<ScolaError>('error', [{
      code: 'err_video',
      message: toString(error)
    }])
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
      this.media.setCurrentTime(Number(event.detail.time))
    }
  }

  protected handleToggle (): void {
    this.media.toggle()
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
