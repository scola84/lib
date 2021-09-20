import type { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'
import { customElement, property } from 'lit/decorators.js'
import { DateTime } from 'luxon'
import { ImageCapture } from 'image-capture'
import { MediaElement } from './media'
import type { Options } from 'recordrtc'
import type { PropertyValues } from 'lit'
import RtcRecorder from 'recordrtc'
import styles from '../styles/recorder'
import updaters from '../updaters/recorder'

declare global {
  interface HTMLElementEventMap {
    'scola-recorder-toggle': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-recorder': RecorderElement
  }

  interface WindowEventMap {
    'scola-recorder-toggle': CustomEvent
  }
}

export interface RecorderElementState {
  dateStarted: Date | null
  duration: string
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
    reflect: true,
    type: Boolean
  })
  public recording?: boolean

  @property({
    type: Boolean
  })
  public wait?: boolean

  public state: RecorderElementState = {
    dateStarted: null,
    duration: ''
  }

  public videoElement: HTMLVideoElement

  protected codeScanner?: IScannerControls

  protected handleToggleBound = this.handleToggle.bind(this)

  protected intervalId?: number

  protected rtcRecorder?: RtcRecorder

  protected stream?: MediaStream

  protected updaters = RecorderElement.updaters

  public disable (): void {
    this.tearDownHelpers()
    this.tearDownStream()
  }

  public disconnectedCallback (): void {
    this.disable()
    super.disconnectedCallback()
  }

  public enable (): void {
    this.setUpStream()
  }

  public firstUpdated (properties: PropertyValues): void {
    super.firstUpdated(properties)

    if (this.wait !== true) {
      this.enable()
    }
  }

  public update (properties: PropertyValues): void {
    if (properties.has('observe')) {
      // discard first update
    } else if (
      properties.has('back') ||
      properties.has('mode')
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

  protected handleError (error: unknown): void {
    this.dispatchError(error, 'err_recorder')
  }

  protected handleToggle (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.toggleRecording()
    }
  }

  protected setUpElementListeners (): void {
    this.addEventListener('scola-recorder-toggle', this.handleToggleBound)
    super.setUpElementListeners()
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
      this.mode === 'picture' ||
      this.mode === 'video'
    ) {
      constraints.video = this.createVideoConstraints()
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.stream = stream
        this.videoElement.srcObject = stream
        this.videoElement.muted = true
      })
      .catch((error: unknown) => {
        this.handleError(error)
      })
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-recorder-toggle', this.handleToggleBound)
    super.setUpWindowListeners()
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
      this.updateDuration()
      this.rtcRecorder.destroy()
      this.rtcRecorder = undefined
    }

    this.recording = false
  }

  protected tearDownStream (): void {
    this.stream
      ?.getTracks()
      .forEach((track) => {
        track.stop()
      })

    this.videoElement.srcObject = null
    this.stream = undefined
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-recorder-toggle', this.handleToggleBound)
    super.tearDownWindowListeners()
  }

  protected toggleCodeRecording (): void {
    if (this.recording === true) {
      this.codeScanner = RecorderElement.codeReader?.scan(this.videoElement, (code) => {
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
    } else if (this.codeScanner !== undefined) {
      this.tearDownHelpers()
    }
  }

  protected toggleMediaRecording (type: 'audio' | 'video'): void {
    if (this.recording === true) {
      if (this.stream !== undefined) {
        this.rtcRecorder = new RtcRecorder(this.stream, {
          ...RecorderElement.recordrtcOptions,
          type
        })

        this.intervalId = window.setInterval(() => {
          this.updateDuration(new Date())
        }, 1000)

        this.updateDuration(new Date())
        this.rtcRecorder.startRecording()
      }
    } else if (this.rtcRecorder !== undefined) {
      this.rtcRecorder.stopRecording(() => {
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
  }

  protected togglePictureRecording (): void {
    if (this.recording === true) {
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
              this.recording = false
            })
        })
    }
  }

  protected toggleRecording (): void {
    this.recording = this.recording === false

    switch (this.mode) {
      case 'audio':
      case 'video':
        this.toggleMediaRecording(this.mode)
        break
      case 'code':
        this.toggleCodeRecording()
        break
      case 'picture':
        this.togglePictureRecording()
        break
      default:
        break
    }
  }

  protected updateDuration (date?: Date): void {
    if (date === undefined) {
      this.state.dateStarted = null
      this.state.duration = ''
    } else {
      if (this.state.dateStarted === null) {
        this.state.dateStarted = date
      }

      this.state.duration = DateTime
        .fromJSDate(date)
        .diff(DateTime.fromJSDate(this.state.dateStarted))
        .toFormat('hh:mm:ss')
    }

    this.requestUpdate('state')
  }
}
