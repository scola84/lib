import type { Html5Qrcode } from 'html5-qrcode'
import type { Html5QrcodeCameraScanConfig } from 'html5-qrcode/esm/html5-qrcode'
import { ImageCapture } from 'image-capture'
import type { Options } from 'recordrtc'
import type RtcRecorder from 'recordrtc'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'

declare global {
  interface HTMLElementEventMap {
    'sc-recorder-disable': CustomEvent
    'sc-recorder-enable': CustomEvent
    'sc-recorder-start': CustomEvent
    'sc-recorder-stop': CustomEvent
    'sc-recorder-toggle': CustomEvent
  }
}

export class ScolaRecorderElement extends HTMLDivElement implements ScolaElement {
  public static CodeScanner: typeof Html5Qrcode

  public static RtcRecorder: typeof RtcRecorder

  public static recordrtcOptions: Options = {
    disableLogs: true
  }

  public audio?: HTMLAudioElement

  public code?: string

  public codeFps: number

  public codeOverlay: number

  public codeScanner?: Html5Qrcode

  public contentType: string

  public facingMode: string

  public fillLightMode: string

  public intervalId?: number

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public resizer: ResizeObserver

  public rtcRecorder?: RtcRecorder

  public startTime = 0

  public stream?: MediaStream

  public video?: HTMLVideoElement

  public wait: boolean

  protected handleDisableBound = this.handleDisable.bind(this)

  protected handleEnableBound = this.handleEnable.bind(this)

  protected handleMutationsBound = this.handleMutations.bind(this)

  protected handleResizeBound = this.handleResize.bind(this)

  protected handleStartBound = this.handleStart.bind(this)

  protected handleStopBound = this.handleStop.bind(this)

  protected handleToggleBound = this.handleToggle.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.resizer = new ResizeObserver(this.handleResizeBound)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-recorder', ScolaRecorderElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleMutationsBound, [
      'sc-content-type',
      'sc-facing-mode',
      'sc-fill-light-mode'
    ])

    this.resizer.observe(this)
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()

    if (!this.wait) {
      this.wait = true

      window.requestAnimationFrame(() => {
        this.enable()
      })
    }
  }

  public disable (): void {
    if (this.hasAttribute('sc-enabled')) {
      this.clearCode()
      this.clearRtc()
      this.clearStream()
      this.clearAudio()
      this.clearVideo()
      this.toggleAttribute('sc-enabled', false)
      this.toggleAttribute('sc-started', false)
    }
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.resizer.disconnect()
    this.removeEventListeners()
    this.disable()
  }

  public enable (): void {
    if (!this.hasAttribute('sc-enabled')) {
      switch (this.contentType) {
        case 'audio':
          this.enableAudio()
          break
        case 'code':
          this.enableCode()
          break
        case 'image':
          this.enableImage()
          break
        case 'video':
          this.enableVideo()
          break
        default:
          break
      }

      this.toggleAttribute('sc-enabled', true)
    }
  }

  public getData (): void {}

  public reset (): void {
    this.codeFps = Number(this.getAttribute('sc-code-fps') ?? 1)
    this.codeOverlay = Number(this.getAttribute('sc-code-overlay') ?? 250)
    this.contentType = this.getAttribute('sc-content-type') ?? 'image'
    this.facingMode = this.getAttribute('sc-facing-mode') ?? 'user'
    this.fillLightMode = this.getAttribute('sc-fill-light-mode') ?? 'off'
    this.wait = this.hasAttribute('sc-wait')
  }

  public setData (): void {}

  public start (): void {
    if (!this.hasAttribute('sc-started')) {
      this.toggleAttribute('sc-started', true)

      switch (this.contentType) {
        case 'audio':
          this.startAudio()
          break
        case 'image':
          this.startImage()
          break
        case 'video':
          this.startVideo()
          break
        default:
          break
      }
    }
  }

  public stop (): void {
    if (this.hasAttribute('sc-started')) {
      switch (this.contentType) {
        case 'audio':
          this.stopAudio()
          break
        case 'video':
          this.stopVideo()
          break
        default:
          break
      }

      this.toggleAttribute('sc-started', false)
    }
  }

  public toggle (): void {
    if (this.hasAttribute('sc-started')) {
      this.stop()
    } else {
      this.start()
    }
  }

  public update (): void {
    this.disable()
    this.enable()
  }

  public updateStyle (): void {
    const {
      offsetHeight = 0,
      offsetWidth = 0
    } = this.parentElement ?? {}

    let maxHeight = this.codeOverlay
    let maxWidth = this.codeOverlay

    if (this.codeOverlay < 1) {
      maxHeight *= offsetHeight
      maxWidth *= offsetWidth
    }

    const height = Math.min(offsetHeight - 32, maxHeight)
    const width = Math.min(offsetWidth - 32, maxWidth)
    const size = Math.min(height, width)

    this.parentElement?.style.setProperty('--sc-code-overlay-y', `${(offsetHeight - size) / 2}px`)
    this.parentElement?.style.setProperty('--sc-code-overlay-x', `${(offsetWidth - size) / 2}px`)
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-recorder-disable', this.handleDisableBound)
    this.addEventListener('sc-recorder-enable', this.handleEnableBound)
    this.addEventListener('sc-recorder-start', this.handleStartBound)
    this.addEventListener('sc-recorder-stop', this.handleStopBound)
    this.addEventListener('sc-recorder-toggle', this.handleToggleBound)
  }

  protected clearAudio (): void {
    this.audio?.remove()
    this.audio = undefined
  }

  protected clearCode (): void {
    if (this.codeScanner !== undefined) {
      this.codeScanner.stop().catch(() => {})
      this.codeScanner = undefined
    }
  }

  protected clearRtc (): void {
    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    if (this.rtcRecorder !== undefined) {
      this.rtcRecorder.destroy()
      this.rtcRecorder = undefined
      this.startTime = 0
      this.removeAttribute('sc-duration')
    }
  }

  protected clearStream (): void {
    this.stream
      ?.getTracks()
      .forEach((track) => {
        track.stop()
      })

    this.stream = undefined
  }

  protected clearVideo (): void {
    this.video?.remove()
    this.video = undefined
  }

  protected createAudioConstraints (): MediaTrackConstraints {
    return {
      echoCancellation: true
    }
  }

  protected createVideoConstraints (): MediaTrackConstraints {
    return {
      facingMode: {
        ideal: this.facingMode
      },
      height: {
        ideal: 1080,
        max: 1080,
        min: 360
      },
      width: {
        ideal: 1920,
        max: 1920,
        min: 640
      }
    }
  }

  protected enableAudio (): void {
    const constraints: MediaStreamConstraints = {
      audio: this.createAudioConstraints()
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.setupAudio(stream)
      })
      .catch((error: unknown) => {
        this.handleError(error)
      })
  }

  protected enableCode (): void {
    const videoConstraints = this.createVideoConstraints()

    const scannerOptions: Html5QrcodeCameraScanConfig = {
      fps: this.codeFps,
      videoConstraints
    }

    this.codeScanner = new ScolaRecorderElement.CodeScanner(this.id, false)

    this.codeScanner
      .start(videoConstraints, scannerOptions, (code) => {
        if (this.hasAttribute('sc-started')) {
          this.code = code
          this.toggleAttribute('sc-has-code', true)

          this.propagator.dispatch('code', [{
            code,
            value: code
          }])
        }
      }, () => {
        this.toggleAttribute('sc-has-code', false)
      })
      .then(() => {
        this.code = undefined
        this.querySelector('video')?.removeAttribute('style')
        this.updateStyle()
      })
      .catch((error) => {
        this.handleError(error)
      })
  }

  protected enableImage (): void {
    const constraints: MediaStreamConstraints = {
      video: this.createVideoConstraints()
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.setupVideo(stream)
      })
      .catch((error: unknown) => {
        this.handleError(error)
      })
  }

  protected enableVideo (): void {
    const constraints: MediaStreamConstraints = {
      audio: this.createAudioConstraints(),
      video: this.createVideoConstraints()
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.setupVideo(stream)
      })
      .catch((error: unknown) => {
        this.handleError(error)
      })
  }

  protected handleDisable (): void {
    this.disable()
  }

  protected handleEnable (): void {
    this.enable()
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatch('error', [{
      code: 'err_recorder',
      message: String(error)
    }])
  }

  protected handleMutations (): void {
    this.reset()
    this.update()
  }

  protected handleResize (): void {
    this.updateStyle()
  }

  protected handleStart (): void {
    this.start()
  }

  protected handleStop (): void {
    this.stop()
  }

  protected handleToggle (): void {
    this.toggle()
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-recorder-disable', this.handleDisableBound)
    this.removeEventListener('sc-recorder-enable', this.handleEnableBound)
    this.removeEventListener('sc-recorder-start', this.handleStartBound)
    this.removeEventListener('sc-recorder-stop', this.handleStopBound)
    this.removeEventListener('sc-recorder-toggle', this.handleToggleBound)
  }

  protected setupAudio (stream: MediaStream): void {
    this.stream = stream
    this.audio = document.createElement('audio')
    this.audio.muted = true
    this.audio.srcObject = stream
    this.appendChild(this.audio)
  }

  protected setupVideo (stream: MediaStream): void {
    this.stream = stream
    this.video = document.createElement('video')
    this.video.autoplay = true
    this.video.muted = true
    this.video.playsInline = true
    this.video.srcObject = stream
    this.appendChild(this.video)
  }

  protected startAudio (): void {
    this.startRtc('audio')
  }

  protected startImage (): void {
    this.stream
      ?.getVideoTracks()
      .slice(0, 1)
      .forEach((videoTrack) => {
        const imageCapture = new ImageCapture(videoTrack)

        const options = {
          fillLightMode: this.fillLightMode
        }

        imageCapture
          .takePhoto(options)
          .then((blob) => {
            const name = blob.type.replace('/', '.')

            const file = new File([blob], name, {
              type: blob.type
            })

            this.propagator.dispatch('image', [{
              file,
              filename: file.name,
              filesize: file.size,
              filetype: file.type
            }])
          })
          .catch((error: unknown) => {
            this.handleError(error)
          })
          .finally(() => {
            this.toggleAttribute('sc-started', false)
          })
      })
  }

  protected startRtc (type: 'audio' | 'video'): void {
    if (this.stream !== undefined) {
      this.intervalId = window.setInterval(() => {
        this.setAttribute('sc-duration', `${Date.now() - this.startTime}`)
      }, 1000)

      this.rtcRecorder = new ScolaRecorderElement.RtcRecorder(this.stream, {
        ...ScolaRecorderElement.recordrtcOptions,
        type
      })

      this.startTime = Date.now()
      this.rtcRecorder.startRecording()
    }
  }

  protected startVideo (): void {
    this.startRtc('video')
  }

  protected stopAudio (): void {
    this.rtcRecorder?.stopRecording(() => {
      this.stopRtc()
    })
  }

  protected stopRtc (): void {
    if (this.rtcRecorder !== undefined) {
      const blob = this.rtcRecorder.getBlob()
      const name = blob.type.replace('/', '.')

      const file = new File([blob], name, {
        type: blob.type
      })

      this.propagator.dispatch(this.contentType, [{
        file,
        filename: file.name,
        filesize: file.size,
        filetype: file.type
      }])

      this.clearRtc()
    }
  }

  protected stopVideo (): void {
    this.rtcRecorder?.stopRecording(() => {
      this.stopRtc()
    })
  }
}
