import { ScolaBreakpoint, ScolaEvent, ScolaInteractor, ScolaMutator, ScolaObserver, ScolaPropagator } from '../helpers'
import type { ScolaBreakpointEvent, ScolaInteractorEvent } from '../helpers'
import { isArray, isStruct } from '../../common'
import { ScolaDivElement } from './div'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-carousel-back': CustomEvent
    'sc-carousel-clear': CustomEvent
    'sc-carousel-forward': CustomEvent
    'sc-carousel-go': CustomEvent
  }
}

type Axis = 'x' | 'y'

interface ScolaCarouselElementData extends Struct {
  elements: number
  pointer: number
}

export class ScolaCarouselElement extends HTMLDivElement implements ScolaElement {
  public axis: Axis

  public body: HTMLElement

  public breakpoint: ScolaBreakpoint

  public immediate = true

  public interactor: ScolaInteractor

  public items: Struct[] = []

  public locked = false

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public pointer: number

  public propagator: ScolaPropagator

  public resizer: ResizeObserver

  public templates: Map<string, HTMLTemplateElement>

  public threshold: number

  public transition: boolean

  protected handleBackBound = this.handleBack.bind(this)

  protected handleBreakpointBound = this.handleBreakpoint.bind(this)

  protected handleClearBound = this.handleClear.bind(this)

  protected handleForwardBound = this.handleForward.bind(this)

  protected handleGoBound = this.handleGo.bind(this)

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleResizerBound = this.handleResizer.bind(this)

  protected handleTransitionendBound = this.handleTransitionend.bind(this)

  public constructor () {
    super()
    this.breakpoint = new ScolaBreakpoint(this)
    this.interactor = new ScolaInteractor(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.resizer = new ResizeObserver(this.handleResizerBound)
    this.body = this.selectBody()
    this.templates = this.mutator.selectTemplates()
    this.reset()

    if (!this.templates.has('item')) {
      this.updateAttributes()
    }
  }

  public static define (): void {
    customElements.define('sc-carousel', ScolaCarouselElement, {
      extends: 'div'
    })
  }

  public back (): void {
    this.go(this.pointer - 1)
  }

  public clear (): void {
    Array
      .from(this.body.children)
      .forEach((child) => {
        child.remove()
      })

    this.items = []
    this.pointer = -1
  }

  public connectedCallback (): void {
    this.interactor.observe(this.handleInteractorBound)
    this.resizer.observe(this)
    this.interactor.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()

    window.requestAnimationFrame(() => {
      this.go(this.pointer)
    })
  }

  public disconnectedCallback (): void {
    this.interactor.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.resizer.disconnect()
    this.removeEventListeners()
  }

  public findPointer (id: string): number {
    return Array
      .from(this.body.children)
      .findIndex((element) => {
        return element.id === id
      })
  }

  public forward (): void {
    this.go(this.pointer + 1)
  }

  public getData (): ScolaCarouselElementData {
    return {
      elements: this.body.children.length,
      pointer: this.pointer + 1
    }
  }

  public go (pointer: number): void {
    if (
      pointer >= 0 &&
      pointer <= this.body.children.length - 1
    ) {
      this.pointer = pointer
    }

    this.moveToPointer()
  }

  public reset (): void {
    this.axis = (this.getAttribute('sc-axis') as Axis | null) ?? 'x'
    this.interactor.keyboard = this.breakpoint.parse('sc-interact-keyboard') === ''
    this.interactor.mouse = this.breakpoint.parse('sc-interact-mouse') === ''
    this.interactor.touch = this.breakpoint.parse('sc-interact-touch') === ''
    this.interactor.wheel = this.breakpoint.parse('sc-interact-wheel') === ''
    this.pointer = Number(this.getAttribute('sc-pointer') ?? -1)
    this.threshold = Number(this.getAttribute('sc-threshold') ?? 0.1)
    this.transition = this.breakpoint.parse('sc-transition', this.body) === ''
  }

  public setData (data: unknown): void {
    if (isArray(data)) {
      data.forEach((item) => {
        if (isStruct(item)) {
          this.items.push(item)
        }
      })

      this.pointer = 0
      this.update()
    } else {
      this.propagator.set(data)
    }
  }

  public toObject (): Struct {
    return {
      pointer: this.pointer
    }
  }

  public update (): void {
    this.updateElements()
    this.updateAttributes()
    this.moveToPointer()
    this.propagator.dispatch('update')
  }

  public updateAttributes (): void {
    this.setAttribute('sc-elements', this.body.children.length.toString())
    this.toggleAttribute('sc-has-next', this.pointer < this.body.children.length - 1)
    this.toggleAttribute('sc-has-previous', this.pointer > 0)
    this.setAttribute('sc-pointer', this.pointer.toString())
    this.setAttribute('sc-updated', Date.now().toString())
  }

  public updateElements (): void {
    this.items.forEach((item) => {
      this.appendElement(item)
    })
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-carousel-back', this.handleBackBound)
    this.addEventListener('sc-carousel-clear', this.handleClearBound)
    this.addEventListener('sc-carousel-forward', this.handleForwardBound)
    this.addEventListener('sc-carousel-go', this.handleGoBound)
    this.body.addEventListener('transitionend', this.handleTransitionendBound)
  }

  protected appendElement (item: Struct): void {
    const template = this.templates.get('item')?.content.cloneNode(true)

    if (
      template instanceof DocumentFragment &&
      template.firstElementChild !== null
    ) {
      const element = template.firstElementChild

      this.body.appendChild(template)

      window.requestAnimationFrame(() => {
        if (element instanceof ScolaDivElement) {
          element.setData(item)
        }
      })
    }
  }

  protected finalize (): void {
    if (this.transition) {
      this.immediate = false
    }

    if (!this.locked) {
      this.body.style.removeProperty('transition-timing-function')

      const elementBox = this.getBoundingClientRect()

      Array
        .from(this.body.children)
        .forEach((element) => {
          const itemBox = element.getBoundingClientRect()

          const hidden = !(
            itemBox.right <= elementBox.right &&
          itemBox.left >= elementBox.left
          )

          if (hidden) {
            element.toggleAttribute('hidden', true)
          } else {
            element.toggleAttribute('hidden', false)
          }
        })
    }

    this.locked = false
  }

  protected handleBack (): void {
    this.back()
  }

  protected handleBreakpoint (event: ScolaBreakpointEvent): void {
    if (event.changed) {
      this.reset()
    }
  }

  protected handleClear (): void {
    this.clear()
  }

  protected handleForward (): void {
    this.forward()
  }

  protected handleGo (event: CustomEvent): void {
    if (
      isStruct(event.detail) &&
      event.detail.pointer !== undefined
    ) {
      this.go(Number(event.detail.pointer))
    } else if (event instanceof ScolaEvent) {
      this.go(this.findPointer(event.element.id))
    }
  }

  protected handleInteractor (event: ScolaInteractorEvent): boolean {
    switch (event.type) {
      case 'end':
        return this.handleInteractorEnd(event)
      case 'move':
        return this.handleInteractorMove(event)
      case 'start':
        return this.handleInteractorStart(event)
      case 'wheel':
        return this.handleInteractorWheel(event)
      default:
        return false
    }
  }

  protected handleInteractorEnd (event: ScolaInteractorEvent): boolean {
    switch (this.axis) {
      case 'x':
        return this.handleInteractorEndX(event)
      case 'y':
        return this.handleInteractorEndY(event)
      default:
        return false
    }
  }

  protected handleInteractorEndX (event: ScolaInteractorEvent): boolean {
    if (this.interactor.dir === 'ltr') {
      return this.handleInteractorEndXLtr(event)
    }

    return this.handleInteractorEndXRtl(event)
  }

  protected handleInteractorEndXLtr (event: ScolaInteractorEvent): boolean {
    this.setTimingFunction(event.velocityX)

    window.requestAnimationFrame(() => {
      const elementBox = this.getBoundingClientRect()

      let left = 0

      const found = Array
        .from(this.body.children)
        .find((element, index) => {
          const itemBox = element.getBoundingClientRect()

          left += itemBox.width

          if (
            itemBox.left < elementBox.left &&
            itemBox.right > elementBox.left
          ) {
            this.moveToItemLeft(elementBox, itemBox, event.directionX, left, index)
            return true
          }

          return false
        })

      if (found === undefined) {
        this.pointer = 0
      }

      this.updateAttributes()
    })

    return true
  }

  protected handleInteractorEndXRtl (event: ScolaInteractorEvent): boolean {
    this.setTimingFunction(event.velocityX)

    window.requestAnimationFrame(() => {
      const elementBox = this.getBoundingClientRect()

      let right = 0

      const found = Array
        .from(this.body.children)
        .find((element, index) => {
          const itemBox = element.getBoundingClientRect()

          right += itemBox.width

          if (
            itemBox.right > elementBox.right &&
            itemBox.left < elementBox.right
          ) {
            this.moveToItemRight(elementBox, itemBox, event.directionX, right, index)
            return true
          }

          return false
        })

      if (found === undefined) {
        this.pointer = 0
      }

      this.updateAttributes()
    })

    return true
  }

  protected handleInteractorEndY (event: ScolaInteractorEvent): boolean {
    this.setTimingFunction(event.velocityY)

    window.requestAnimationFrame(() => {
      const elementBox = this.getBoundingClientRect()

      let top = 0

      const found = Array
        .from(this.body.children)
        .find((element, index) => {
          const itemBox = element.getBoundingClientRect()

          top += itemBox.height

          if (
            itemBox.top < elementBox.top &&
            itemBox.bottom > elementBox.top
          ) {
            this.moveToItemTop(elementBox, itemBox, event.directionY, top, index)
            return true
          }

          return false
        })

      if (found === undefined) {
        this.pointer = 0
      }

      this.updateAttributes()
    })

    return true
  }

  protected handleInteractorMove (event: ScolaInteractorEvent): boolean {
    switch (this.axis) {
      case 'x':
        return this.handleInteractorMoveX(event)
      case 'y':
        return this.handleInteractorMoveY(event)
      default:
        return false
    }
  }

  protected handleInteractorMoveX (event: ScolaInteractorEvent): boolean {
    if (this.interactor.dir === 'ltr') {
      return this.handleInteractorMoveXLtr(event)
    }

    return this.handleInteractorMoveXRtl(event)
  }

  protected handleInteractorMoveXLtr (event: ScolaInteractorEvent): boolean {
    const maxLeft = this.body.scrollWidth - this.clientWidth
    const left = new DOMMatrix(this.body.style.getPropertyValue('transform')).e

    this.body.style.setProperty('transform', `translate(${Math.min(Math.max(left + event.deltaX, -maxLeft), 0)}px)`)
    return true
  }

  protected handleInteractorMoveXRtl (event: ScolaInteractorEvent): boolean {
    const maxRight = this.body.scrollWidth - this.clientWidth
    const right = new DOMMatrix(this.body.style.getPropertyValue('transform')).e

    this.body.style.setProperty('transform', `translate(${Math.max(Math.min(right + event.deltaX, maxRight), 0)}px)`)
    return true
  }

  protected handleInteractorMoveY (event: ScolaInteractorEvent): boolean {
    const maxTop = this.body.scrollHeight - this.clientHeight
    const top = new DOMMatrix(this.body.style.getPropertyValue('transform')).f

    this.body.style.setProperty('transform', `translate(0,${Math.min(Math.max(top + event.deltaY, -maxTop), 0)}px)`)
    return true
  }

  protected handleInteractorStart (event: ScolaInteractorEvent): boolean {
    if (this.interactor.isKeyboard(event.originalEvent)) {
      return this.handleInteractorStartKeyboard(event.originalEvent)
    }

    this.body.style.setProperty('transition-property', 'none')
    return true
  }

  protected handleInteractorStartKeyboard (event: KeyboardEvent): boolean {
    if (this.interactor.isKeyBack(event)) {
      this.back()
    } else if (this.interactor.isKeyForward(event)) {
      this.forward()
    }

    return true
  }

  protected handleInteractorWheel (event: ScolaInteractorEvent): boolean {
    switch (this.axis) {
      case 'x':
        return this.handleInteractorWheelX(event)
      case 'y':
        return this.handleInteractorWheelY(event)
      default:
        return false
    }
  }

  protected handleInteractorWheelX (event: ScolaInteractorEvent): boolean {
    if (this.interactor.dir === 'ltr') {
      return this.handleInteractorWheelXLtr(event)
    }

    return this.handleInteractorWheelXRtl(event)
  }

  protected handleInteractorWheelXLtr (event: ScolaInteractorEvent): boolean {
    if ((
      event.axis === 'x' &&
      event.directionX === 'right'
    ) || (
      event.axis === 'y' &&
      event.directionY === 'up'
    )) {
      this.forward()
    } else if ((
      event.axis === 'x' &&
      event.directionX === 'left'
    ) || (
      event.axis === 'y' &&
      event.directionY === 'down'
    )) {
      this.back()
    }

    return true
  }

  protected handleInteractorWheelXRtl (event: ScolaInteractorEvent): boolean {
    if ((
      event.axis === 'x' &&
      event.directionX === 'left'
    ) || (
      event.axis === 'y' &&
      event.directionY === 'up'
    )) {
      this.forward()
    } else if ((
      event.axis === 'x' &&
      event.directionX === 'right'
    ) || (
      event.axis === 'y' &&
      event.directionY === 'down'
    )) {
      this.back()
    }

    return true
  }

  protected handleInteractorWheelY (event: ScolaInteractorEvent): boolean {
    if (event.directionY === 'up') {
      this.back()
    } else if (event.directionY === 'down') {
      this.forward()
    }

    return true
  }

  protected handleResizer (): void {
    this.immediate = true
    this.locked = true
    this.moveToPointer()
  }

  protected handleTransitionend (event: TransitionEvent): void {
    if (event.target === this.body) {
      this.finalize()
    }
  }

  protected moveToItemLeft (elementBox: DOMRect, itemBox: DOMRect, direction: string, left: number, index: number): void {
    const maxLeft = this.body.scrollWidth - this.clientWidth

    if (direction === 'right') {
      if (itemBox.right > (elementBox.left + (elementBox.width * this.threshold))) {
        if (left > maxLeft) {
          this.transform(-maxLeft, 0)
          this.pointer = this.body.children.length - 1
        } else {
          this.transform(-left + itemBox.width, 0)
          this.pointer = index
        }
      } else {
        this.transform(Math.max(-left, -maxLeft), 0)
        this.pointer = index + 1
      }
    } else if (direction === 'left') {
      if (itemBox.right < (elementBox.right - (elementBox.width * this.threshold))) {
        this.transform(Math.max(-left, -maxLeft), 0)
        this.pointer = index + 1
      } else {
        this.transform(-left + itemBox.width, 0)
        this.pointer = index
      }
    }
  }

  protected moveToItemRight (elementBox: DOMRect, itemBox: DOMRect, direction: string, right: number, index: number): void {
    const maxRight = this.body.scrollWidth - this.clientWidth

    if (direction === 'left') {
      if (itemBox.left < (elementBox.right - (elementBox.width * this.threshold))) {
        if (right > maxRight) {
          this.transform(maxRight, 0)
          this.pointer = this.body.children.length - 1
        } else {
          this.transform(right - itemBox.width, 0)
          this.pointer = index
        }
      } else {
        this.transform(Math.min(right, maxRight), 0)
        this.pointer = index + 1
      }
    } else if (direction === 'right') {
      if (itemBox.left > (elementBox.left + (elementBox.width * this.threshold))) {
        this.transform(Math.min(right, maxRight), 0)
        this.pointer = index + 1
      } else {
        this.transform(right - itemBox.width, 0)
        this.pointer = index
      }
    }
  }

  protected moveToItemTop (elementBox: DOMRect, itemBox: DOMRect, direction: string, top: number, index: number): void {
    const maxTop = this.body.scrollHeight - this.clientHeight

    if (direction === 'down') {
      if (itemBox.bottom > (elementBox.top + (elementBox.height * this.threshold))) {
        if (top > maxTop) {
          this.transform(0, -maxTop)
          this.pointer = this.body.children.length - 1
        } else {
          this.transform(0, -top + itemBox.height)
          this.pointer = index
        }
      } else {
        this.transform(0, Math.max(-top, -maxTop))
        this.pointer = index + 1
      }
    } else if (direction === 'up'
    ) {
      if (itemBox.bottom < (elementBox.bottom - (elementBox.height * this.threshold))) {
        this.transform(0, Math.max(-top, -maxTop))
        this.pointer = index + 1
      } else {
        this.transform(0, -top + itemBox.height)
        this.pointer = index
      }
    }
  }

  protected moveToPointer (): void {
    switch (this.axis) {
      case 'x':
        this.moveToPointerX()
        break
      case 'y':
        this.moveToPointerY()
        break
      default:
        break
    }

    this.updateAttributes()
  }

  protected moveToPointerX (): void {
    if (this.interactor.dir === 'ltr') {
      this.moveToPointerXLtr()
    } else {
      this.moveToPointerXRtl()
    }
  }

  protected moveToPointerXLtr (): void {
    const maxLeft = this.body.scrollWidth - this.clientWidth

    let left = 0

    Array
      .from(this.body.children)
      .find((element, index) => {
        const { width: elementWidth } = element.getBoundingClientRect()

        if (index === this.pointer) {
          this.transform(Math.max(-left, -maxLeft), 0)
          return true
        }

        left += elementWidth
        return false
      })
  }

  protected moveToPointerXRtl (): void {
    const maxRight = this.body.scrollWidth - this.clientWidth

    let right = 0

    Array
      .from(this.body.children)
      .find((element, index) => {
        const { width: elementWidth } = element.getBoundingClientRect()

        if (index === this.pointer) {
          this.transform(Math.min(right, maxRight), 0)
          return true
        }

        right += elementWidth
        return false
      })
  }

  protected moveToPointerY (): void {
    const maxTop = this.body.scrollHeight - this.clientHeight

    let top = 0

    Array
      .from(this.body.children)
      .find((element, index) => {
        const { height: elementHeight } = element.getBoundingClientRect()

        if (index === this.pointer) {
          this.transform(0, Math.max(-top, -maxTop))
          return true
        }

        top += elementHeight
        return false
      })
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-carousel-back', this.handleBackBound)
    this.removeEventListener('sc-carousel-clear', this.handleClearBound)
    this.removeEventListener('sc-carousel-forward', this.handleForwardBound)
    this.removeEventListener('sc-carousel-go', this.handleGoBound)
    this.body.removeEventListener('transitionend', this.handleTransitionendBound)
  }

  protected selectBody (): HTMLElement {
    if (this.firstElementChild instanceof HTMLElement) {
      return this.firstElementChild
    }

    const body = document.createElement('div')

    this.appendChild(body)
    return body
  }

  protected setTimingFunction (velocity: number): void {
    this.body.style.setProperty('transition-timing-function', this.interactor.getTimingFunction(velocity))
  }

  protected transform (translateX: number, translateY: number): void {
    if (this.immediate) {
      this.body.style.setProperty('transition-property', 'none')
    } else {
      this.body.style.setProperty('transition-property', 'transform')
    }

    this.body.style.setProperty('transform', `translate(${translateX}px,${translateY}px)`)

    if (this.immediate) {
      this.finalize()
    }
  }
}
