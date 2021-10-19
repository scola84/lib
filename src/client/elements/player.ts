import { customElement, property } from 'lit/decorators.js'
import type { ListElement } from './list'
import type { MediaElement } from './media'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'
import { isStruct } from '../../common'
import updaters from '../updaters/player'

declare global {
  interface HTMLElementEventMap {
    'scola-player-back': CustomEvent
    'scola-player-fullscreen': CustomEvent
    'scola-player-forward': CustomEvent
    'scola-player-jump': CustomEvent
    'scola-player-rewind': CustomEvent
    'scola-player-start': CustomEvent
    'scola-player-stop': CustomEvent
    'scola-player-toggle': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-player': PlayerElement
  }

  interface WindowEventMap {
    'scola-player-back': CustomEvent
    'scola-player-fullscreen': CustomEvent
    'scola-player-forward': CustomEvent
    'scola-player-jump': CustomEvent
    'scola-player-rewind': CustomEvent
    'scola-player-start': CustomEvent
    'scola-player-stop': CustomEvent
    'scola-player-toggle': CustomEvent
  }
}

@customElement('scola-player')
export class PlayerElement extends NodeElement {
  public static updaters = {
    ...NodeElement.updaters,
    ...updaters
  }

  @property({
    type: Boolean
  })
  public hasNext?: boolean

  @property({
    type: Boolean
  })
  public hasPrevious?: boolean

  @property({
    reflect: true,
    type: Boolean
  })
  public started = false

  protected handleBackBound = this.handleBack.bind(this)

  protected handleForwardBound = this.handleForward.bind(this)

  protected handleFullscreenBound = this.handleFullscreen.bind(this)

  protected handleJumpBound = this.handleJump.bind(this)

  protected handleMediaEndedBound = this.handleMediaEnded.bind(this)

  protected handleRewindBound = this.handleRewind.bind(this)

  protected handleStartBound = this.handleStart.bind(this)

  protected handleStopBound = this.handleStop.bind(this)

  protected handleToggleBound = this.handleToggle.bind(this)

  protected listElement: ListElement

  protected mediaElement: MediaElement

  protected pointer = -1

  protected updaters = PlayerElement.updaters

  public constructor () {
    super()

    const listElement = this.querySelector<ListElement>(':scope > scola-list')

    if (listElement === null) {
      throw new Error('List element is null')
    }

    const mediaElement = this.querySelector<MediaElement>(':scope > scola-media')

    if (mediaElement === null) {
      throw new Error('Media element is null')
    }

    this.listElement = listElement
    this.mediaElement = mediaElement
  }

  public back (): void {
    this.go(-1)
  }

  public firstUpdated (properties: PropertyValues): void {
    this.go(1)
    super.firstUpdated(properties)
  }

  public forward (): void {
    this.go(1)
  }

  public jump (data: Struct): void {
    const index = this.listElement.items.findIndex((item) => {
      return this.listElement.getKey(item) === this.listElement.getKey(data)
    })

    if (index > -1) {
      this.go(-(this.pointer - index))
    }
  }

  public rewind (): void {
    this.go(-this.pointer)
  }

  public start (): void {
    if (!this.started) {
      this.mediaElement.start()
      this.started = true
    }
  }

  public stop (): void {
    if (this.started) {
      this.mediaElement.stop()
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

  protected go (delta: number): void {
    if (
      this.pointer + delta >= 0 &&
      this.pointer + delta <= this.listElement.items.length - 1
    ) {
      this.setPointer(this.pointer + delta)
    }

    this.mediaElement.data = this.listElement.items[this.pointer]

    if (this.started) {
      window.requestAnimationFrame(() => {
        this.mediaElement.start()
      })
    }
  }

  protected handleBack (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.back()
    }
  }

  protected handleForward (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.forward()
    }
  }

  protected handleFullscreen (): void {
    if (document.fullscreenElement === null) {
      this.mediaElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  protected handleJump (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      const data = event.detail?.data

      if (isStruct(data)) {
        this.jump(data)
      }
    }
  }

  protected handleMediaEnded (): void {
    if (this.started) {
      if (this.hasNext === true) {
        this.go(1)
      }
    } else {
      this.mediaElement.setTime(0)
    }
  }

  protected handleRewind (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.rewind()
    }
  }

  protected handleStart (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.start()
    }
  }

  protected handleStop (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.stop()
    }
  }

  protected handleToggle (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.toggle()
    }
  }

  protected setPointer (pointer: number): void {
    this.pointer = pointer
    this.hasNext = this.pointer < this.listElement.items.length - 1
    this.hasPrevious = this.pointer > 0
  }

  protected setUpElementListeners (): void {
    this.addEventListener('scola-media-ended', this.handleMediaEndedBound)
    this.addEventListener('scola-player-back', this.handleBackBound)
    this.addEventListener('scola-player-fullscreen', this.handleFullscreenBound)
    this.addEventListener('scola-player-jump', this.handleJumpBound)
    this.addEventListener('scola-player-forward', this.handleForwardBound)
    this.addEventListener('scola-player-rewind', this.handleRewindBound)
    this.addEventListener('scola-player-start', this.handleStartBound)
    this.addEventListener('scola-player-stop', this.handleStopBound)
    this.addEventListener('scola-player-toggle', this.handleToggleBound)
    super.setUpElementListeners()
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-player-back', this.handleBackBound)
    window.addEventListener('scola-player-fullscreen', this.handleFullscreenBound)
    window.addEventListener('scola-player-jump', this.handleJumpBound)
    window.addEventListener('scola-player-forward', this.handleForwardBound)
    window.addEventListener('scola-player-rewind', this.handleRewindBound)
    window.addEventListener('scola-player-start', this.handleStartBound)
    window.addEventListener('scola-player-stop', this.handleStopBound)
    window.addEventListener('scola-player-toggle', this.handleToggleBound)
    super.setUpWindowListeners()
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-player-back', this.handleBackBound)
    window.removeEventListener('scola-player-fullscreen', this.handleFullscreenBound)
    window.removeEventListener('scola-player-jump', this.handleJumpBound)
    window.removeEventListener('scola-player-forward', this.handleForwardBound)
    window.removeEventListener('scola-player-rewind', this.handleRewindBound)
    window.removeEventListener('scola-player-start', this.handleStartBound)
    window.removeEventListener('scola-player-stop', this.handleStopBound)
    window.removeEventListener('scola-player-toggle', this.handleToggleBound)
    super.tearDownWindowListeners()
  }
}
