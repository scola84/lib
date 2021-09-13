import { customElement, property } from 'lit/decorators.js'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DateTime } from 'luxon'
import type { IScannerControls } from '@zxing/browser'
import { ImageCapture } from 'image-capture'
import { MediaElement } from './media'
import type { PropertyValues } from 'lit'
import RtcRecorder from 'recordrtc'
import styles from '../styles/recorder'

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
  public static styles = [
    ...MediaElement.styles,
    styles
  ]

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

  public connectedCallback (): void {
    this.setUpStream()
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    this.tearDownHelpers()
    this.tearDownStream()
    super.disconnectedCallback()
  }

  public update (properties: PropertyValues): void {
    if (properties.has('compose')) {
      // discard first update
    } else if (properties.has('back')) {
      this.tearDownHelpers()
      this.tearDownStream()
      this.setUpStream()
    } else if (properties.has('mode')) {
      this.tearDownHelpers()
    } else if (properties.has('recording')) {
      this.toggleRecording()
    }

    super.update(properties)
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
    this.videoElement.srcObject = null
    this.stream = undefined
  }

  protected toggleCodeRecording (): void {
    if (this.recording === true) {
      const reader = new BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 1000,
        delayBetweenScanSuccess: 1000
      })

      this.codeScanner = reader.scan(this.videoElement, (code) => {
        if (
          code !== undefined &&
          this.codeScanner !== undefined
        ) {
          this.data = {
            code,
            value: code.getText()
          }

          this.dispatchEvents(this.data)
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

          this.data = {
            blob,
            ratio: this.videoElement.videoWidth / this.videoElement.videoHeight,
            type: blob.type,
            value: blob
          }

          this.dispatchEvents(this.data)
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
              this.data = {
                blob,
                ratio: this.videoElement.videoWidth / this.videoElement.videoHeight,
                type: blob.type,
                value: blob
              }

              this.dispatchEvents(this.data)
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
