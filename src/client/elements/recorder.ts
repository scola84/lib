import type { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'
import { customElement, property } from 'lit/decorators.js'
import { DateTime } from 'luxon'
import { ImageCapture } from 'image-capture'
import { MediaElement } from './media'
import type { PropertyValues } from 'lit'
import RtcRecorder from 'recordrtc'
import styles from '../styles/recorder'
import updaters from '../updaters/recorder'

declare global {
  interface HTMLElementTagNameMap {
    'scola-recorder': RecorderElement
  }
}

export interface RecorderElementState {
  dateStarted: Date | null
  duration: string
}

@customElement('scola-recorder')
export class RecorderElement extends MediaElement {
  public static codeReader?: BrowserMultiFormatReader

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
    if (properties.has('compose')) {
      // discard first update
    } else if (properties.has('back')) {
      this.disable()
      this.enable()
    } else if (properties.has('mode')) {
      this.tearDownHelpers()
    } else if (properties.has('recording')) {
      this.toggleRecording()
    }

    super.update(properties)
  }

  protected createDispatchItems (): unknown[] {
    return [this.data]
  }

  protected setUpStream (): void {
    const constraints = {
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true
      },
      video: {
        facingMode: {
          ideal: 'user'
        },
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

    if (this.back === true) {
      constraints.video.facingMode.ideal = 'environment'
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.stream = stream
        this.videoElement.srcObject = stream
        this.videoElement.muted = true
      })
      .catch(() => {})
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

          this.dispatchEvents(this.createDispatchItems())
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
          disableLogs: true,
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

          this.dispatchEvents(this.createDispatchItems())
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

              this.dispatchEvents(this.createDispatchItems())
            })
            .finally(() => {
              this.recording = false
            })
        })
    }
  }

  protected toggleRecording (): void {
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
