import type { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'
import { customElement, property } from 'lit/decorators.js'
import { ImageCapture } from 'image-capture'
import { MediaElement } from './media'
import type { Options } from 'recordrtc'
import type { PropertyValues } from 'lit'
import RtcRecorder from 'recordrtc'
import styles from '../styles/recorder'
import updaters from '../updaters/recorder'

declare global {
  interface HTMLElementEventMap {
    'scola-recorder-start': CustomEvent
    'scola-recorder-stop': CustomEvent
    'scola-recorder-toggle': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-recorder': RecorderElement
  }

  interface WindowEventMap {
    'scola-recorder-start': CustomEvent
    'scola-recorder-stop': CustomEvent
    'scola-recorder-toggle': CustomEvent
  }
}

@customElement('scola-recorder')
export class RecorderElement extends MediaElement {
  public static codeReader?: BrowserMultiFormatReader

  public static recordrtcOptions: Options = {
    disableLogs: true
  }

  public static styles = [
    ...MediaElement.styles,
    styles
  ]

  public static updaters = {
    ...MediaElement.updaters,
    ...updaters
  }

  @property({
    reflect: true,
    type: Boolean
  })
  public back?: boolean

  @property({
    reflect: true,
    type: Boolean
  })
  public flash?: boolean

  @property()
  public mode: 'audio' | 'code' | 'picture' | 'video'

  @property({
    type: Boolean
  })
  public wait?: boolean

  public videoElement: HTMLVideoElement

  protected codeScanner?: IScannerControls

  protected enabled = false

  protected intervalId?: number

  protected mediaElement: HTMLVideoElement

  protected rtcRecorder?: RtcRecorder

  protected startTime = 0

  protected stream?: MediaStream

  protected updaters = RecorderElement.updaters

  public disable (): void {
    this.tearDownHelpers()
    this.tearDownStream()
    this.enabled = false
  }

  public disconnectedCallback (): void {
    this.disable()
    super.disconnectedCallback()
  }

  public enable (): void {
    this.setUpStream()
    this.enabled = true
  }

  public firstUpdated (properties: PropertyValues): void {
    super.firstUpdated(properties)

    if (this.wait !== true) {
      this.enable()
    }
  }

  public start (): void {
    if (!this.started) {
      switch (this.mode) {
        case 'audio':
        case 'video':
          this.startRtcRecording(this.mode)
          break
        case 'code':
          this.startCodeRecording()
          break
        case 'picture':
          this.startPictureRecording()
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
        case 'picture':
          this.stopPictureRecording()
          break
        default:
          break
      }

      this.started = false
    }
  }

  public update (properties: PropertyValues): void {
    if (
      this.enabled && (
        properties.has('back') ||
        properties.has('mode')
      )
    ) {
      this.disable()
      this.enable()
    }

    super.update(properties)
  }

  protected createAudioConstraints (): MediaStreamConstraints['audio'] {
    return {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true
    }
  }

  protected createVideoConstraints (): MediaStreamConstraints['video'] {
    const facingMode = {
      ideal: 'user'
    }

    if (this.back === true) {
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

  protected handleData (): void {}

  protected handleError (error: unknown): void {
    this.dispatchError(error, 'err_recorder')
  }

  protected setUpElementListeners (): void {
    this.addEventListener('scola-recorder-start', this.handleStartBound)
    this.addEventListener('scola-recorder-stop', this.handleStopBound)
    this.addEventListener('scola-recorder-toggle', this.handleToggleBound)
    super.setUpElementListeners()
  }

  protected setUpMedia (): void {}

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
      this.mode === 'picture' ||
      this.mode === 'video'
    ) {
      constraints.video = this.createVideoConstraints()
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.stream = stream
        this.mediaElement.srcObject = stream
        this.mediaElement.muted = true
      })
      .catch((error: unknown) => {
        this.handleError(error)
      })
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-recorder-start', this.handleStartBound)
    window.addEventListener('scola-recorder-stop', this.handleStopBound)
    window.addEventListener('scola-recorder-toggle', this.handleToggleBound)
    super.setUpWindowListeners()
  }

  protected startCodeRecording (): void {
    this.codeScanner = RecorderElement.codeReader?.scan(this.mediaElement, (code) => {
      if (
        code !== undefined &&
        this.codeScanner !== undefined
      ) {
        this.data = {
          code,
          value: code.getText()
        }

        this.dispatchEvents(this.dispatch, [this.data])
        this.tearDownHelpers()
      }
    })
  }

  protected startPictureRecording (): void {
    this.stream
      ?.getVideoTracks()
      .slice(0, 1)
      .forEach((videoTrack) => {
        const imageCapture = new ImageCapture(videoTrack)

        const options = {
          fillLightMode: 'off'
        }

        if (this.flash === true) {
          options.fillLightMode = 'flash'
        }

        imageCapture
          .takePhoto(options)
          .then((blob) => {
            const name = blob.type.replace('/', '.')

            this.data = {
              file: new File([blob], name, {
                type: blob.type
              }),
              filename: name,
              filesize: blob.size,
              filetype: blob.type
            }

            this.dispatchEvents(this.dispatch, [this.data])
          })
          .catch((error: unknown) => {
            this.handleError(error)
          })
          .finally(() => {
            this.started = false
          })
      })
  }

  protected startRtcRecording (type: 'audio' | 'video'): void {
    if (this.stream !== undefined) {
      this.intervalId = window.setInterval(() => {
        this.updateLength(Date.now() / 1000)
      }, 1000)

      this.rtcRecorder = new RtcRecorder(this.stream, {
        ...RecorderElement.recordrtcOptions,
        type
      })

      this.startTime = Date.now() / 1000
      this.rtcRecorder.startRecording()
    }
  }

  protected stopCodeRecording (): void {
    this.tearDownHelpers()
  }

  protected stopPictureRecording (): void {}

  protected stopRtcRecording (): void {
    this.rtcRecorder?.stopRecording(() => {
      if (this.rtcRecorder !== undefined) {
        const blob = this.rtcRecorder.getBlob()
        const name = blob.type.replace('/', '.')

        this.data = {
          file: new File([blob], name, {
            type: blob.type
          }),
          filename: name,
          filesize: blob.size,
          filetype: blob.type
        }

        this.dispatchEvents(this.dispatch, [this.data])
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
      this.updateLength()
      this.rtcRecorder.destroy()
      this.rtcRecorder = undefined
    }

    this.started = false
  }

  protected tearDownMedia (): void {}

  protected tearDownStream (): void {
    this.stream
      ?.getTracks()
      .forEach((track) => {
        track.stop()
      })

    this.mediaElement.srcObject = null
    this.stream = undefined
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-recorder-start', this.handleStartBound)
    window.removeEventListener('scola-recorder-stop', this.handleStopBound)
    window.removeEventListener('scola-recorder-toggle', this.handleToggleBound)
    super.tearDownWindowListeners()
  }

  protected updateLength (now?: number): void {
    if (now === undefined) {
      this.length = 0
    } else {
      this.length = now - this.startTime
    }
  }
}
