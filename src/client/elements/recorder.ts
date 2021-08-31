import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DateTime } from 'luxon'
import type { IScannerControls } from '@zxing/browser'
import { ImageCapture } from 'image-capture'
import { MediaElement } from './media'
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
  duration: string
  startDate: Date | null
}

@customElement('scola-recorder')
export class RecorderElement extends MediaElement {
  public static styles: CSSResultGroup[] = [
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

  public mediaElement: HTMLVideoElement

  public state: RecorderElementState = {
    duration: '',
    startDate: null
  }

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
        this.mediaElement.srcObject = stream
        this.mediaElement.muted = true
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
    this.mediaElement.srcObject = null
    this.stream = undefined
  }

  protected toggleCodeRecording (): void {
    if (this.recording === true) {
      const reader = new BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 1000,
        delayBetweenScanSuccess: 1000
      })

      this.codeScanner = reader.scan(this.mediaElement, (result) => {
        if (
          result !== undefined &&
          this.codeScanner !== undefined
        ) {
          console.log(result)
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
          console.log(this.rtcRecorder.getBlob())
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
              console.log(blob)
            })
            .catch(() => {})
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
      this.state.duration = ''
      this.state.startDate = null
    } else {
      if (this.state.startDate === null) {
        this.state.startDate = date
      }

      this.state.duration = DateTime
        .fromJSDate(date)
        .diff(DateTime.fromJSDate(this.state.startDate))
        .toFormat('hh:mm:ss')
    }

    this.requestUpdate('state')
  }
}
