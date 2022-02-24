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

interface Scroll {
  bottom: boolean
  element: HTMLElement | null
  left: boolean
  right: boolean
  top: boolean
}

type Callback = (event: ScolaInteractorEvent) => boolean

type DirectionX = 'left' | 'none' | 'right'

type DirectionY = 'down' | 'none' | 'up'

type Target = 'element' | 'window'

type Type = 'click' | 'contextmenu' | 'dblclick' | 'end' | 'move' | 'none' | 'start' | 'wheel' | 'zoom'

type InteractorEvent = KeyboardEvent | MouseEvent | TouchEvent | WheelEvent

export interface ScolaInteractorEvent<Event = InteractorEvent> {
  axis: 'none' | 'x' | 'y'
  count: number
  deltaT: number
  deltaX: number
  deltaY: number
  directionX: DirectionX
  directionY: DirectionY
  distanceX: number
  distanceY: number
  endT: number
  endX: number
  endY: number
  originalEvent: Event
  startEdges: Edges
  startScroll: Scroll
  startT: number
  startX: number
  startY: number
  type: Type
  velocityX: number
  velocityY: number
}

export class ScolaInteractor {
  public static dblclickTimeout = 500

  public static edgeThreshold = 0.1

  public static element?: HTMLElement

  public callback?: Callback

  public cancel = false

  public dblclickTimeout = ScolaInteractor.dblclickTimeout

  public edgeThreshold = ScolaInteractor.edgeThreshold

  public element: HTMLElement

  public event: ScolaInteractorEvent

  public keyboard = false

  public mouse = false

  public target: Target = 'element'

  public touch = false

  public wheel = false

  public get dir (): string {
    if (document.dir === '') {
      return 'ltr'
    }

    return document.dir
  }

  public get hasKeyboard (): boolean {
    return typeof window.onkeydown !== 'undefined'
  }

  public get hasMouse (): boolean {
    return matchMedia('(pointer: fine)').matches
  }

  public get hasTouch (): boolean {
    return window.matchMedia('(pointer: coarse)').matches
  }

  public get hasWheel (): boolean {
    return typeof window.onwheel !== 'undefined'
  }

  public get timestamp (): number {
    if (typeof this.event === 'undefined') {
      return 0
    }

    return this.event.endT
  }

  protected handleContextmenuBound = this.handleContextmenu.bind(this)

  protected handleDragendBound = this.handleDragend.bind(this)

  protected handleKeydownBound = this.handleKeydown.bind(this)

  protected handleKeyupBound = this.handleKeyup.bind(this)

  protected handleMousedownBound = this.handleMousedown.bind(this)

  protected handleMousemoveBound = this.handleMousemove.bind(this)

  protected handleMouseupBound = this.handleMouseup.bind(this)

  protected handleTouchendBound = this.handleTouchend.bind(this)

  protected handleTouchmoveBound = this.handleTouchmove.bind(this)

  protected handleTouchstartBound = this.handleTouchstart.bind(this)

  protected handleWheelBound = throttle(250, true, this.handleWheel.bind(this))

  protected handleWheelPreventBound = this.handleWheelPrevent.bind(this)

  public constructor (element: HTMLElement) {
    this.element = element
  }

  public connect (): void {
    this.addEventListenersStart()
  }

  public disconnect (): void {
    this.removeEventListenersStart()
  }

  public getTimingFunction (velocity: number): string {
    return `cubic-bezier(0, 1, ${Math.max(0, 1 - (Math.abs(velocity) / 4))}, 1)`
  }

  public isArrowEnd (event: InteractorEvent): boolean {
    return event instanceof KeyboardEvent && (
      (
        this.dir === 'ltr' &&
        event.code === 'ArrowRight'
      ) || (
        this.dir === 'rtl' &&
        event.code === 'ArrowLeft'
      )
    )
  }

  public isArrowStart (event: InteractorEvent): boolean {
    return event instanceof KeyboardEvent && (
      (
        this.dir === 'ltr' &&
        event.code === 'ArrowLeft'
      ) || (
        this.dir === 'rtl' &&
        event.code === 'ArrowRight'
      )
    )
  }

  public isDblclick (event: InteractorEvent, position: Position): boolean {
    if (typeof this.event === 'undefined') {
      return false
    }

    return (
      (event.timeStamp - this.event.endT) < this.dblclickTimeout &&
      position.clientX - this.event.endX === 0 &&
      position.clientY - this.event.endY === 0
    )
  }

  public isKey (event: InteractorEvent, code: string): boolean {
    return (
      event instanceof KeyboardEvent &&
      event.code === code
    )
  }

  public isKeyBack (event: InteractorEvent): boolean {
    return event instanceof KeyboardEvent && (
      (
        event.code === 'ArrowUp' || (
          this.dir === 'ltr' &&
          event.code === 'ArrowLeft'
        ) || (
          this.dir === 'rtl' &&
          event.code === 'ArrowRight'
        )
      )
    )
  }

  public isKeyForward (event: InteractorEvent): boolean {
    return (
      event instanceof KeyboardEvent && (
        event.code === 'ArrowDown' || (
          this.dir === 'ltr' &&
          event.code === 'ArrowRight'
        ) || (
          this.dir === 'rtl' &&
          event.code === 'ArrowLeft'
        )
      )
    )
  }

  public isKeyboard (event: InteractorEvent, subtype = ''): event is KeyboardEvent {
    return event.type.startsWith(`key${subtype}`)
  }

  public isMouse (event: InteractorEvent, subtype = ''): event is MouseEvent {
    return event.type.startsWith(`mouse${subtype}`)
  }

  public isTouch (event: InteractorEvent, subtype = ''): event is TouchEvent {
    return event.type.startsWith(`touch${subtype}`)
  }

  public observe (callback: Callback): void {
    this.callback = callback
  }

  protected addEventListenersMoveEnd (): void {
    window.addEventListener('dragend', this.handleDragendBound)
    window.addEventListener('keyup', this.handleKeyupBound)
    window.addEventListener('mousemove', this.handleMousemoveBound)
    window.addEventListener('mouseup', this.handleMouseupBound)
    window.addEventListener('touchmove', this.handleTouchmoveBound)
    window.addEventListener('touchcancel', this.handleTouchendBound)
    window.addEventListener('touchend', this.handleTouchendBound)
  }

  protected addEventListenersStart (): void {
    const target = this.determineTarget()

    if (this.keyboard) {
      target.addEventListener('keydown', this.handleKeydownBound)

      if (target !== this.element) {
        this.element.addEventListener('keydown', this.handleKeydownBound)
      }
    }

    if (this.mouse) {
      target.addEventListener('contextmenu', this.handleContextmenuBound)
      target.addEventListener('mousedown', this.handleMousedownBound)

      if (target !== this.element) {
        this.element.addEventListener('mousedown', this.handleMousedownBound)
      }
    }

    if (this.touch) {
      target.addEventListener('touchstart', this.handleTouchstartBound)

      if (target !== this.element) {
        this.element.addEventListener('touchstart', this.handleTouchstartBound)
      }
    }

    if (this.wheel) {
      target.addEventListener('wheel', this.handleWheelBound)
      target.addEventListener('wheel', this.handleWheelPreventBound)

      if (target !== this.element) {
        this.element.addEventListener('wheel', this.handleWheelBound)
      }
    }
  }

  protected createEvent (event: InteractorEvent): ScolaInteractorEvent {
    return {
      axis: 'none',
      count: 1,
      deltaT: 0,
      deltaX: 0,
      deltaY: 0,
      directionX: 'none',
      directionY: 'none',
      distanceX: 0,
      distanceY: 0,
      endT: event.timeStamp,
      endX: 0,
      endY: 0,
      originalEvent: event,
      startEdges: {
        bottom: false,
        left: false,
        right: false,
        top: false
      },
      startScroll: this.determineStartScroll(event),
      startT: event.timeStamp,
      startX: 0,
      startY: 0,
      type: 'none',
      velocityX: 0,
      velocityY: 0
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

  protected determineDirectionX (deltaX: number): DirectionX {
    if (deltaX > 0) {
      return 'right'
    } else if (deltaX < 0) {
      return 'left'
    }

    return this.event.directionX
  }

  protected determineDirectionY (deltaY: number): DirectionY {
    if (deltaY < 0) {
      return 'up'
    } else if (deltaY > 0) {
      return 'down'
    }

    return this.event.directionY
  }

  protected determineEdgeThreshold (rect: Rect): Rect {
    return {
      height: rect.height - (2 * rect.height * this.edgeThreshold),
      left: rect.left + (rect.width * this.edgeThreshold),
      top: rect.top + (rect.height * this.edgeThreshold),
      width: rect.width - (2 * rect.width * this.edgeThreshold)
    }
  }

  protected determineEdges (position: Position): Edges {
    const boundingRect = this.determineBoundingRect()
    const thresholdRect = this.determineEdgeThreshold(boundingRect)

    const edges = {
      bottom: position.clientY > (thresholdRect.top + thresholdRect.height),
      left: position.clientX < thresholdRect.left,
      right: position.clientX > (thresholdRect.left + thresholdRect.width),
      top: position.clientY < thresholdRect.top
    }

    return edges
  }

  protected determineStartScroll (event: InteractorEvent): Scroll {
    const scroll: Scroll = {
      bottom: false,
      element: null,
      left: false,
      right: false,
      top: false
    }

    if (event.target instanceof HTMLElement) {
      scroll.element = event.target.closest<HTMLElement>('[sc-scrollbar]')
    }

    if (scroll.element !== null) {
      scroll.bottom = (scroll.element.scrollTop + scroll.element.offsetHeight) < scroll.element.scrollHeight
      scroll.top = scroll.element.scrollTop > 0

      if (this.dir === 'ltr') {
        scroll.left = scroll.element.scrollLeft > 0
        scroll.right = (scroll.element.scrollLeft + scroll.element.offsetWidth) < scroll.element.scrollWidth
      } else if (this.dir === 'rtl') {
        scroll.left = (scroll.element.scrollLeft - scroll.element.offsetWidth) > -scroll.element.scrollWidth
        scroll.right = scroll.element.scrollLeft < 0
      }
    }

    return scroll
  }

  protected determineTarget (): GlobalEventHandlers {
    if (this.target === 'window') {
      return window
    }

    return this.element
  }

  protected handleContextmenu (event: MouseEvent): void {
    this.event = this.createEvent(event)
    this.event.endX = event.clientX
    this.event.endY = event.clientY
    this.event.startEdges = this.determineEdges(event)
    this.event.startX = this.event.endX
    this.event.startY = this.event.endY
    this.event.type = 'contextmenu'

    const handled = this.callback?.(this.event)

    if (handled === true) {
      event.preventDefault()

      if (this.cancel) {
        event.stopPropagation()
      }
    }
  }

  protected handleDblclick (event: InteractorEvent, position: Position): void {
    this.event = this.createEvent(event)
    this.event.endX = position.clientX
    this.event.endY = position.clientY
    this.event.startEdges = this.determineEdges(position)
    this.event.startX = this.event.endX
    this.event.startY = this.event.endY
    this.event.type = 'dblclick'

    const handled = this.callback?.(this.event)

    if (handled === true) {
      if (this.cancel) {
        event.stopPropagation()
      }
    }
  }

  protected handleDragend (event: MouseEvent): void {
    if (!this.touch) {
      this.handleEnd(event)
    }
  }

  protected handleEnd (event: InteractorEvent): void {
    ScolaInteractor.element = undefined
    this.removeEventListenersMoveEnd()
    this.event.originalEvent = event
    this.event.type = 'end'
    this.callback?.(this.event)

    if (
      this.event.distanceX === 0 &&
      this.event.distanceY === 0
    ) {
      this.event.type = 'click'

      const handled = this.callback?.(this.event)

      if (handled === true) {
        if (this.cancel) {
          event.stopPropagation()
        }
      }
    }
  }

  protected handleKeydown (event: KeyboardEvent): void {
    this.handleStartNoPointers(event)
  }

  protected handleKeyup (event: KeyboardEvent): void {
    this.handleEnd(event)
  }

  protected handleMousedown (event: MouseEvent): void {
    if (!this.touch) {
      if (this.isDblclick(event, event)) {
        this.handleDblclick(event, event)
      } else {
        this.handleStartOnePointer(event, event)
      }
    }
  }

  protected handleMousemove (event: MouseEvent): void {
    if (!this.touch) {
      this.handleMoveOnePointer(event, event)
    }
  }

  protected handleMouseup (event: MouseEvent): void {
    if (!this.touch) {
      this.handleEnd(event)
    }
  }

  protected handleMoveOnePointer (event: InteractorEvent, position: Position): void {
    if (
      ScolaInteractor.element === undefined ||
      ScolaInteractor.element === this.element
    ) {
      this.updateEvent(event, position)
      this.event.type = 'move'

      const handled = this.callback?.(this.event)

      if (handled === true) {
        event.preventDefault()
        ScolaInteractor.element = this.element
      }
    }
  }

  protected handleMoveTwoPointers (event: TouchEvent): void {
    if (
      ScolaInteractor.element === undefined ||
      ScolaInteractor.element === this.element
    ) {
      const position = {
        clientX: Math.abs(event.touches[1].pageX - event.touches[0].pageX),
        clientY: Math.abs(event.touches[1].pageY - event.touches[0].pageY)
      }

      this.updateEvent(event, position)
      this.event.type = 'zoom'

      const handled = this.callback?.(this.event)

      if (handled === true) {
        event.preventDefault()
        ScolaInteractor.element = this.element
      }
    }
  }

  protected handleStartNoPointers (event: InteractorEvent): void {
    this.event = this.createEvent(event)
    this.event.endX = 0
    this.event.endY = 0
    this.event.startX = this.event.endX
    this.event.startY = this.event.endY
    this.event.type = 'start'

    const handled = this.callback?.(this.event)

    if (handled === true) {
      if (this.cancel) {
        event.stopPropagation()
      }

      this.addEventListenersMoveEnd()
    }
  }

  protected handleStartOnePointer (event: InteractorEvent, position: Position): void {
    this.event = this.createEvent(event)
    this.event.endX = position.clientX
    this.event.endY = position.clientY
    this.event.startEdges = this.determineEdges(position)
    this.event.startX = this.event.endX
    this.event.startY = this.event.endY
    this.event.type = 'start'

    const handled = this.callback?.(this.event)

    if (handled === true) {
      if (this.cancel) {
        event.stopPropagation()
      }

      this.addEventListenersMoveEnd()
    }
  }

  protected handleStartTwoPointers (event: TouchEvent): void {
    this.event = this.createEvent(event)
    this.event.endX = Math.abs(event.touches[1].pageX - event.touches[0].pageX)
    this.event.endY = Math.abs(event.touches[1].pageY - event.touches[0].pageY)
    this.event.startX = this.event.endX
    this.event.startY = this.event.endY
    this.event.type = 'zoom'

    const handled = this.callback?.(this.event)

    if (handled === true) {
      if (this.cancel) {
        event.stopPropagation()
      }

      this.addEventListenersMoveEnd()
    }
  }

  protected handleTouchend (event: TouchEvent): void {
    if (event.touches.length === 0) {
      this.handleEnd(event)
    }
  }

  protected handleTouchmove (event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.handleMoveOnePointer(event, event.touches[0])
    } else if (event.touches.length === 2) {
      this.handleMoveTwoPointers(event)
    }
  }

  protected handleTouchstart (event: TouchEvent): void {
    if (event.touches.length === 1) {
      if (this.isDblclick(event, event.touches[0])) {
        this.handleDblclick(event, event.touches[0])
      } else {
        this.handleStartOnePointer(event, event.touches[0])
      }
    } else if (event.touches.length === 2) {
      this.handleStartTwoPointers(event)
    }
  }

  protected handleWheel (event: WheelEvent): void {
    if (event.ctrlKey) {
      this.handleWheelZoom(event)
    } else {
      this.handleWheelDefault(event)
    }
  }

  protected handleWheelDefault (event: WheelEvent): void {
    if (
      typeof this.event === 'undefined' ||
      this.event.type !== 'wheel'
    ) {
      this.event = this.createEvent(event)
      this.event.type = 'wheel'
    }

    this.event.axis = 'none'
    this.event.endX = 0
    this.event.endY = 0
    this.event.distanceX = 0
    this.event.distanceY = 0

    this.updateEvent(event, {
      clientX: event.deltaX,
      clientY: event.deltaY
    })

    this.callback?.(this.event)
  }

  protected handleWheelPrevent (event: WheelEvent): void {
    if (event.ctrlKey) {
      event.preventDefault()
    }
  }

  protected handleWheelZoom (event: WheelEvent): void {
    if (
      typeof this.event === 'undefined' ||
      this.event.type !== 'zoom'
    ) {
      this.event = this.createEvent(event)
      this.event.type = 'zoom'
    }

    this.event.axis = 'none'
    this.event.distanceX = 0
    this.event.distanceY = 0
    this.event.endX = 0
    this.event.endY = 0

    this.updateEvent(event, {
      clientX: event.deltaX,
      clientY: event.deltaY
    })

    this.callback?.(this.event)
  }

  protected removeEventListenersMoveEnd (): void {
    window.removeEventListener('dragend', this.handleDragendBound)
    window.removeEventListener('keyup', this.handleKeyupBound)
    window.removeEventListener('mousemove', this.handleMousemoveBound)
    window.removeEventListener('mouseup', this.handleMouseupBound)
    window.removeEventListener('touchmove', this.handleTouchmoveBound)
    window.removeEventListener('touchcancel', this.handleTouchendBound)
    window.removeEventListener('touchend', this.handleTouchendBound)
  }

  protected removeEventListenersStart (): void {
    const target = this.determineTarget()

    if (this.keyboard) {
      target.removeEventListener('keydown', this.handleKeydownBound)

      if (target !== this.element) {
        this.element.removeEventListener('keydown', this.handleKeydownBound)
      }
    }

    if (this.mouse) {
      target.removeEventListener('mousedown', this.handleMousedownBound)

      if (target !== this.element) {
        this.element.removeEventListener('mousedown', this.handleMousedownBound)
      }
    }

    if (this.touch) {
      target.removeEventListener('touchstart', this.handleTouchstartBound)

      if (target !== this.element) {
        this.element.removeEventListener('touchstart', this.handleTouchstartBound)
      }
    }

    if (this.wheel) {
      target.removeEventListener('wheel', this.handleWheelBound)
      target.removeEventListener('wheel', this.handleWheelPreventBound)

      if (target !== this.element) {
        this.element.removeEventListener('wheel', this.handleWheelBound)
      }
    }
  }

  protected updateEvent (event: InteractorEvent, position: Position): void {
    this.event.count += 1
    this.event.deltaT = event.timeStamp - this.event.endT
    this.event.deltaX = position.clientX - this.event.endX
    this.event.deltaY = position.clientY - this.event.endY
    this.event.directionX = this.determineDirectionX(this.event.deltaX)
    this.event.directionY = this.determineDirectionY(this.event.deltaY)
    this.event.distanceX += this.event.deltaX
    this.event.distanceY += this.event.deltaY
    this.event.endT = event.timeStamp
    this.event.endX = position.clientX
    this.event.endY = position.clientY
    this.event.originalEvent = event
    this.event.velocityX = this.event.deltaX / this.event.deltaT
    this.event.velocityY = this.event.deltaY / this.event.deltaT

    if (this.event.axis === 'none') {
      if (Math.abs(this.event.distanceX) > Math.abs(this.event.distanceY)) {
        this.event.axis = 'x'
      } else if (Math.abs(this.event.distanceY) > Math.abs(this.event.distanceX)) {
        this.event.axis = 'y'
      }
    }
  }
}
