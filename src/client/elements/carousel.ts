import { isArray, isStruct } from '../../common'
import { ScolaBreakpoint } from '../helpers/breakpoint'
import type { ScolaBreakpointEvent } from '../helpers/breakpoint'
import { ScolaDivElement } from './div'
import type { ScolaElement } from './element'
import { ScolaEvent } from '../helpers/event'
import { ScolaInteract } from '../helpers/interact'
import type { ScolaInteractEvent } from '../helpers/interact'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-carousel-back': CustomEvent
    'sc-carousel-forward': CustomEvent
    'sc-carousel-go': CustomEvent
  }
}

export class ScolaCarouselElement extends HTMLDivElement implements ScolaElement {
  public axis: string

  public body: HTMLElement

  public breakpoint: ScolaBreakpoint

  public interact: ScolaInteract

  public items: Struct[] = []

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public pointer: number

  public propagator: ScolaPropagator

  public template: HTMLTemplateElement | null

  public threshold: number

  protected handleBackBound = this.handleBack.bind(this)

  protected handleBreakpointBound = this.handleBreakpoint.bind(this)

  protected handleForwardBound = this.handleForward.bind(this)

  protected handleGoBound = this.handleGo.bind(this)

  protected handleInteractBound = this.handleInteract.bind(this)

  protected handleTransitionendBound = this.handleTransitionend.bind(this)

  public constructor () {
    super()
    this.breakpoint = new ScolaBreakpoint(this)
    this.interact = new ScolaInteract(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.template = this.mutator.selectTemplate('item')

    if (this.firstElementChild instanceof HTMLElement) {
      this.body = this.firstElementChild
    }

    this.reset()

    if (this.template === null) {
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
    this.items = []
    this.pointer = -1
  }

  public connectedCallback (): void {
    this.interact.observe(this.handleInteractBound)
    this.interact.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    this.interact.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public forward (): void {
    this.go(this.pointer + 1)
  }

  public getData (): Struct[] {
    return this.items
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
    this.axis = this.getAttribute('sc-axis') ?? 'x'
    this.interact.keyboard = this.breakpoint.parse('sc-interact-keyboard') === ''
    this.interact.mouse = this.breakpoint.parse('sc-interact-mouse') === ''
    this.interact.touch = this.breakpoint.parse('sc-interact-touch') === ''
    this.interact.wheel = this.breakpoint.parse('sc-interact-wheel') === ''
    this.pointer = Number(this.getAttribute('sc-pointer') ?? -1)
    this.threshold = Number(this.getAttribute('sc-threshold') ?? 0.1)
  }

  public setData (data: unknown): void {
    this.clear()

    if (isArray(data)) {
      data.forEach((item) => {
        if (isStruct(item)) {
          this.items.push(item)
        }
      })

      this.pointer = 0
      this.update()
    }
  }

  public update (): void {
    this.propagator.dispatch('beforeupdate', [{}])
    this.updateElements()
    this.updateAttributes()
    this.moveToPointer()

    window.requestAnimationFrame(() => {
      this.propagator.dispatch('update', [{}])
    })
  }

  public updateAttributes (): void {
    this.setAttribute('sc-elements', this.body.children.length.toString())
    this.toggleAttribute('sc-has-next', this.pointer < this.body.children.length - 1)
    this.toggleAttribute('sc-has-previous', this.pointer > 0)
    this.setAttribute('sc-pointer', this.pointer.toString())
  }

  public updateElements (): void {
    Array
      .from(this.body.children)
      .forEach((child) => {
        child.remove()
      })

    this.items.forEach((item) => {
      this.appendElement(item)
    })
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-carousel-back', this.handleBackBound)
    this.addEventListener('sc-carousel-forward', this.handleForwardBound)
    this.addEventListener('sc-carousel-go', this.handleGoBound)
    this.body.addEventListener('transitionend', this.handleTransitionendBound)
  }

  protected appendElement (item: Struct): void {
    const template = this.template?.content.cloneNode(true)

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

        let data = {}

        if (element instanceof ScolaDivElement) {
          data = element.getData()
        }

        if (hidden) {
          element.toggleAttribute('hidden', true)
          this.propagator.dispatch('hide', [data])
        } else {
          element.toggleAttribute('hidden', false)
          this.propagator.dispatch('show', [data])
        }
      })
  }

  protected findPointer (element: HTMLElement): number {
    return Array.prototype.indexOf.call(this.body.children, element)
  }

  protected handleBack (): void {
    this.back()
  }

  protected handleBreakpoint (event: ScolaBreakpointEvent): void {
    if (event.changed) {
      this.reset()
    }
  }

  protected handleForward (): void {
    this.forward()
  }

  protected handleGo (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      if (event.detail.pointer === undefined) {
        if (event instanceof ScolaEvent) {
          this.go(this.findPointer(event.element))
        }
      } else {
        this.go(Number(event.detail.pointer))
      }
    }
  }

  protected handleInteract (event: ScolaInteractEvent): boolean {
    switch (event.type) {
      case 'end':
        return this.handleInteractEnd(event)
      case 'move':
        return this.handleInteractMove(event)
      case 'start':
        return this.handleInteractStart(event)
      case 'wheel':
        return this.handleInteractWheel(event)
      default:
        return false
    }
  }

  protected handleInteractEnd (event: ScolaInteractEvent): boolean {
    switch (this.axis) {
      case 'x':
        return this.handleInteractEndX(event)
      case 'y':
        return this.handleInteractEndY(event)
      default:
        return false
    }
  }

  protected handleInteractEndX (event: ScolaInteractEvent): boolean {
    if (this.interact.dir === 'rtl') {
      return this.handleInteractEndXRtl(event)
    }

    return this.handleInteractEndXLtr(event)
  }

  protected handleInteractEndXLtr (event: ScolaInteractEvent): boolean {
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

  protected handleInteractEndXRtl (event: ScolaInteractEvent): boolean {
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

  protected handleInteractEndY (event: ScolaInteractEvent): boolean {
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

  protected handleInteractMove (event: ScolaInteractEvent): boolean {
    switch (this.axis) {
      case 'x':
        return this.handleInteractMoveX(event)
      case 'y':
        return this.handleInteractMoveY(event)
      default:
        return false
    }
  }

  protected handleInteractMoveX (event: ScolaInteractEvent): boolean {
    if (this.interact.dir === 'rtl') {
      return this.handleInteractMoveXRtl(event)
    }

    return this.handleInteractMoveXLtr(event)
  }

  protected handleInteractMoveXLtr (event: ScolaInteractEvent): boolean {
    const maxLeft = this.body.scrollWidth - this.clientWidth
    const left = new DOMMatrix(this.body.style.transform).e

    this.body.style.setProperty('transform', `translate(${Math.min(Math.max(left + event.deltaX, -maxLeft), 0)}px)`)
    return true
  }

  protected handleInteractMoveXRtl (event: ScolaInteractEvent): boolean {
    const maxRight = this.body.scrollWidth - this.clientWidth
    const right = new DOMMatrix(this.body.style.transform).e

    this.body.style.setProperty('transform', `translate(${Math.max(Math.min(right + event.deltaX, maxRight), 0)}px)`)
    return true
  }

  protected handleInteractMoveY (event: ScolaInteractEvent): boolean {
    const maxTop = this.body.scrollHeight - this.clientHeight
    const top = new DOMMatrix(this.body.style.transform).f

    this.body.style.setProperty('transform', `translate(0,${Math.min(Math.max(top + event.deltaY, -maxTop), 0)}px)`)
    return true
  }

  protected handleInteractStart (event: ScolaInteractEvent): boolean {
    if (this.interact.isKeyboard(event.originalEvent)) {
      return this.handleInteractStartKeyboard(event.originalEvent)
    }

    this.body.style.setProperty('transition-property', 'none')
    return true
  }

  protected handleInteractStartKeyboard (event: KeyboardEvent): boolean {
    if (this.interact.isKeyBack(event)) {
      this.back()
    } else if (this.interact.isKeyForward(event)) {
      this.forward()
    }

    return true
  }

  protected handleInteractWheel (event: ScolaInteractEvent): boolean {
    switch (this.axis) {
      case 'x':
        return this.handleInteractWheelX(event)
      case 'y':
        return this.handleInteractWheelY(event)
      default:
        return false
    }
  }

  protected handleInteractWheelX (event: ScolaInteractEvent): boolean {
    if (this.interact.dir === 'rtl') {
      return this.handleInteractWheelXRtl(event)
    }

    return this.handleInteractWheelXLtr(event)
  }

  protected handleInteractWheelXLtr (event: ScolaInteractEvent): boolean {
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

  protected handleInteractWheelXRtl (event: ScolaInteractEvent): boolean {
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

  protected handleInteractWheelY (event: ScolaInteractEvent): boolean {
    if (event.directionY === 'up') {
      this.back()
    } else if (event.directionY === 'down') {
      this.forward()
    }

    return true
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
          this.body.style.setProperty('transition-property', 'transform')
          this.body.style.setProperty('transform', `translate(${-maxLeft}px)`)
          this.pointer = this.body.children.length - 1
        } else {
          this.body.style.setProperty('transition-property', 'transform')
          this.body.style.setProperty('transform', `translate(${-left + itemBox.width}px)`)
          this.pointer = index
        }
      } else {
        this.body.style.setProperty('transition-property', 'transform')
        this.body.style.setProperty('transform', `translate(${Math.max(-left, -maxLeft)}px)`)
        this.pointer = index + 1
      }
    } else if (direction === 'left') {
      if (itemBox.right < (elementBox.right - (elementBox.width * this.threshold))) {
        this.body.style.setProperty('transition-property', 'transform')
        this.body.style.setProperty('transform', `translate(${Math.max(-left, -maxLeft)}px)`)
        this.pointer = index + 1
      } else {
        this.body.style.setProperty('transition-property', 'transform')
        this.body.style.setProperty('transform', `translate(${-left + itemBox.width}px)`)
        this.pointer = index
      }
    }
  }

  protected moveToItemRight (elementBox: DOMRect, itemBox: DOMRect, direction: string, right: number, index: number): void {
    const maxRight = this.body.scrollWidth - this.clientWidth

    if (direction === 'left') {
      if (itemBox.left < (elementBox.right - (elementBox.width * this.threshold))) {
        if (right > maxRight) {
          this.body.style.setProperty('transition-property', 'transform')
          this.body.style.setProperty('transform', `translate(${maxRight}px)`)
          this.pointer = this.body.children.length - 1
        } else {
          this.body.style.setProperty('transition-property', 'transform')
          this.body.style.setProperty('transform', `translate(${right - itemBox.width}px)`)
          this.pointer = index
        }
      } else {
        this.body.style.setProperty('transition-property', 'transform')
        this.body.style.setProperty('transform', `translate(${Math.min(right, maxRight)}px)`)
        this.pointer = index + 1
      }
    } else if (direction === 'right') {
      if (itemBox.left > (elementBox.left + (elementBox.width * this.threshold))) {
        this.body.style.setProperty('transition-property', 'transform')
        this.body.style.setProperty('transform', `translate(${Math.min(right, maxRight)}px)`)
        this.pointer = index + 1
      } else {
        this.body.style.setProperty('transition-property', 'transform')
        this.body.style.setProperty('transform', `translate(${right - itemBox.width}px)`)
        this.pointer = index
      }
    }
  }

  protected moveToItemTop (elementBox: DOMRect, itemBox: DOMRect, direction: string, top: number, index: number): void {
    const maxTop = this.body.scrollHeight - this.clientHeight

    if (direction === 'down') {
      if (itemBox.bottom > (elementBox.top + (elementBox.height * this.threshold))) {
        if (top > maxTop) {
          this.body.style.setProperty('transition-property', 'transform')
          this.body.style.setProperty('transform', `translate(0,${-maxTop}px)`)
          this.pointer = this.body.children.length - 1
        } else {
          this.body.style.setProperty('transition-property', 'transform')
          this.body.style.setProperty('transform', `translate(0,${-top + itemBox.height}px)`)
          this.pointer = index
        }
      } else {
        this.body.style.setProperty('transition-property', 'transform')
        this.body.style.setProperty('transform', `translate(0,${Math.max(-top, -maxTop)}px)`)
        this.pointer = index + 1
      }
    } else if (direction === 'up'
    ) {
      if (itemBox.bottom < (elementBox.bottom - (elementBox.height * this.threshold))) {
        this.body.style.setProperty('transition-property', 'transform')
        this.body.style.setProperty('transform', `translate(0,${Math.max(-top, -maxTop)}px)`)
        this.pointer = index + 1
      } else {
        this.body.style.setProperty('transition-property', 'transform')
        this.body.style.setProperty('transform', `translate(0,${-top + itemBox.height}px)`)
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
    if (this.interact.dir === 'rtl') {
      this.moveToPointerXRtl()
    } else {
      this.moveToPointerXLtr()
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
          this.body.style.setProperty('transition-property', 'transform')
          this.body.style.setProperty('transform', `translate(${Math.max(-left, -maxLeft)}px)`)
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
          this.body.style.setProperty('transition-property', 'transform')
          this.body.style.setProperty('transform', `translate(${Math.min(right, maxRight)}px)`)
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
          this.body.style.setProperty('transition-property', 'transform')
          this.body.style.setProperty('transform', `translate(0,${Math.max(-top, -maxTop)}px)`)
          return true
        }

        top += elementHeight
        return false
      })
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-carousel-back', this.handleBackBound)
    this.removeEventListener('sc-carousel-forward', this.handleForwardBound)
    this.removeEventListener('sc-carousel-go', this.handleGoBound)
    this.body.removeEventListener('transitionend', this.handleTransitionendBound)
  }

  protected setTimingFunction (velocity: number): void {
    this.body.style.setProperty('transition-timing-function', this.interact.getTimingFunction(velocity))
  }
}
