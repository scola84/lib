import type { BrowserMultiFormatReader, IBrowserCodeReaderOptions, IScannerControls } from '@zxing/browser'
import { ImageCapture } from 'image-capture'
import type { Options } from 'recordrtc'
import type RtcRecorder from 'recordrtc'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'

declare global {
  interface HTMLElementEventMap {
    'sc-recorder-start': CustomEvent
    'sc-recorder-stop': CustomEvent
    'sc-recorder-toggle': CustomEvent
  }
}

export class ScolaRecorderElement extends HTMLVideoElement implements ScolaElement {
  public static FormatReader: typeof BrowserMultiFormatReader

  public static RtcRecorder: typeof RtcRecorder

  public static formatReaderOptions: IBrowserCodeReaderOptions

  public static recordrtcOptions: Options = {
    disableLogs: true
  }

  public back: boolean

  public codeScanner?: IScannerControls

  public flash: boolean

  public intervalId?: number

  public mode: string

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public rtcRecorder?: RtcRecorder

  public startTime = 0

  public started = false

  public stream?: MediaStream

  public wait: boolean

  protected handleMutationsBound = this.handleMutations.bind(this)

  protected handleStartBound = this.handleStart.bind(this)

  protected handleStopBound = this.handleStop.bind(this)

  protected handleToggleBound = this.handleToggle.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-recorder', ScolaRecorderElement, {
      extends: 'video'
    })
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleMutationsBound, [
      'sc-back',
      'sc-flash',
      'sc-mode'
    ])

    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()

    if (!this.wait) {
      this.enable()
    }
  }

  public disable (): void {
    this.tearDownHelpers()
    this.tearDownStream()
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
    this.disable()
  }

  public enable (): void {
    this.setUpStream()
  }

  public getData (): void {}

  public reset (): void {
    this.back = this.hasAttribute('sc-back')
    this.flash = this.hasAttribute('sc-flash')
    this.mode = this.getAttribute('sc-mode') ?? 'image'
    this.wait = this.hasAttribute('sc-wait')
  }

  public setData (): void {}

  public start (): void {
    if (!this.started) {
      switch (this.mode) {
        case 'audio':
        case 'video':
          this.startRtcRecording()
          break
        case 'code':
          this.startCodeRecording()
          break
        case 'image':
          this.startImageRecording()
          break
        default:
          break
      }

      this.started = true
    }
  }

  public stop (): void {
    if (this.started) {
      switch (this.mode) {
        case 'audio':
        case 'video':
          this.stopRtcRecording()
          break
        case 'code':
          this.stopCodeRecording()
          break
        case 'image':
          this.stopImageRecording()
          break
        default:
          break
      }

      this.started = false
    }
  }

  public toggle (): void {
    if (this.started) {
      this.stop()
    } else {
      this.start()
    }
  }

  public update (): void {
    this.disable()
    this.enable()
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-recorder-start', this.handleStartBound)
    this.addEventListener('sc-recorder-stop', this.handleStopBound)
    this.addEventListener('sc-recorder-toggle', this.handleToggleBound)
  }

  protected createAudioConstraints (): MediaStreamConstraints['audio'] {
    return {
      echoCancellation: true
    }
  }

  protected createVideoConstraints (): MediaStreamConstraints['video'] {
    const facingMode = {
      ideal: 'user'
    }

    if (this.back) {
      facingMode.ideal = 'environment'
    }

    return {
      facingMode,
      height: {
        ideal: 1080,
        min: 360
      },
      width: {
        ideal: 1920,
        max: 1920,
        min: 640
      }
    }
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
    this.removeEventListener('sc-recorder-start', this.handleStartBound)
    this.removeEventListener('sc-recorder-stop', this.handleStopBound)
    this.removeEventListener('sc-recorder-toggle', this.handleToggleBound)
  }

  protected setUpStream (): void {
    const constraints: MediaStreamConstraints = {}

    if (
      this.mode === 'audio' ||
      this.mode === 'video'
    ) {
      constraints.audio = this.createAudioConstraints()
    }

    if (
      this.mode === 'code' ||
      this.mode === 'image' ||
      this.mode === 'video'
    ) {
      constraints.video = this.createVideoConstraints()
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.stream = stream
        this.srcObject = stream
        this.muted = true
      })
      .catch((error: unknown) => {
        this.handleError(error)
      })
  }

  protected startCodeRecording (): void {
    const codeReader = new ScolaRecorderElement.FormatReader(undefined, ScolaRecorderElement.formatReaderOptions)

    this.codeScanner = codeReader.scan(this, (code) => {
      if (
        code !== undefined &&
        this.codeScanner !== undefined
      ) {
        this.propagator.dispatch('code', [{
          code,
          value: code.getText()
        }])

        this.tearDownHelpers()
      }
    })
  }

  protected startImageRecording (): void {
    this.stream
      ?.getVideoTracks()
      .slice(0, 1)
      .forEach((videoTrack) => {
        const imageCapture = new ImageCapture(videoTrack)

        const options = {
          fillLightMode: 'off'
        }

        if (this.flash) {
          options.fillLightMode = 'flash'
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
            this.started = false
          })
      })
  }

  protected startRtcRecording (): void {
    if (this.stream !== undefined) {
      this.intervalId = window.setInterval(() => {
        this.setAttribute('sc-duration', `${Date.now() - this.startTime}`)
      }, 1000)

      this.rtcRecorder = new ScolaRecorderElement.RtcRecorder(this.stream, {
        ...ScolaRecorderElement.recordrtcOptions,
        type: this.mode as 'audio' | 'video'
      })

      this.startTime = Date.now()
      this.rtcRecorder.startRecording()
    }
  }

  protected stopCodeRecording (): void {
    this.tearDownHelpers()
  }

  protected stopImageRecording (): void {}

  protected stopRtcRecording (): void {
    this.rtcRecorder?.stopRecording(() => {
      if (this.rtcRecorder !== undefined) {
        const blob = this.rtcRecorder.getBlob()
        const name = blob.type.replace('/', '.')

        const file = new File([blob], name, {
          type: blob.type
        })

        this.propagator.dispatch(this.mode, [{
          file,
          filename: file.name,
          filesize: file.size,
          filetype: file.type
        }])

        this.tearDownHelpers()
      }
    })
  }

  protected tearDownHelpers (): void {
    if (this.codeScanner !== undefined) {
      this.codeScanner.stop()
      this.codeScanner = undefined
    }

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

    this.started = false
  }

  protected tearDownStream (): void {
    this.stream
      ?.getTracks()
      .forEach((track) => {
        track.stop()
      })

    this.srcObject = null
    this.stream = undefined
  }
}
