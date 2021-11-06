import { throttle } from 'throttle-debounce'

interface Edges {
  bottom: boolean
  left: boolean
  right: boolean
  top: boolean
}

interface Position {
  clientX: number
  clientY: number
}

interface Rect {
  height: number
  left: number
  top: number
  width: number
}

export interface ScolaInteractEvent {
  deltaX: number
  deltaY: number
  directionX: string
  directionY: string
  distanceX: number
  distanceY: number
  endX: number
  endY: number
  originalEvent: MouseEvent | TouchEvent
  startEdges: Edges
  startX: number
  startY: number
  type: string
  zoom: number
}

type Observer = (event: ScolaInteractEvent) => void

export class ScolaInteract {
  public element: HTMLElement

  public event: ScolaInteractEvent

  public mouse = false

  public observer?: Observer

  public target = 'window'

  public threshold = 0.1

  public touch = false

  public wheel = false

  protected handleMousedownBound = this.handleMousedown.bind(this)

  protected handleMousemoveBound = this.handleMousemove.bind(this)

  protected handleMouseupBound = this.handleMouseup.bind(this)

  protected handleTouchendBound = this.handleTouchend.bind(this)

  protected handleTouchmoveBound = this.handleTouchmove.bind(this)

  protected handleTouchstartBound = this.handleTouchstart.bind(this)

  protected handleWheelBound = throttle(250, true, this.handleWheel.bind(this))

  public constructor (element: HTMLElement) {
    this.element = element
  }

  public connect (): void {
    this.addTargetEventListeners()
  }

  public disconnect (): void {
    this.removeTargetEventListeners()
  }

  public observe (observer: Observer): void {
    this.observer = observer
  }

  protected addTargetEventListeners (): void {
    const target = this.determineTarget()

    if (this.mouse) {
      target.addEventListener('mousedown', this.handleMousedownBound)
    }

    if (this.touch) {
      target.addEventListener('touchstart', this.handleTouchstartBound, {
        passive: true
      })
    }

    if (this.wheel) {
      target.addEventListener('wheel', this.handleWheelBound)
    }
  }

  protected addWindowEventListeners (): void {
    window.addEventListener('mousemove', this.handleMousemoveBound)
    window.addEventListener('mouseup', this.handleMouseupBound)
    window.addEventListener('touchmove', this.handleTouchmoveBound)
    window.addEventListener('touchcancel', this.handleTouchendBound)
    window.addEventListener('touchend', this.handleTouchendBound)
  }

  protected createEvent (event: MouseEvent | TouchEvent, position: Position): ScolaInteractEvent {
    return {
      deltaX: 0,
      deltaY: 0,
      directionX: 'none',
      directionY: 'none',
      distanceX: 0,
      distanceY: 0,
      endX: position.clientX,
      endY: position.clientY,
      originalEvent: event,
      startEdges: this.determineStartEdges(position),
      startX: position.clientX,
      startY: position.clientY,
      type: 'none',
      zoom: 0
    }
  }

  protected determineBoundingRect (): Rect {
    if (this.target === 'window') {
      return {
        height: window.innerHeight,
        left: 0,
        top: 0,
        width: window.innerWidth
      }
    }

    const {
      height,
      left,
      top,
      width
    } = this.element.getBoundingClientRect()

    return {
      height,
      left,
      top,
      width
    }
  }

  protected determineDirectionX (deltaX: number): string {
    if (deltaX < 0) {
      return 'right'
    } else if (deltaX > 0) {
      return 'left'
    }

    return this.event.directionX
  }

  protected determineDirectionY (deltaY: number): string {
    if (deltaY > 0) {
      return 'up'
    } else if (deltaY < 0) {
      return 'down'
    }

    return this.event.directionY
  }

  protected determineStartEdges (position: Position): Edges {
    const boundingRect = this.determineBoundingRect()
    const thresholdRect = this.determineThresholdRect(boundingRect)

    const edges = {
      bottom: position.clientY > (thresholdRect.top + thresholdRect.height),
      left: position.clientX < thresholdRect.left,
      right: position.clientX > (thresholdRect.left + thresholdRect.width),
      top: position.clientY < thresholdRect.top
    }

    return edges
  }

  protected determineTarget (): GlobalEventHandlers {
    if (this.target === 'window') {
      return window
    }

    return this.element
  }

  protected determineThresholdRect (rect: Rect): Rect {
    return {
      height: rect.height - (2 * rect.height * this.threshold),
      left: rect.left + (rect.width * this.threshold),
      top: rect.top + (rect.height * this.threshold),
      width: rect.width - (2 * rect.width * this.threshold)
    }
  }

  protected handleEnd (event: MouseEvent | TouchEvent): void {
    this.event.originalEvent = event
    this.event.type = 'end'
    this.removeWindowEventListeners()
    this.observer?.(this.event)
  }

  protected handleMousedown (event: MouseEvent): void {
    this.handleStart(event, event)
  }

  protected handleMousemove (event: MouseEvent): void {
    this.handleMove(event, event)
  }

  protected handleMouseup (event: MouseEvent): void {
    this.handleEnd(event)
  }

  protected handleMove (event: MouseEvent | TouchEvent, position: Position): void {
    this.event.deltaX = this.event.endX - position.clientX
    this.event.deltaY = this.event.endY - position.clientY
    this.event.directionX = this.determineDirectionX(this.event.deltaX)
    this.event.directionY = this.determineDirectionY(this.event.deltaY)
    this.event.distanceX = this.event.startX - this.event.endX
    this.event.distanceY = this.event.startY - this.event.endY
    this.event.endX = position.clientX
    this.event.endY = position.clientY
    this.event.originalEvent = event
    this.event.type = 'move'
    this.observer?.(this.event)
  }

  protected handleStart (event: MouseEvent | TouchEvent, position: Position): void {
    this.addWindowEventListeners()
    this.event = this.createEvent(event, position)
    this.event.type = 'start'
    this.observer?.(this.event)
  }

  protected handleTouchend (event: TouchEvent): void {
    this.handleEnd(event)
  }

  protected handleTouchmove (event: TouchEvent): void {
    if (event.changedTouches.length === 1) {
      this.handleMove(event, event.changedTouches[0])
    }
  }

  protected handleTouchstart (event: TouchEvent): void {
    this.handleStart(event, event.changedTouches[0])
  }

  protected handleWheel (event: WheelEvent): void {
    this.event = this.createEvent(event, event)
    this.event.deltaX = event.deltaX
    this.event.deltaY = event.deltaY
    this.event.directionX = this.determineDirectionX(-this.event.deltaX)
    this.event.directionY = this.determineDirectionY(-this.event.deltaY)
    this.event.originalEvent = event
    this.event.type = 'wheel'
    this.event.zoom = 0
    this.observer?.(this.event)
  }

  protected removeTargetEventListeners (): void {
    const target = this.determineTarget()

    if (this.mouse) {
      target.removeEventListener('mousedown', this.handleMousedownBound)
    }

    if (this.touch) {
      target.removeEventListener('touchstart', this.handleTouchstartBound)
    }

    if (this.wheel) {
      target.removeEventListener('wheel', this.handleWheelBound)
    }
  }

  protected removeWindowEventListeners (): void {
    window.removeEventListener('mousemove', this.handleMousemoveBound)
    window.removeEventListener('mouseup', this.handleMouseupBound)
    window.removeEventListener('touchmove', this.handleTouchmoveBound)
    window.removeEventListener('touchcancel', this.handleTouchendBound)
    window.removeEventListener('touchend', this.handleTouchendBound)
  }
}
